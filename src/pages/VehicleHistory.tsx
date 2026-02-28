import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, AlertCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getVehicle } from "@/lib/db/vehicles";
import { getViolationsByVehicle } from "@/lib/db/violations";
import { getCurrentMonthPenalty } from "@/lib/db/vehicle-penalty";

export default function VehicleHistory() {
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchedVehicle, setSearchedVehicle] = useState("");

  const { data: vehicleData, refetch } = useQuery({
    queryKey: ['vehicle', searchedVehicle],
    queryFn: () => getVehicle(searchedVehicle),
    enabled: !!searchedVehicle,
  });

  const { data: violations = [], refetch: refetchViolations } = useQuery({
    queryKey: ['vehicle-violations', searchedVehicle],
    queryFn: () => getViolationsByVehicle(searchedVehicle),
    enabled: !!searchedVehicle,
  });

  const { data: penaltySummary, refetch: refetchPenalty } = useQuery({
    queryKey: ['vehicle-penalty', searchedVehicle],
    queryFn: () => getCurrentMonthPenalty(searchedVehicle),
    enabled: !!searchedVehicle,
  });

  // Real-time subscription for violations and penalty summary
  useEffect(() => {
    if (!searchedVehicle) return;

    const violationsChannel = supabase
      .channel('vehicle-violations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'violations',
          filter: `vehicle_number=eq.${searchedVehicle}`,
        },
        () => {
          refetchViolations();
          refetch();
          refetchPenalty();
        }
      )
      .subscribe();

    const penaltyChannel = supabase
      .channel('vehicle-penalty-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_penalty_summary',
          filter: `vehicle_number=eq.${searchedVehicle}`,
        },
        () => {
          refetchPenalty();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(violationsChannel);
      supabase.removeChannel(penaltyChannel);
    };
  }, [searchedVehicle, refetchViolations, refetch, refetchPenalty]);

  const handleSearch = async () => {
    if (!searchVehicle.trim()) {
      toast.error("Please enter a vehicle number");
      return;
    }
    setSearchedVehicle(searchVehicle.toUpperCase());
    toast.success("Searching...");
  };

  const totalFines = violations.reduce((sum, v) => sum + Number(v.fine_amount), 0);
  const confirmedFines = violations
    .filter(v => v.status === "confirmed")
    .reduce((sum, v) => sum + Number(v.fine_amount), 0);
  const pendingFines = violations
    .filter(v => v.status === "pending")
    .reduce((sum, v) => sum + Number(v.fine_amount), 0);

  // Get confirmed violations for current month with penalty points breakdown
  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthConfirmedViolations = violations.filter(v => 
    v.status === 'confirmed' && 
    v.confirmed_at && 
    v.confirmed_at.slice(0, 7) === currentMonth
  );

  const searchResults = searchedVehicle ? violations : null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vehicle History</h1>

      {/* Search Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Search Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Enter vehicle number (e.g., ABC-123)"
              value={searchVehicle}
              onChange={(e) => setSearchVehicle(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searchResults !== null && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{searchResults.length}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₨{totalFines.toLocaleString()}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Confirmed: ₨{confirmedFines.toLocaleString()} | Pending: ₨{pendingFines.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card border-amber-500/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Penalty Points (Current Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {penaltySummary?.total_penalty_points || 0} pts
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Resets on 1st of each month
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Vehicle Number</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{searchedVehicle}</div>
              </CardContent>
            </Card>
          </div>

          {/* Current Month Penalty Breakdown */}
          {currentMonthConfirmedViolations.length > 0 && (
            <Card className="shadow-card border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Current Month Penalty Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentMonthConfirmedViolations.map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <div>
                        <span className="font-medium">{v.violation_type}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({new Date(v.confirmed_at!).toLocaleDateString()})
                        </span>
                      </div>
                      <Badge variant="secondary">+{v.penalty_points} pts</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Violations History Table */}
          {searchResults.length > 0 ? (
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Violation History</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Violation ID</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Location</th>
                        <th className="text-left p-3 font-medium">Fine</th>
                        <th className="text-left p-3 font-medium">Points</th>
                        <th className="text-left p-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((violation, idx) => (
                        <tr key={violation.id} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                          <td className="p-3 font-mono text-sm">{violation.id.slice(0, 8)}</td>
                          <td className="p-3">{violation.violation_type}</td>
                          <td className="p-3 text-sm">
                            {new Date(violation.timestamp || violation.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm">{violation.location}</td>
                          <td className="p-3 font-semibold">₨{Number(violation.fine_amount).toLocaleString()}</td>
                          <td className="p-3">
                            <Badge variant="outline">{violation.penalty_points} pts</Badge>
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                violation.status === "confirmed"
                                  ? "default"
                                  : violation.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {violation.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-card">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Violations Found</h3>
                <p className="text-muted-foreground">
                  This vehicle has no recorded violations in the system.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
