import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Check, X, Trash2, Download, Send } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getViolations, updateViolation, deleteViolation, Violation } from "@/lib/db/violations";
import { getViolationTypes } from "@/lib/db/violation-types";
import { getVehicleOwner, VehicleOwner } from "@/lib/db/vehicle-owners";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import EChallan from "@/components/challan/EChallan";

interface ChallanData {
  ticket_no: string;
  registration_no: string;
  violation_type: string;
  fine_amount: number;
  violation_location: string;
  violation_date: string;
  due_date: string;
  evidence_image_url: string | null;
  officer_name: string;
  penalty_count: number;
  owner: VehicleOwner | null;
}

// Helper to render challan to HTML string
const renderChallanToHtml = (data: ChallanData): string => {
  const ownerName = data.owner 
    ? [data.owner.first_name, data.owner.middle_name, data.owner.last_name].filter(Boolean).join(' ')
    : 'N/A';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .challan { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
        .header h1 { margin: 0; font-size: 24px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .section { border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
        .section h2 { background: #f0f0f0; padding: 8px; margin: 0 0 10px 0; font-size: 14px; }
        .row { display: flex; margin-bottom: 5px; font-size: 12px; }
        .label { font-weight: bold; margin-right: 5px; }
        .legal { font-size: 11px; }
      </style>
    </head>
    <body>
      <div class="challan">
        <div class="header">
          <h1>PUNJAB TRAFFIC POLICE</h1>
          <p>E-CHALLAN / TRAFFIC VIOLATION TICKET</p>
        </div>
        <div class="section">
          <div class="grid">
            <div>
              <div class="row"><span class="label">Ticket No:</span> ${data.ticket_no}</div>
              <div class="row"><span class="label">Registration No:</span> ${data.registration_no}</div>
              <div class="row"><span class="label">Violation Type:</span> ${data.violation_type}</div>
              <div class="row"><span class="label">Fine Amount:</span> Rs. ${data.fine_amount.toLocaleString()}</div>
            </div>
            <div style="text-align: center;">
              <div style="border: 1px solid #000; padding: 10px;">||| ||| || ||| || ||| |||</div>
              <p style="font-size: 10px;">${data.ticket_no}</p>
            </div>
            <div style="text-align: right;">
              <div class="row" style="justify-content: flex-end;"><span class="label">Due Date:</span> ${data.due_date}</div>
              <p style="font-size: 10px;">Payment Within Due Date</p>
            </div>
          </div>
        </div>
        <div class="section">
          <h2>VEHICLE OWNER / DRIVER DETAILS</h2>
          <div class="row"><span class="label">Name:</span> ${ownerName}</div>
          <div class="row"><span class="label">Father's Name:</span> ${data.owner?.father_name || 'N/A'}</div>
          <div class="row"><span class="label">Address:</span> ${data.owner?.address || 'N/A'}</div>
          <div class="row"><span class="label">City:</span> ${data.owner?.city || 'N/A'}</div>
          <div class="row"><span class="label">Phone Number:</span> ${data.owner?.phone_number || 'N/A'}</div>
          <div class="row"><span class="label">Email:</span> ${data.owner?.email || 'N/A'}</div>
          <div class="row"><span class="label">Vehicle Make:</span> ${data.owner?.vehicle_make || 'N/A'} (${data.owner?.vehicle_make_year || 'N/A'})</div>
          <div class="row"><span class="label">Color:</span> ${data.owner?.vehicle_color || 'N/A'}</div>
          <div class="row"><span class="label">Chassis No:</span> ${data.owner?.chassis_no || 'N/A'}</div>
          <div class="row"><span class="label">Engine No:</span> ${data.owner?.engine_no || 'N/A'}</div>
          <div class="row"><span class="label">Violation Location:</span> ${data.violation_location}</div>
        </div>
        <div class="section">
          <h2>PSCA-PPIC3-E-TICKETING CENTER</h2>
          <div class="row"><span class="label">ID:</span> PSCA-${data.ticket_no.slice(-6)}</div>
          <div class="row"><span class="label">Issue Date:</span> ${data.violation_date}</div>
          <div class="row"><span class="label">Penalty:</span> ${data.penalty_count}</div>
        </div>
        <div class="section legal">
          <p>The traffic infraction enforcement officer named herein has reviewed the recorded images evidencing the violation, has identified the registration number of violating vehicle and has found reasonable and probable grounds that a violation has been committed.</p>
          <p><strong>INSTRUCTIONS:</strong> You have been fined under Section 116-A of motor vehicle ordinance 1965. Please pay your fine within 10 days of issuance of this notice, failing which your vehicle can also be impounded till payment of outstanding fine.</p>
        </div>
        <div class="section">
          <div class="row"><span class="label">Issuing Officer:</span> ${data.officer_name}</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function Violations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [challanData, setChallanData] = useState<ChallanData | null>(null);
  const [currentViolationId, setCurrentViolationId] = useState<string | null>(null);
  const [showChallanDialog, setShowChallanDialog] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendingViolationId, setSendingViolationId] = useState<string | null>(null);

  // Fetch violations
  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: getViolations,
  });

  // Fetch violation types for filter
  const { data: violationTypes = [] } = useQuery({
    queryKey: ['violation-types'],
    queryFn: getViolationTypes,
  });

  // Fetch current user profile for officer name
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Violation> }) =>
      updateViolation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteViolation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    },
  });

  const filteredViolations = violations.filter((v) => {
    const matchesType = filterType === "all" || v.violation_type === filterType;
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    const matchesSearch =
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  // Generate ticket number
  const generateTicketNumber = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PTP-${year}-${random}`;
  };

  // Count violations for a vehicle (penalty count)
  const getViolationCount = (vehicleNumber: string) => {
    return violations.filter(v => 
      v.vehicle_number === vehicleNumber && 
      v.status === 'confirmed'
    ).length + 1; // +1 for current
  };

  const handleConfirm = async (violation: Violation) => {
    setIsConfirming(true);
    try {
      // Generate ticket number and calculate due date
      const ticketNo = generateTicketNumber();
      const violationDate = new Date(violation.timestamp);
      const dueDate = addDays(violationDate, 15);
      
      // Update violation with ticket info
      await updateMutation.mutateAsync({ 
        id: violation.id, 
        updates: { 
          status: 'confirmed',
          ticket_no: ticketNo,
          due_date: format(dueDate, 'yyyy-MM-dd'),
          officer_id: user?.id
        } 
      });
      
      // Fetch vehicle owner details
      const owner = await getVehicleOwner(violation.vehicle_number);
      
      // Get penalty count
      const penaltyCount = getViolationCount(violation.vehicle_number);
      
      // Prepare challan data
      const challan: ChallanData = {
        ticket_no: ticketNo,
        registration_no: violation.vehicle_number,
        violation_type: violation.violation_type,
        fine_amount: Number(violation.fine_amount),
        violation_location: violation.location,
        violation_date: violation.timestamp,
        due_date: format(dueDate, 'yyyy-MM-dd'),
        evidence_image_url: violation.image_url || null,
        officer_name: userProfile?.name || 'Officer',
        penalty_count: penaltyCount,
        owner: owner,
      };
      
      setChallanData(challan);
      setCurrentViolationId(violation.id);
      setShowChallanDialog(true);
      
      queryClient.invalidateQueries({ queryKey: ['vehicle-penalty'] });
      toast.success("Violation confirmed - Challan generated");
    } catch (error) {
      console.error('Error confirming violation:', error);
      toast.error("Failed to confirm violation");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = async (id: string) => {
    await updateMutation.mutateAsync({ id, updates: { status: 'dismissed' } });
    toast.success("Violation dismissed");
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast.success("Violation deleted");
  };

  const handleSendChallan = async (violationId?: string) => {
    const dataToSend = challanData;
    const vidToUse = violationId || currentViolationId;
    
    if (!dataToSend || !dataToSend.owner?.email) {
      toast.error("Driver email not available");
      return;
    }

    if (violationId) {
      setSendingViolationId(violationId);
    } else {
      setIsSendingEmail(true);
    }
    
    try {
      const ownerName = dataToSend.owner 
        ? [dataToSend.owner.first_name, dataToSend.owner.middle_name, dataToSend.owner.last_name].filter(Boolean).join(' ')
        : 'N/A';

      // Prepare challan data for edge function
      const emailChallanData = {
        ticketNo: dataToSend.ticket_no,
        registrationNo: dataToSend.registration_no,
        violationType: dataToSend.violation_type,
        fineAmount: dataToSend.fine_amount,
        violationLocation: dataToSend.violation_location,
        violationDate: format(new Date(dataToSend.violation_date), 'dd-MM-yyyy'),
        dueDate: format(new Date(dataToSend.due_date), 'dd-MM-yyyy'),
        officerName: dataToSend.officer_name,
        penaltyCount: dataToSend.penalty_count,
        ownerName: ownerName,
        fatherName: dataToSend.owner?.father_name || 'N/A',
        address: dataToSend.owner?.address || 'N/A',
        city: dataToSend.owner?.city || 'N/A',
        phoneNumber: dataToSend.owner?.phone_number || 'N/A',
        email: dataToSend.owner?.email || 'N/A',
        vehicleMake: dataToSend.owner?.vehicle_make || 'N/A',
        vehicleYear: dataToSend.owner?.vehicle_make_year || null,
        vehicleColor: dataToSend.owner?.vehicle_color || 'N/A',
        chassisNo: dataToSend.owner?.chassis_no || 'N/A',
        engineNo: dataToSend.owner?.engine_no || 'N/A',
      };
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-challan-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: dataToSend.owner.email,
          ticketNo: dataToSend.ticket_no,
          violationId: vidToUse,
          challanData: emailChallanData,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Challan sent successfully to ${dataToSend.owner.email}`);
        queryClient.invalidateQueries({ queryKey: ['violations'] });
        setShowChallanDialog(false);
        setChallanData(null);
        setCurrentViolationId(null);
      } else {
        queryClient.invalidateQueries({ queryKey: ['violations'] });
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending challan:', error);
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      toast.error("Failed to send challan email");
    } finally {
      setIsSendingEmail(false);
      setSendingViolationId(null);
    }
  };

  // Function to send challan from table row
  const handleSendChallanFromRow = async (violation: Violation) => {
    if (!violation.ticket_no || !violation.due_date) {
      toast.error("Violation is missing ticket details");
      return;
    }

    setSendingViolationId(violation.id);
    
    try {
      // Fetch vehicle owner details
      const owner = await getVehicleOwner(violation.vehicle_number);
      
      if (!owner?.email) {
        toast.error("Driver email not available");
        setSendingViolationId(null);
        return;
      }
      
      // Get penalty count
      const penaltyCount = getViolationCount(violation.vehicle_number);
      
      // Prepare challan data
      const challan: ChallanData = {
        ticket_no: violation.ticket_no,
        registration_no: violation.vehicle_number,
        violation_type: violation.violation_type,
        fine_amount: Number(violation.fine_amount),
        violation_location: violation.location,
        violation_date: violation.timestamp,
        due_date: violation.due_date,
        evidence_image_url: violation.image_url || null,
        officer_name: userProfile?.name || 'Officer',
        penalty_count: penaltyCount,
        owner: owner,
      };
      
      setChallanData(challan);
      setCurrentViolationId(violation.id);
      
      // Now send
      const ownerName = [owner.first_name, owner.middle_name, owner.last_name].filter(Boolean).join(' ');

      const emailChallanData = {
        ticketNo: challan.ticket_no,
        registrationNo: challan.registration_no,
        violationType: challan.violation_type,
        fineAmount: challan.fine_amount,
        violationLocation: challan.violation_location,
        violationDate: format(new Date(challan.violation_date), 'dd-MM-yyyy'),
        dueDate: format(new Date(challan.due_date), 'dd-MM-yyyy'),
        officerName: challan.officer_name,
        penaltyCount: challan.penalty_count,
        ownerName: ownerName,
        fatherName: owner.father_name || 'N/A',
        address: owner.address || 'N/A',
        city: owner.city || 'N/A',
        phoneNumber: owner.phone_number || 'N/A',
        email: owner.email,
        vehicleMake: owner.vehicle_make || 'N/A',
        vehicleYear: owner.vehicle_make_year || null,
        vehicleColor: owner.vehicle_color || 'N/A',
        chassisNo: owner.chassis_no || 'N/A',
        engineNo: owner.engine_no || 'N/A',
      };
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-challan-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail: owner.email,
          ticketNo: challan.ticket_no,
          violationId: violation.id,
          challanData: emailChallanData,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`Challan sent successfully to ${owner.email}`);
        queryClient.invalidateQueries({ queryKey: ['violations'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['violations'] });
        toast.error(`Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending challan:', error);
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      toast.error("Failed to send challan email");
    } finally {
      setSendingViolationId(null);
      setChallanData(null);
      setCurrentViolationId(null);
    }
  };

  const getEmailStatusBadge = (status: string | undefined) => {
    if (!status || status === 'not_sent') {
      return <Badge variant="outline" className="text-muted-foreground">Not Sent</Badge>;
    }
    if (status === 'sent') {
      return <Badge className="bg-success text-success-foreground">Sent</Badge>;
    }
    if (status === 'failed') {
      return <Badge className="bg-destructive text-destructive-foreground">Failed</Badge>;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-warning text-warning-foreground",
      confirmed: "bg-success text-success-foreground",
      dismissed: "bg-muted text-muted-foreground",
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Use violation types from DB for filter
  const availableTypes = violationTypes.map(vt => vt.name);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p>Loading violations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Violation Management</h1>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search by ID or Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Violation Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Violations ({filteredViolations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredViolations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">ID</th>
                    <th className="text-left p-3 font-medium">Type</th>
                    <th className="text-left p-3 font-medium">Vehicle</th>
                    <th className="text-left p-3 font-medium">Date/Time</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">Fine</th>
                    <th className="text-left p-3 font-medium">Points</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredViolations.map((violation, idx) => (
                    <tr key={violation.id} className={idx % 2 === 0 ? "bg-muted/50" : ""}>
                      <td className="p-3 font-mono text-sm">{violation.id.slice(0, 8)}</td>
                      <td className="p-3">{violation.violation_type}</td>
                      <td className="p-3 font-mono font-semibold">{violation.vehicle_number}</td>
                      <td className="p-3">
                        {format(new Date(violation.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="p-3">{violation.location}</td>
                      <td className="p-3">{getStatusBadge(violation.status)}</td>
                      <td className="p-3">
                        {violation.status === 'confirmed' ? getEmailStatusBadge(violation.email_status) : '-'}
                      </td>
                      <td className="p-3">₨{Number(violation.fine_amount).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="outline">{violation.penalty_points} pts</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedViolation(violation)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {violation.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleConfirm(violation)}
                                className="text-success"
                                disabled={isConfirming}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDismiss(violation.id)}
                                className="text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {violation.status === 'confirmed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendChallanFromRow(violation)}
                              disabled={sendingViolationId === violation.id}
                              className="text-primary"
                              title="Send Challan Email"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(violation.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No violations found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violation Details Dialog (Eye button - basic info only) */}
      <Dialog open={!!selectedViolation} onOpenChange={() => setSelectedViolation(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Violation Details</DialogTitle>
            <DialogDescription>{selectedViolation?.id}</DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {selectedViolation.image_url ? (
                  <img src={selectedViolation.image_url} alt="Violation evidence" className="object-cover rounded-lg" />
                ) : (
                  <p className="text-muted-foreground">No evidence image available</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-1">Violation Type</h4>
                  <p>{selectedViolation.violation_type}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Vehicle Number</h4>
                  <p className="font-mono">{selectedViolation.vehicle_number}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Date & Time</h4>
                  <p>{format(new Date(selectedViolation.timestamp), 'MMM dd, yyyy HH:mm a')}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Location</h4>
                  <p>{selectedViolation.location}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Status</h4>
                  {getStatusBadge(selectedViolation.status)}
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Fine Amount</h4>
                  <p className="text-lg font-semibold">₨{Number(selectedViolation.fine_amount).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Penalty Points</h4>
                  <Badge variant="secondary">{selectedViolation.penalty_points} pts</Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Challan Dialog (shown after confirm) */}
      <Dialog open={showChallanDialog} onOpenChange={setShowChallanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>E-Challan Generated</DialogTitle>
            <DialogDescription>
              Ticket No: {challanData?.ticket_no}
            </DialogDescription>
          </DialogHeader>
          {challanData && (
            <div className="space-y-4">
              <EChallan data={challanData} showDuplicate={false} />
              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowChallanDialog(false)}>
                  Close
                </Button>
                <Button onClick={() => handleSendChallan()} className="bg-primary" disabled={isSendingEmail}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSendingEmail ? "Sending..." : "Send Challan"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}