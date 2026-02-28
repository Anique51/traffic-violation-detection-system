import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getViolations } from "@/lib/db/violations";
import { format, subDays, startOfDay } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();

  // Fetch all violations
  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: getViolations,
  });

  // Calculate stats
  const today = startOfDay(new Date());
  const todayViolations = violations.filter(v => 
    startOfDay(new Date(v.timestamp)) >= today
  );
  
  const confirmedViolations = violations.filter(v => v.status === 'confirmed');
  const pendingViolations = violations.filter(v => v.status === 'pending');
  
  const totalFines = confirmedViolations.reduce((sum, v) => sum + Number(v.fine_amount), 0);

  // Generate daily trend for last 7 days
  const dailyTrend = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const count = violations.filter(v => {
      const vDate = new Date(v.timestamp);
      return vDate >= dayStart && vDate < dayEnd;
    }).length;
    
    return {
      day: format(date, 'EEE'),
      violations: count
    };
  });

  // Generate violation types distribution
  const typeCount: Record<string, number> = {};
  violations.forEach(v => {
    typeCount[v.violation_type] = (typeCount[v.violation_type] || 0) + 1;
  });
  
  const violationTypes = Object.entries(typeCount).map(([name, value], index) => ({
    name,
    value,
    color: `hsl(var(--chart-${(index % 5) + 1}))`
  }));

  // Recent violations (last 5)
  const recentViolations = violations.slice(0, 5);

  const stats = [
    {
      title: "Total Violations Today",
      value: todayViolations.length.toString(),
      icon: AlertCircle,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Confirmed Violations",
      value: confirmedViolations.length.toString(),
      icon: CheckCircle,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Pending Verifications",
      value: pendingViolations.length.toString(),
      icon: Clock,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
    {
      title: "Fines Collected",
      value: `₨${totalFines.toLocaleString()}`,
      icon: DollarSign,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Overview</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Daily Violations Trend */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Daily Violations Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="violations"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Violation Types Distribution */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Violation Types Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {violationTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={violationTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {violationTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No violation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations Table */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Violations</CardTitle>
            <Button variant="outline" onClick={() => navigate("/violations")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentViolations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Violation ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Vehicle No.</th>
                    <th className="text-left p-3 font-medium">Time</th>
                    <th className="text-left p-3 font-medium">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {recentViolations.map((violation, idx) => (
                    <tr key={violation.id} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="p-3 font-mono text-sm">{violation.id.slice(0, 8)}</td>
                      <td className="p-3">{violation.violation_type}</td>
                      <td className="p-3 font-mono">{violation.vehicle_number}</td>
                      <td className="p-3">{format(new Date(violation.timestamp), 'HH:mm a')}</td>
                      <td className="p-3">{violation.location}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No violations recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Button
          onClick={() => navigate("/violations")}
          className="h-20 text-lg rounded-md bg-muted/50 hover:bg-primary hover:text-primary-foreground dark:bg-background"
          variant="outline"
        >
          View All Violations
        </Button>
        <Button
          onClick={() => navigate("/reports")}
          className="h-20 text-lg rounded-md bg-muted/50 hover:bg-primary hover:text-primary-foreground dark:bg-background"
          variant="outline"
        >
          View Statistics
        </Button>
        <Button
          onClick={() => navigate("/map")}
          className="h-20 text-lg rounded-md bg-muted/50 hover:bg-primary hover:text-primary-foreground dark:bg-background"
          variant="outline"
        >
          View Map
        </Button>
      </div>
    </div>
  );
}
