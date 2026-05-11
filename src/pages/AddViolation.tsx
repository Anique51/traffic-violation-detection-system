import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createViolation } from "@/lib/db/violations";
import { getViolationTypes } from "@/lib/db/violation-types";
import { useAuth } from "@/hooks/useAuth";

export default function AddViolation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [violationType, setViolationType] = useState("");
  const [location, setLocation] = useState("");
  const [remarks, setRemarks] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(0);

  const { data: violationTypes = [] } = useQuery({
    queryKey: ['violation-types'],
    queryFn: getViolationTypes,
  });

  const createMutation = useMutation({
    mutationFn: createViolation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      toast.success("Violation added successfully!");
      setVehicleNumber("");
      setViolationType("");
      setLocation("");
      setRemarks("");
      setFineAmount(0);
      setPenaltyPoints(0);
      setImageFile(null);
      setImagePreview(null);
    },
    onError: (error) => {
      toast.error(`Failed to add violation: ${error.message}`);
    }
  });

  const handleViolationTypeChange = (type: string) => {
    setViolationType(type);
    const selectedType = violationTypes.find(vt => vt.name === type);
    if (selectedType) {
      setFineAmount(Number(selectedType.default_fine));
      setPenaltyPoints(Number(selectedType.penalty_points));
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `violations/manual_${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("evidence-images")
      .upload(fileName, file, { contentType: file.type, upsert: false });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("evidence-images").getPublicUrl(fileName);
    return data?.publicUrl || null;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleNumber || !violationType || !location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to add violations");
      return;
    }

    setIsUploading(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) toast.warning("Image upload failed — violation saved without image");
    }
    setIsUploading(false);

    await createMutation.mutateAsync({
      vehicle_number: vehicleNumber,
      image_url: imageUrl,
      violation_type: violationType,
      location: location,
      fine_amount: fineAmount,
      penalty_points: penaltyPoints,
      officer_id: user.id,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Add Custom Violation</h1>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Manual Violation Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vehicle Number Plate *</Label>
              <Input
                id="vehicle"
                placeholder="e.g., ABC-123"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Violation Type *</Label>
              <Select value={violationType} onValueChange={handleViolationTypeChange}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select violation type" />
                </SelectTrigger>
                <SelectContent>
                  {violationTypes.map(vt => (
                    <SelectItem key={vt.id} value={vt.name}>
                      {vt.name} - ₨{Number(vt.default_fine).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fine">Fine Amount *</Label>
              <Input
                id="fine"
                type="number"
                placeholder="Fine amount"
                value={fineAmount || ''}
                onChange={(e) => setFineAmount(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Main Street & 5th Avenue"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            {/* ── Working image uploader ── */}
            <div className="space-y-2">
              <Label htmlFor="snapshot">Upload Snapshot</Label>
              <label htmlFor="snapshot" className="cursor-pointer block">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg object-contain"
                      />
                      <p className="text-xs text-muted-foreground">{imageFile?.name}</p>
                      <p className="text-xs text-primary">Click to change image</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG or GIF (max. 5MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
              <Input
                id="snapshot"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional notes or observations..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                className="flex-1"
                disabled={isUploading || createMutation.isPending}
              >
                {isUploading ? "Uploading image..." : createMutation.isPending ? "Submitting..." : "Submit Violation"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setVehicleNumber("");
                  setViolationType("");
                  setLocation("");
                  setRemarks("");
                  setFineAmount(0);
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}