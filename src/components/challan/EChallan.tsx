import { format, addDays } from "date-fns";

interface VehicleOwner {
  registration_no: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  father_name: string | null;
  address: string | null;
  city: string | null;
  phone_number: string | null;
  email: string;
  vehicle_make_year: number | null;
  vehicle_make: string | null;
  vehicle_color: string | null;
  chassis_no: string | null;
  engine_no: string | null;
}

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

interface EChallanProps {
  data: ChallanData;
  showDuplicate?: boolean;
}

export default function EChallan({ data, showDuplicate = false }: EChallanProps) {
  const ownerName = data.owner 
    ? [data.owner.first_name, data.owner.middle_name, data.owner.last_name].filter(Boolean).join(' ')
    : 'N/A';

  return (
    <div className="challan-container bg-white text-black p-6 border-2 border-black max-w-[210mm] mx-auto font-sans print:p-4">
      {/* Header Section */}
      <div className="challan-header flex items-center justify-between border-b-2 border-black pb-4 mb-4">
        <div className="logo-left w-20 h-20 border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400">
          Logo
        </div>
        <div className="header-title text-center flex-1">
          <h1 className="text-2xl font-bold tracking-wider">PUNJAB TRAFFIC POLICE</h1>
          <p className="text-sm mt-1">E-CHALLAN / TRAFFIC VIOLATION TICKET</p>
        </div>
        <div className="logo-right w-20 h-20 border border-dashed border-gray-400 flex items-center justify-center text-xs text-gray-400">
          Logo
        </div>
      </div>

      {/* Ticket Summary Section - 3 Column Grid */}
      <div className="ticket-summary grid grid-cols-3 gap-4 border-b-2 border-black pb-4 mb-4">
        <div className="ticket-left space-y-1 text-sm">
          <p><span className="font-semibold">Ticket No:</span> {data.ticket_no}</p>
          <p><span className="font-semibold">Registration No:</span> {data.registration_no}</p>
          <p><span className="font-semibold">Violation Type:</span> {data.violation_type}</p>
          <p><span className="font-semibold">Fine Amount:</span> Rs. {Number(data.fine_amount).toLocaleString()}</p>
        </div>
        <div className="ticket-center flex flex-col items-center justify-center">
          <div className="barcode-placeholder border border-black p-2 text-xs mb-2 w-full text-center">
            ||| ||| || ||| || ||| |||
            <p className="mt-1 font-mono text-[10px]">{data.ticket_no}</p>
          </div>
          {showDuplicate && (
            <p className="text-red-600 font-bold text-lg">DUPLICATE</p>
          )}
          <p className="text-xs">Ticket No: {data.ticket_no}</p>
        </div>
        <div className="ticket-right space-y-1 text-sm text-right">
          <p><span className="font-semibold">Due Date:</span> {format(new Date(data.due_date), 'dd-MM-yyyy')}</p>
          <p className="text-xs text-gray-600">Payment Within Due Date</p>
          <p><span className="font-semibold">Extended Due Date:</span> -</p>
        </div>
      </div>

      {/* Vehicle Owner / Driver Details Section */}
      <div className="owner-details border-b-2 border-black pb-4 mb-4">
        <h2 className="font-bold text-sm mb-2 bg-gray-100 p-2">VEHICLE OWNER / DRIVER DETAILS</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
          <p><span className="font-semibold">Name:</span> {ownerName}</p>
          <p><span className="font-semibold">Father's Name:</span> {data.owner?.father_name || 'N/A'}</p>
          <p><span className="font-semibold">Address:</span> {data.owner?.address || 'N/A'}</p>
          <p><span className="font-semibold">City:</span> {data.owner?.city || 'N/A'}</p>
          <p><span className="font-semibold">Phone Number:</span> {data.owner?.phone_number || 'N/A'}</p>
          <p><span className="font-semibold">Email:</span> {data.owner?.email || 'N/A'}</p>
          <p><span className="font-semibold">Vehicle Make Year:</span> {data.owner?.vehicle_make_year || 'N/A'}</p>
          <p><span className="font-semibold">Vehicle Make:</span> {data.owner?.vehicle_make || 'N/A'}</p>
          <p><span className="font-semibold">Color:</span> {data.owner?.vehicle_color || 'N/A'}</p>
          <p><span className="font-semibold">Chassis No:</span> {data.owner?.chassis_no || 'N/A'}</p>
          <p><span className="font-semibold">Engine No:</span> {data.owner?.engine_no || 'N/A'}</p>
          <p><span className="font-semibold">Violation Location:</span> {data.violation_location}</p>
        </div>
      </div>

      {/* PSCA-PPIC3-E-TICKETING CENTER Section */}
      <div className="psca-section border-b-2 border-black pb-4 mb-4">
        <h2 className="font-bold text-sm mb-2 bg-gray-100 p-2">PSCA-PPIC3-E-TICKETING CENTER</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <p><span className="font-semibold">ID:</span> PSCA-{data.ticket_no.slice(-6)}</p>
          <p><span className="font-semibold">Paid Challan:</span> 0</p>
          <p><span className="font-semibold">Unpaid Challan:</span> 1</p>
          <p><span className="font-semibold">Issue Date:</span> {format(new Date(data.violation_date), 'dd-MM-yyyy')}</p>
          <p><span className="font-semibold">Penalty:</span> {data.penalty_count}</p>
        </div>
      </div>

      {/* Legal Text Section */}
      <div className="legal-section border-b-2 border-black pb-4 mb-4 text-xs">
        <p className="mb-3">
          The traffic infraction enforcement officer named herein has reviewed the recorded images evidencing the violation, has identified the registration number of violating vehicle and has found reasonable and probable grounds that a violation has been committed.
        </p>
        <p className="font-bold mb-1">INSTRUCTIONS:</p>
        <p>
          You have been fined under Section 116-A of motor vehicle ordinance 1965. Please pay your fine within 10 days of issuance of this notice, failing which your vehicle can also be impounded till payment of outstanding fine.
        </p>
      </div>

      {/* Issuing Officer Section */}
      <div className="officer-section border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm"><span className="font-semibold">Issuing Officer:</span> {data.officer_name}</p>
          </div>
          <div className="signature-placeholder w-40 h-16 border-b border-black flex items-end justify-center text-xs text-gray-400 pb-1">
            Signature
          </div>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="evidence-section border-b-2 border-black pb-4 mb-4">
        <h2 className="font-bold text-sm mb-2 bg-gray-100 p-2">EVIDENCE</h2>
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          {data.evidence_image_url ? (
            <img 
              src={data.evidence_image_url} 
              alt="Violation Evidence" 
              className="max-h-48 object-contain"
            />
          ) : (
            <p className="text-gray-400">No evidence image available</p>
          )}
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="bottom-sections grid grid-cols-2 gap-4">
        <div className="left-box border border-black p-3 text-xs">
          <p className="font-bold mb-1">BANK DEPOSIT SLIP</p>
          <p>Account Title: Punjab Traffic Police</p>
          <p>Bank: National Bank of Pakistan</p>
          <p>Branch Code: 0123</p>
          <p>Amount: Rs. {Number(data.fine_amount).toLocaleString()}</p>
        </div>
        <div className="right-box border border-black p-3 text-xs">
          <p className="font-bold mb-1">FOR OFFICE USE ONLY</p>
          <p>Receipt No: ________________</p>
          <p>Date: ________________</p>
          <p>Amount: ________________</p>
          <p>Cashier: ________________</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .challan-container {
            width: 210mm;
            padding: 10mm;
            margin: 0;
            border: 1px solid black;
          }
        }
      `}</style>
    </div>
  );
}