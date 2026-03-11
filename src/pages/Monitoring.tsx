import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle, AlertCircle, Play, Loader2, Eye, ShieldAlert } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCameraFeeds, CameraFeed } from "@/lib/db/camera-feeds";
import { getViolationTypes } from "@/lib/db/violation-types";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Detection {
  violation_type: string;
  yolo_class: string;
  confidence: number;            // 0-100
  bbox: { x1: number; y1: number; x2: number; y2: number };
  cropped_image: string | null;  // base64 JPEG — used as evidence image
  force_save?: boolean;
  evidence_image: string;

}

interface DetectionResponse {
  annotated_frame: string;       // base64 full annotated frame
  detections: Detection[];
  total_detections: number;
}

// Minimum confidence % to save a violation to the DB
const CONFIDENCE_THRESHOLD = 60;

// How often to send a frame (ms)
const DETECTION_INTERVAL_MS = 2000;

// ──────────────────────────────────────────────────────────────────────────────

export default function Monitoring() {
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [lastDetectionTime, setLastDetectionTime] = useState<string | null>(null);
  const [recentViolations, setRecentViolations] = useState<Detection[]>([]);

  const mainVideoRef = useRef<HTMLVideoElement>(null);
  const lastRedLightSaveRef = useRef<number>(0);
  const DUMMY_PLATES = ["LER-8600", "ALS-1234", "LHE-987", "RWP-222", "JHE-2345", "XYZ-789"];
  const plateIndexRef = useRef<number>(0);

  const getNextPlate = () => {
    const plate = DUMMY_PLATES[plateIndexRef.current % DUMMY_PLATES.length];
    plateIndexRef.current += 1;
    return plate;
  };

  // ── DB queries ──────────────────────────────────────────────────────────────

  const { data: cameraFeeds = [], refetch } = useQuery({
    queryKey: ['camera-feeds'],
    queryFn: getCameraFeeds,
  });

  // Fetch violation types so we can look up fine_amount and penalty_points by name
  const { data: violationTypes = [] } = useQuery({
    queryKey: ['violation-types'],
    queryFn: getViolationTypes,
  });

  // Real-time subscription for camera feeds
  useEffect(() => {
    const channel = supabase
      .channel('camera-feeds-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'camera_feeds' }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  // Set first active camera as default
  useEffect(() => {
    if (!selectedCamera && cameraFeeds.length > 0) {
      const firstActive = cameraFeeds.find(
        feed => feed.is_active && feed.camera_locations?.status === 'active'
      );
      setSelectedCamera(firstActive || cameraFeeds[0]);
    }
  }, [cameraFeeds, selectedCamera]);

  const activeCameras = cameraFeeds.filter(
    feed => feed.is_active && feed.camera_locations?.status === 'active'
  );
  const offlineCameras = cameraFeeds.filter(
    feed => !feed.is_active || feed.camera_locations?.status === 'offline'
  );

  // ── Upload evidence image to Supabase Storage ───────────────────────────────

  const uploadEvidenceImage = useCallback(async (
    base64Image: string,
    violationId: string
  ): Promise<string | null> => {
    try {
      // Convert base64 to Blob
      const byteString = atob(base64Image);
      const byteArray = new Uint8Array(byteString.length);
      for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      const fileName = `violations/${violationId}_${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from("evidence-images")   // ← your Supabase storage bucket name
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: false });

      if (error) {
        console.error("Storage upload error:", error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("evidence-images")
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error("Evidence upload failed:", err);
      return null;
    }
  }, []);

  // ── Save a single detection as a violation row in Supabase ──────────────────

  const saveViolation = useCallback(async (
    detection: Detection,
    cameraLocation: string,
    cameraId: string,
    timestamp: string,
  ) => {
    // Look up fine_amount and penalty_points from violation types in DB
    const vtRecord = violationTypes.find(
      vt => vt.name.toLowerCase() === detection.violation_type.toLowerCase()
    );

    const fine_amount   = vtRecord?.default_fine   ?? 500;   // fallback default
    const penalty_points = vtRecord?.penalty_points ?? 1;

    // Generate a temporary ID for the storage path (Supabase will generate the real UUID)
    const tempId = crypto.randomUUID();

    // Upload the cropped evidence image first
    let imageUrl: string | null = null;
    const imageData = detection.evidence_image || detection.cropped_image;
    if (imageData) {
      imageUrl = await uploadEvidenceImage(imageData, tempId);
    }

    // Insert violation row
    const { error } = await supabase.from("violations").insert({
      violation_type: detection.violation_type,
      vehicle_number: getNextPlate(),
      location:       cameraLocation,
      timestamp:      timestamp,
      status:         "pending",
      fine_amount:    fine_amount,
      penalty_points: penalty_points,
      image_url:      imageUrl,
    });

    if (error) {
      console.error("Failed to save violation:", error);
    }
  }, [violationTypes, uploadEvidenceImage]);

  // ── Frame capture ───────────────────────────────────────────────────────────

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    if (!mainVideoRef.current) return null;
    const video = mainVideoRef.current;
    if (!video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.85);
    });
  }, []);

  // ── Main detection function ─────────────────────────────────────────────────

  const sendFrameToBackend = useCallback(async () => {
    if (!selectedCamera) return;

    const blob = await captureFrame();
    if (!blob) return;

    setIsDetecting(true);
    setDetectionError(null);

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");
    formData.append("camera_id", selectedCamera.feed_url ?? "");

    try {
      const response = await fetch("http://127.0.0.1:8000/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`Backend returned ${response.status}`);

      const data: DetectionResponse = await response.json();

      // ADD THESE TEMPORARILY
      console.log("Raw detections from backend:", data.detections);
      console.log("Qualifying detections (>=60%):", data.detections.filter(d => d.confidence >= CONFIDENCE_THRESHOLD));
      console.log("Violation types from DB:", violationTypes);
      // Update the annotated frame display
      setAnnotatedImage(data.annotated_frame);
      setLastDetectionTime(new Date().toLocaleTimeString());

      // ── Filter detections above confidence threshold ──────────────────────
      const now = Date.now();

      const qualifyingDetections = data.detections.filter(d => {
        if (d.force_save === true) {
          if (now - lastRedLightSaveRef.current < 4000) return false;
          return d.confidence >= 85;  // 85% threshold for red light
        }
        return d.confidence >= CONFIDENCE_THRESHOLD;
      });

      // If any red light violation qualified, update the timestamp
      if (qualifyingDetections.some(d => d.force_save === true)) {
        lastRedLightSaveRef.current = now;
      }

      if (qualifyingDetections.length > 0) {
        setRecentViolations(qualifyingDetections);

        const timestamp = new Date().toISOString();
        const cameraLocation = selectedCamera.camera_locations?.location_name || "Unknown Location";
        const cameraId = selectedCamera.id;

        // Save each qualifying detection as a separate violation
        await Promise.all(
          qualifyingDetections.map(detection =>
            saveViolation(detection, cameraLocation, cameraId, timestamp)
          )
        );
      }

    } catch (error) {
      console.error("Detection error:", error);
      setDetectionError("Cannot connect to detection backend. Make sure it is running on port 8000.");
    } finally {
      setIsDetecting(false);
    }
  }, [selectedCamera, captureFrame, saveViolation]);

  // ── Detection interval ──────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => {
      if (mainVideoRef.current && !mainVideoRef.current.paused) {
        sendFrameToBackend();
      }
    }, DETECTION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sendFrameToBackend]);

  // ── Camera selection ────────────────────────────────────────────────────────

  const handleCameraSelect = (feed: CameraFeed) => {
    setSelectedCamera(feed);
    setAnnotatedImage(null);
    setDetectionError(null);
    setRecentViolations([]);
    if (mainVideoRef.current) mainVideoRef.current.load();
  };

  const getVideoUrl = (feed_url: string) => feed_url;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Live Monitoring</h1>
        <div className="flex gap-4">
          <Badge variant="outline" className="text-success">
            <CheckCircle className="w-4 h-4 mr-2" />
            {activeCameras.length} Active
          </Badge>
          <Badge variant="outline" className="text-destructive">
            <AlertCircle className="w-4 h-4 mr-2" />
            {offlineCameras.length} Offline
          </Badge>
        </div>
      </div>

      {/* Main Feed */}
      {selectedCamera && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {selectedCamera.camera_locations?.location_name || 'Unknown Location'}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedCamera.description || 'No description'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isDetecting && (
                  <Badge variant="outline" className="text-blue-500 border-blue-500">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Analyzing...
                  </Badge>
                )}
                <Badge
                  variant={
                    selectedCamera.is_active && selectedCamera.camera_locations?.status === 'active'
                      ? "default" : "destructive"
                  }
                  className={
                    selectedCamera.is_active && selectedCamera.camera_locations?.status === 'active'
                      ? "bg-success text-success-foreground" : ""
                  }
                >
                  {selectedCamera.is_active && selectedCamera.camera_locations?.status === 'active'
                    ? "Active" : "Offline"}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Live Video */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedCamera.feed_url ? (
                <video
                  ref={mainVideoRef}
                  key={selectedCamera.id}
                  src={getVideoUrl(selectedCamera.feed_url)}
                  className="w-full h-full object-contain"
                  controls
                  autoPlay
                  loop
                  controlsList="nodownload"
                  onError={(e) => console.error('Video load error:', e)}
                  onLoadedMetadata={() => console.log('Video loaded:', selectedCamera.feed_url)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Video className="w-16 h-16 mb-2" />
                  <p className="text-sm">No video feed available</p>
                </div>
              )}
            </div>

            {/* Backend error */}
            {detectionError && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{detectionError}</p>
              </div>
            )}

            {/* Recent violations detected this session */}
            {recentViolations.length > 0 && (
              <div className="mt-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-destructive">
                  <ShieldAlert className="w-4 h-4" />
                  Violations Detected ({recentViolations.length}) — Saved to Violations Tab
                </h3>
                <div className="grid gap-2">
                  {recentViolations.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-background rounded p-2 border"
                    >
                      <div className="flex items-center gap-3">
                        {d.cropped_image && (
                          <img
                            src={`data:image/jpeg;base64,${d.cropped_image}`}
                            alt="evidence"
                            className="w-16 h-12 object-cover rounded border"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{d.violation_type}</p>
                          <p className="text-xs text-muted-foreground">
                            Class: {d.yolo_class}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          d.confidence >= 80
                            ? "bg-destructive text-destructive-foreground"
                            : d.confidence >= 60
                            ? "bg-warning text-warning-foreground"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {d.confidence.toFixed(1)}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YOLO Annotated Output */}
            {annotatedImage && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    AI Detection Output
                  </h3>
                  {lastDetectionTime && (
                    <span className="text-xs text-muted-foreground">
                      Last updated: {lastDetectionTime}
                    </span>
                  )}
                </div>
                <img
                  src={`data:image/jpeg;base64,${annotatedImage}`}
                  alt="YOLO Detection"
                  className="w-full rounded-lg border border-border"
                />
              </div>
            )}

          </CardContent>
        </Card>
      )}

      {/* Camera Thumbnails Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Camera Feeds</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {cameraFeeds.map((feed) => {
            const isActive = feed.is_active && feed.camera_locations?.status === 'active';
            const isSelected = selectedCamera?.id === feed.id;

            return (
              <Card
                key={feed.id}
                className={`shadow-card cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleCameraSelect(feed)}
              >
                <CardHeader className="pb-2 px-3 pt-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm line-clamp-2">
                      {feed.camera_locations?.location_name || 'Unknown Location'}
                    </CardTitle>
                    <Badge
                      variant={isActive ? "default" : "destructive"}
                      className={`shrink-0 text-xs ${isActive ? "bg-success text-success-foreground" : ""}`}
                    >
                      {isActive ? "●" : "○"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-3 pb-3">
                  <div className="aspect-video bg-black rounded overflow-hidden relative group">
                    {feed.feed_url ? (
                      <>
                        <video
                          src={getVideoUrl(feed.feed_url)}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        {!isSelected && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}