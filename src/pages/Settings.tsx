import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Edit, Save, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getViolationTypes, updateViolationType } from "@/lib/db/violation-types";

export default function Settings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFineValue, setEditFineValue] = useState("");
  const [editPointsValue, setEditPointsValue] = useState("");

  // Fetch violation types from database
  const { data: violationTypes = [], isLoading } = useQuery({
    queryKey: ['violation-types'],
    queryFn: getViolationTypes,
  });

  // Mutation to update violation type
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { default_fine?: number; penalty_points?: number } }) => 
      updateViolationType(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violation-types'] });
      toast.success("Violation settings updated successfully!");
      setEditingId(null);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    }
  });

  const handleEdit = (id: string, currentFine: number, currentPoints: number) => {
    setEditingId(id);
    setEditFineValue(currentFine.toString());
    setEditPointsValue(currentPoints.toString());
  };

  const handleSave = (id: string) => {
    updateMutation.mutate({
      id,
      updates: {
        default_fine: parseInt(editFineValue),
        penalty_points: parseInt(editPointsValue),
      }
    });
  };

  const handleSystemSave = () => {
    toast.success("System settings saved successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Settings</h1>

      {/* Violation Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Violation Types Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure fine amounts and penalty points for each violation type. Changes apply only to future violations.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {violationTypes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {editingId === item.id ? (
                    <>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Fine (₨)</Label>
                        <Input
                          type="number"
                          value={editFineValue}
                          onChange={(e) => setEditFineValue(e.target.value)}
                          className="w-28"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Points</Label>
                        <Input
                          type="number"
                          value={editPointsValue}
                          onChange={(e) => setEditPointsValue(e.target.value)}
                          className="w-20"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleSave(item.id)}
                        disabled={updateMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          ₨{Number(item.default_fine).toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {item.penalty_points} pts
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item.id, Number(item.default_fine), item.penalty_points)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="sms-api">SMS Gateway API Key</Label>
            <Input
              id="sms-api"
              type="password"
              placeholder="Enter SMS API key"
              defaultValue="••••••••••••••••"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="email-api">Email Service API Key</Label>
            <Input
              id="email-api"
              type="password"
              placeholder="Enter Email API key"
              defaultValue="••••••••••••••••"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="sync-schedule">Database Sync Schedule (minutes)</Label>
            <Input
              id="sync-schedule"
              type="number"
              placeholder="15"
              defaultValue="15"
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="retention">Data Retention Period (days)</Label>
            <Input
              id="retention"
              type="number"
              placeholder="365"
              defaultValue="365"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSystemSave} className="flex-1">
              Save Changes
            </Button>
            <Button variant="outline" className="flex-1">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Language Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Switch between English and Urdu for the system interface
            </p>
            <div className="flex gap-3">
              <Button variant="default">English</Button>
              <Button variant="outline">اردو (Urdu)</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
