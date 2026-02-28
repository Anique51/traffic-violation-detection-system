import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
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
import { Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { getViolations } from "@/lib/db/violations";
import { getCameras } from "@/lib/db/cameras";

export default function Reports() {
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [violationType, setViolationType] = useState("all");
  const [location, setLocation] = useState("all");
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null,
  });

  const { data: allViolations = [], refetch } = useQuery({
    queryKey: ['violations-reports'],
    queryFn: getViolations,
  });

  const { data: cameras = [] } = useQuery({
    queryKey: ['cameras-reports'],
    queryFn: getCameras,
  });

  // Filter violations based on selected filters
  const violations = allViolations.filter((v) => {
    // Filter by violation type
    if (violationType !== 'all' && v.violation_type !== violationType) {
      return false;
    }
    
    // Filter by location
    if (location !== 'all' && v.location !== location) {
      return false;
    }
    
    // Filter by date range
    if (dateRange.start && dateRange.end) {
      const vDate = new Date(v.timestamp || v.created_at);
      if (vDate < dateRange.start || vDate > dateRange.end) {
        return false;
      }
    }
    
    return true;
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('violations-reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'violations',
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  // Calculate monthly data from violations
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const monthName = date.toLocaleString('default', { month: 'short' });
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const count = violations.filter(v => {
      const vDate = new Date(v.timestamp || v.created_at);
      const vMonthYear = `${vDate.getFullYear()}-${String(vDate.getMonth() + 1).padStart(2, '0')}`;
      return vMonthYear === monthYear;
    }).length;

    return { month: monthName, violations: count };
  });

  // Calculate violations by location
  const locationCounts = violations.reduce((acc, v) => {
    acc[v.location] = (acc[v.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate violation types
  const typeCounts = violations.reduce((acc, v) => {
    acc[v.violation_type] = (acc[v.violation_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const violationTypesData = Object.entries(typeCounts).map(([name, value], index) => ({
    name,
    value,
    color: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  // Calculate hourly pattern
  const hourCounts = violations.reduce((acc, v) => {
    const hour = new Date(v.timestamp || v.created_at).getHours();
    const hourKey = Math.floor(hour / 4) * 4;
    acc[hourKey] = (acc[hourKey] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const hourlyPattern = Array.from({ length: 6 }, (_, i) => {
    const hour = i * 4;
    return {
      hour: `${String(hour).padStart(2, '0')}:00`,
      count: hourCounts[hour] || 0,
    };
  });

  // Calculate statistics from filtered violations
  const totalViolations = violations.length;
  const totalFines = violations.reduce((sum, v) => sum + Number(v.fine_amount), 0);
  const confirmedCount = violations.filter(v => v.status === 'confirmed').length;
  const confirmationRate = totalViolations > 0 ? (confirmedCount / totalViolations * 100).toFixed(1) : '0';
  const activeCameras = cameras.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Statistics</h1>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Select value={timePeriod} onValueChange={setTimePeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={violationType} onValueChange={setViolationType}>
              <SelectTrigger>
                <SelectValue placeholder="Violation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {violationTypesData.map(type => (
                  <SelectItem key={type.name} value={type.name.toLowerCase()}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locationData.map(loc => (
                  <SelectItem key={loc.location} value={loc.location.toLowerCase()}>
                    {loc.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Monthly Violations Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
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

        {/* Violation Types */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Violations by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={violationTypesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {violationTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Location Statistics */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Violations by Location</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="location" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-2))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Pattern */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Hourly Violation Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyPattern}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--chart-3))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Statistics */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-chart-1">{totalViolations.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Total Violations</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-chart-2">₨{(totalFines / 1000).toFixed(1)}K</div>
              <div className="text-sm text-muted-foreground mt-1">Total Fines</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-chart-3">{confirmationRate}%</div>
              <div className="text-sm text-muted-foreground mt-1">Confirmation Rate</div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-chart-4">{activeCameras}</div>
              <div className="text-sm text-muted-foreground mt-1">Active Cameras</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
