import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video, AlertCircle, CheckCircle } from "lucide-react";
import { MapComponent } from "@/components/map/MapComponent";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { getCameras } from "@/lib/db/cameras";

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapView() {
  const [showAll, setShowAll] = useState(true);
  const [showActive, setShowActive] = useState(true);
  const [showOffline, setShowOffline] = useState(true);

  // Fetch cameras
  const { data: cameras = [], isLoading } = useQuery({
    queryKey: ['cameras'],
    queryFn: getCameras,
  });

  const filteredCameras = cameras.filter((camera) => {
    if (!showAll) {
      if (camera.status === "active" && !showActive) return false;
      if (camera.status === "offline" && !showOffline) return false;
    }
    return true;
  });

  const camerasForMap = filteredCameras.map(camera => ({
    id: camera.id,
    name: camera.location_name,
    location: camera.location_name,
    position: [Number(camera.latitude), Number(camera.longitude)] as [number, number],
    status: camera.status,
    violations: camera.violation_count,
  }));

  const activeCount = cameras.filter((c) => c.status === "active").length;
  const offlineCount = cameras.filter((c) => c.status === "offline").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading camera locations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Camera Map View</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="shadow-card h-[600px]">
            <CardContent className="p-0 h-full">
              <MapComponent cameras={camerasForMap} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Filter Controls */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Filter Cameras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Show All</span>
                <Button
                  variant={showAll ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowAll(!showAll);
                    if (!showAll) {
                      setShowActive(true);
                      setShowOffline(true);
                    }
                  }}
                >
                  {showAll ? "On" : "Off"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active</span>
                <Button
                  variant={showActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowActive(!showActive)}
                  disabled={showAll}
                >
                  {showActive ? "On" : "Off"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Offline</span>
                <Button
                  variant={showOffline ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOffline(!showOffline)}
                  disabled={showAll}
                >
                  {showOffline ? "On" : "Off"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status Summary */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Camera Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Active</span>
                </div>
                <Badge variant="secondary">{activeCount}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <span className="font-medium">Offline</span>
                </div>
                <Badge variant="secondary">{offlineCount}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Camera List */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Camera List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {filteredCameras.map((camera) => (
                <div
                  key={camera.id}
                  className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{camera.location_name}</span>
                    </div>
                    <Badge
                      variant={camera.status === "active" ? "default" : "destructive"}
                    >
                      {camera.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {camera.location_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>{camera.violation_count} violations detected</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
