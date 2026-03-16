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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Check, X, Trash2, Download, Send, Mail, MessageCircle, ChevronDown } from "lucide-react";
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

type SendChannel = "email" | "whatsapp" | "both";

interface SendResult {
  emailSent: boolean;
  whatsappSent: boolean;
  emailError?: string | null;
  whatsappError?: string | null;
}

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
  const [sendingViolationId, setSendingViolationId] = useState<string | null>(null);
  const [isSendingChallan, setIsSendingChallan] = useState(false);

  const { data: violations = [], isLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: getViolations,
  });

  const { data: violationTypes = [] } = useQuery({
    queryKey: ['violation-types'],
    queryFn: getViolationTypes,
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Violation> }) =>
      updateViolation(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteViolation,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['violations'] }),
  });

  const filteredViolations = violations.filter((v) => {
    const matchesType   = filterType === "all" || v.violation_type === filterType;
    const matchesStatus = filterStatus === "all" || v.status === filterStatus;
    const matchesSearch =
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  const generateTicketNumber = () => {
    const year   = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `PTP-${year}-${random}`;
  };

  const getViolationCount = (vehicleNumber: string) =>
    violations.filter(v => v.vehicle_number === vehicleNumber && v.status === 'confirmed').length + 1;

  // ── Core send function ───────────────────────────────────────────────────────
  const sendChallanRequest = async (
    challan: ChallanData,
    violationId: string,
    channel: SendChannel
  ): Promise<SendResult> => {
    const owner = challan.owner;
    const ownerName = owner
      ? [owner.first_name, owner.middle_name, owner.last_name].filter(Boolean).join(' ')
      : 'N/A';

    const emailChallanData = {
      ticketNo:         challan.ticket_no,
      registrationNo:   challan.registration_no,
      violationType:    challan.violation_type,
      fineAmount:       challan.fine_amount,
      violationLocation: challan.violation_location,
      violationDate:    format(new Date(challan.violation_date), 'dd-MM-yyyy'),
      dueDate:          format(new Date(challan.due_date), 'dd-MM-yyyy'),
      officerName:      challan.officer_name,
      penaltyCount:     challan.penalty_count,
      ownerName,
      fatherName:       owner?.father_name   || 'N/A',
      address:          owner?.address       || 'N/A',
      city:             owner?.city          || 'N/A',
      phoneNumber:      owner?.phone_number  || 'N/A',
      email:            owner?.email         || 'N/A',
      vehicleMake:      owner?.vehicle_make  || 'N/A',
      vehicleYear:      owner?.vehicle_make_year || null,
      vehicleColor:     owner?.vehicle_color || 'N/A',
      chassisNo:        owner?.chassis_no    || 'N/A',
      engineNo:         owner?.engine_no     || 'N/A',
      evidenceImageUrl:  challan.evidence_image_url ?? null
    };

    console.log("Sending evidenceImageUrl:", emailChallanData.evidenceImageUrl);
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-challan-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientEmail: owner?.email,
        ticketNo:       challan.ticket_no,
        violationId,
        challanData:    emailChallanData,
        channel,        // ← tell edge function which channel(s) to use
      }),
    });

    const result = await response.json();
    return {
      emailSent:     result.emailSent     ?? false,
      whatsappSent:  result.whatsappSent  ?? false,
      emailError:    result.emailError    ?? null,
      whatsappError: result.whatsappError ?? null,
    };
  };

  // ── Show toast based on result ───────────────────────────────────────────────
  const showSendResultToast = (result: SendResult, channel: SendChannel) => {
    const { emailSent, whatsappSent, emailError, whatsappError } = result;

    if (channel === "email") {
      emailSent
        ? toast.success("✅ Challan sent via Email")
        : toast.error(`❌ Email failed: ${emailError || "Unknown error"}`);
      return;
    }

    if (channel === "whatsapp") {
      whatsappSent
        ? toast.success("✅ Challan sent via WhatsApp")
        : toast.error(`❌ WhatsApp failed: ${whatsappError || "Unknown error"}`);
      return;
    }

    // Both
    if (emailSent && whatsappSent) {
      toast.success("✅ Challan sent via Email and WhatsApp");
    } else if (emailSent && !whatsappSent) {
      toast.warning(`⚠️ Email sent ✅ — WhatsApp failed ❌: ${whatsappError || "Unknown error"}`);
    } else if (!emailSent && whatsappSent) {
      toast.warning(`⚠️ WhatsApp sent ✅ — Email failed ❌: ${emailError || "Unknown error"}`);
    } else {
      toast.error(`❌ Both failed — Email: ${emailError || "?"} | WhatsApp: ${whatsappError || "?"}`);
    }
  };

  // ── Send from challan dialog (after confirm) ─────────────────────────────────
  const handleSendChallan = async (channel: SendChannel) => {
    if (!challanData || !currentViolationId) return;
    if (!challanData.owner?.email && (channel === "email" || channel === "both")) {
      toast.error("Driver email not available");
      return;
    }
    if (!challanData.owner?.phone_number && (channel === "whatsapp" || channel === "both")) {
      toast.error("Driver phone number not available");
      return;
    }

    setIsSendingChallan(true);
    try {
      const result = await sendChallanRequest(challanData, currentViolationId, channel);
      showSendResultToast(result, channel);
      queryClient.invalidateQueries({ queryKey: ['violations'] });
      setShowChallanDialog(false);
      setChallanData(null);
      setCurrentViolationId(null);
    } catch (error) {
      toast.error("Failed to send challan");
    } finally {
      setIsSendingChallan(false);
    }
  };

  // ── Send from table row ───────────────────────────────────────────────────────
  const handleSendChallanFromRow = async (violation: Violation, channel: SendChannel) => {
    if (!violation.ticket_no || !violation.due_date) {
      toast.error("Violation is missing ticket details");
      return;
    }

    setSendingViolationId(violation.id);

    try {
      const owner = await getVehicleOwner(violation.vehicle_number);

      if (!owner?.email && (channel === "email" || channel === "both")) {
        toast.error("Driver email not available");
        return;
      }
      if (!owner?.phone_number && (channel === "whatsapp" || channel === "both")) {
        toast.error("Driver phone number not available");
        return;
      }

      const penaltyCount = getViolationCount(violation.vehicle_number);

      const challan: ChallanData = {
        ticket_no:          violation.ticket_no,
        registration_no:    violation.vehicle_number,
        violation_type:     violation.violation_type,
        fine_amount:        Number(violation.fine_amount),
        violation_location: violation.location,
        violation_date:     violation.timestamp,
        due_date:           violation.due_date,
        evidence_image_url: violation.image_url || null,
        officer_name:       userProfile?.name || 'Officer',
        penalty_count:      penaltyCount,
        owner,
      };

      const result = await sendChallanRequest(challan, violation.id, channel);
      showSendResultToast(result, channel);
      queryClient.invalidateQueries({ queryKey: ['violations'] });
    } catch (error) {
      toast.error("Failed to send challan");
    } finally {
      setSendingViolationId(null);
    }
  };

  const handleConfirm = async (violation: Violation) => {
    setIsConfirming(true);
    try {
      const ticketNo        = generateTicketNumber();
      const violationDate   = new Date(violation.timestamp);
      const dueDate         = addDays(violationDate, 15);

      await updateMutation.mutateAsync({
        id: violation.id,
        updates: {
          status:    'confirmed',
          ticket_no: ticketNo,
          due_date:  format(dueDate, 'yyyy-MM-dd'),
          officer_id: user?.id,
        },
      });

      const owner        = await getVehicleOwner(violation.vehicle_number);
      const penaltyCount = getViolationCount(violation.vehicle_number);

      const challan: ChallanData = {
        ticket_no:          ticketNo,
        registration_no:    violation.vehicle_number,
        violation_type:     violation.violation_type,
        fine_amount:        Number(violation.fine_amount),
        violation_location: violation.location,
        violation_date:     violation.timestamp,
        due_date:           format(dueDate, 'yyyy-MM-dd'),
        evidence_image_url: violation.image_url || null,
        officer_name:       userProfile?.name || 'Officer',
        penalty_count:      penaltyCount,
        owner,
      };

      setChallanData(challan);
      setCurrentViolationId(violation.id);
      setShowChallanDialog(true);
      queryClient.invalidateQueries({ queryKey: ['vehicle-penalty'] });
      toast.success("Violation confirmed — Challan generated");
    } catch (error) {
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

  // ── Email status badge with tooltip ──────────────────────────────────────────
  const getEmailStatusBadge = (violation: Violation) => {
    const status = violation.email_status;

    if (!status || status === 'not_sent') {
      return <Badge variant="outline" className="text-muted-foreground">Not Sent</Badge>;
    }

    if (status === 'sent') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-success text-success-foreground cursor-help">Sent</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs space-y-1">
                <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email ✅</p>
                <p className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp ✅</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (status === 'failed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-destructive text-destructive-foreground cursor-help">Failed</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Challan delivery failed on all channels</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending:   "bg-warning text-warning-foreground",
      confirmed: "bg-success text-success-foreground",
      dismissed: "bg-muted text-muted-foreground",
    };
    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const availableTypes = violationTypes.map(vt => vt.name);

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><p>Loading violations...</p></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Violation Management</h1>

      {/* Filters */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Search by ID or Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger><SelectValue placeholder="Violation Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Violations Table */}
      <Card className="shadow-card">
        <CardHeader><CardTitle>Violations ({filteredViolations.length})</CardTitle></CardHeader>
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
                    <th className="text-left p-3 font-medium">Challan</th>
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
                      <td className="p-3">{format(new Date(violation.timestamp), 'MMM dd, yyyy HH:mm')}</td>
                      <td className="p-3">{violation.location}</td>
                      <td className="p-3">{getStatusBadge(violation.status)}</td>
                      <td className="p-3">
                        {violation.status === 'confirmed' ? getEmailStatusBadge(violation) : '-'}
                      </td>
                      <td className="p-3">₨{Number(violation.fine_amount).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="outline">{violation.penalty_points} pts</Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1 items-center">
                          {/* Eye */}
                          <Button size="sm" variant="ghost" onClick={() => setSelectedViolation(violation)}>
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Confirm / Dismiss */}
                          {violation.status === "pending" && (
                            <>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => handleConfirm(violation)}
                                className="text-success"
                                disabled={isConfirming}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                onClick={() => handleDismiss(violation.id)}
                                className="text-destructive"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {/* Send dropdown — only for confirmed violations */}
                          {violation.status === 'confirmed' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm" variant="ghost"
                                  className="text-primary px-1"
                                  disabled={sendingViolationId === violation.id}
                                  title="Send Challan"
                                >
                                  {sendingViolationId === violation.id ? (
                                    <span className="text-xs">Sending...</span>
                                  ) : (
                                    <>
                                      <Send className="w-4 h-4" />
                                      <ChevronDown className="w-3 h-3 ml-0.5" />
                                    </>
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleSendChallanFromRow(violation, "email")}
                                  className="gap-2"
                                >
                                  <Mail className="w-4 h-4" />
                                  Send via Email
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSendChallanFromRow(violation, "whatsapp")}
                                  className="gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  Send via WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleSendChallanFromRow(violation, "both")}
                                  className="gap-2 font-medium"
                                >
                                  <Send className="w-4 h-4" />
                                  Send via Both
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {/* Delete */}
                          <Button
                            size="sm" variant="ghost"
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
            <div className="text-center py-8 text-muted-foreground">No violations found</div>
          )}
        </CardContent>
      </Card>

      {/* Violation Details Dialog */}
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
                  <img src={selectedViolation.image_url} alt="Violation evidence" className="object-cover rounded-lg w-full h-full" />
                ) : (
                  <p className="text-muted-foreground">No evidence image available</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><h4 className="font-semibold mb-1">Violation Type</h4><p>{selectedViolation.violation_type}</p></div>
                <div><h4 className="font-semibold mb-1">Vehicle Number</h4><p className="font-mono">{selectedViolation.vehicle_number}</p></div>
                <div><h4 className="font-semibold mb-1">Date & Time</h4><p>{format(new Date(selectedViolation.timestamp), 'MMM dd, yyyy HH:mm a')}</p></div>
                <div><h4 className="font-semibold mb-1">Location</h4><p>{selectedViolation.location}</p></div>
                <div><h4 className="font-semibold mb-1">Status</h4>{getStatusBadge(selectedViolation.status)}</div>
                <div><h4 className="font-semibold mb-1">Fine Amount</h4><p className="text-lg font-semibold">₨{Number(selectedViolation.fine_amount).toLocaleString()}</p></div>
                <div><h4 className="font-semibold mb-1">Penalty Points</h4><Badge variant="secondary">{selectedViolation.penalty_points} pts</Badge></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* E-Challan Dialog */}
      <Dialog open={showChallanDialog} onOpenChange={setShowChallanDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>E-Challan Generated</DialogTitle>
            <DialogDescription>Ticket No: {challanData?.ticket_no}</DialogDescription>
          </DialogHeader>
          {challanData && (
            <div className="space-y-4">
              <EChallan data={challanData} showDuplicate={false} />
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowChallanDialog(false)}>
                  Close
                </Button>

                {/* Send dropdown in dialog */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-primary" disabled={isSendingChallan}>
                      <Send className="w-4 h-4 mr-2" />
                      {isSendingChallan ? "Sending..." : "Send Challan"}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSendChallan("email")} className="gap-2">
                      <Mail className="w-4 h-4" />
                      Send via Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendChallan("whatsapp")} className="gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Send via WhatsApp
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSendChallan("both")} className="gap-2 font-medium">
                      <Send className="w-4 h-4" />
                      Send via Both
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}