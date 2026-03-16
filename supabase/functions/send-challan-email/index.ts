import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChallanData {
  ticketNo: string;
  registrationNo: string;
  violationType: string;
  fineAmount: number;
  violationLocation: string;
  violationDate: string;
  dueDate: string;
  officerName: string;
  penaltyCount: number;
  ownerName: string;
  fatherName: string;
  address: string;
  city: string;
  phoneNumber: string;
  email: string;
  vehicleMake: string;
  vehicleYear: number | null;
  vehicleColor: string;
  chassisNo: string;
  engineNo: string;
  evidenceImageUrl?: string | null;
}

interface ChallanEmailRequest {
  recipientEmail: string;
  ticketNo: string;
  violationId: string;
  challanData: ChallanData;
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail credentials not configured");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Token refresh failed:", error);
    throw new Error("Failed to refresh Gmail access token");
  }

  const data = await response.json();
  return data.access_token;
}

// Encode bytes to base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Encode string to base64 safely (handles UTF-8)
function encodeBase64(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return bytesToBase64(bytes);
}

// URL-safe base64 encoding for Gmail API
function toUrlSafeBase64(str: string): string {
  return encodeBase64(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateChallanHtml(data: ChallanData & { evidenceImageUrl?: string }): string {
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>E-Challan - ${data.ticketNo}</title>
  <style>
    @media print {
      body { margin: 0; padding: 10mm; }
      .no-print { display: none; }
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .challan-container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 2px solid #000;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 2px;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
    }
    .ticket-summary {
      display: table;
      width: 100%;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .ticket-col {
      display: table-cell;
      width: 33%;
      vertical-align: top;
    }
    .ticket-col.center {
      text-align: center;
    }
    .ticket-col.right {
      text-align: right;
    }
    .barcode {
      border: 1px solid #000;
      padding: 10px;
      font-family: monospace;
      letter-spacing: 3px;
    }
    .section {
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 15px;
    }
    .section-title {
      background: #e0e0e0;
      padding: 8px 10px;
      margin: 0 0 10px 0;
      font-size: 14px;
      font-weight: bold;
    }
    .details-grid {
      display: table;
      width: 100%;
    }
    .details-row {
      display: table-row;
    }
    .details-cell {
      display: table-cell;
      padding: 4px 10px 4px 0;
      font-size: 12px;
      width: 50%;
    }
    .label {
      font-weight: bold;
    }
    .legal-text {
      font-size: 11px;
      line-height: 1.5;
    }
    .legal-text p {
      margin: 0 0 10px 0;
    }
    .officer-section {
      display: table;
      width: 100%;
    }
    .officer-info {
      display: table-cell;
      width: 50%;
      vertical-align: bottom;
    }
    .signature-box {
      display: table-cell;
      width: 50%;
      text-align: right;
    }
    .signature-line {
      border-bottom: 1px solid #000;
      width: 150px;
      display: inline-block;
      margin-bottom: 5px;
    }
    .bottom-boxes {
      display: table;
      width: 100%;
      margin-top: 15px;
    }
    .bottom-box {
      display: table-cell;
      width: 48%;
      border: 1px solid #000;
      padding: 10px;
      font-size: 11px;
      vertical-align: top;
    }
    .bottom-box:first-child {
      margin-right: 4%;
    }
    .bottom-box-title {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .print-btn {
      display: block;
      margin: 20px auto;
      padding: 15px 40px;
      font-size: 16px;
      background: #2563eb;
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 5px;
    }
    .print-btn:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <div class="challan-container">
    <div class="header">
      <h1>PUNJAB TRAFFIC POLICE</h1>
      <p>E-CHALLAN / TRAFFIC VIOLATION TICKET</p>
    </div>

    <div class="ticket-summary">
      <div class="ticket-col">
        <p><span class="label">Ticket No:</span> ${data.ticketNo}</p>
        <p><span class="label">Registration No:</span> ${data.registrationNo}</p>
        <p><span class="label">Violation Type:</span> ${data.violationType}</p>
        <p><span class="label">Fine Amount:</span> Rs. ${data.fineAmount.toLocaleString()}</p>
      </div>
      <div class="ticket-col center">
        <div class="barcode">||| ||| || ||| || ||| |||</div>
        <p style="font-size: 10px; margin-top: 5px;">${data.ticketNo}</p>
      </div>
      <div class="ticket-col right">
        <p><span class="label">Due Date:</span> ${data.dueDate}</p>
        <p style="font-size: 10px;">Payment Within Due Date</p>
        <p><span class="label">Extended Due Date:</span> -</p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">VEHICLE OWNER / DRIVER DETAILS</div>
      <div class="details-grid">
        <div class="details-row">
          <div class="details-cell"><span class="label">Name:</span> ${data.ownerName}</div>
          <div class="details-cell"><span class="label">Father's Name:</span> ${data.fatherName}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Address:</span> ${data.address}</div>
          <div class="details-cell"><span class="label">City:</span> ${data.city}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Phone Number:</span> ${data.phoneNumber}</div>
          <div class="details-cell"><span class="label">Email:</span> ${data.email}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Vehicle Make Year:</span> ${data.vehicleYear || 'N/A'}</div>
          <div class="details-cell"><span class="label">Vehicle Make:</span> ${data.vehicleMake}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Color:</span> ${data.vehicleColor}</div>
          <div class="details-cell"><span class="label">Chassis No:</span> ${data.chassisNo}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Engine No:</span> ${data.engineNo}</div>
          <div class="details-cell"><span class="label">Violation Location:</span> ${data.violationLocation}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">PSCA-PPIC3-E-TICKETING CENTER</div>
      <div class="details-grid">
        <div class="details-row">
          <div class="details-cell"><span class="label">ID:</span> PSCA-${data.ticketNo.slice(-6)}</div>
          <div class="details-cell"><span class="label">Paid Challan:</span> 0</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Unpaid Challan:</span> 1</div>
          <div class="details-cell"><span class="label">Issue Date:</span> ${data.violationDate}</div>
        </div>
        <div class="details-row">
          <div class="details-cell"><span class="label">Penalty:</span> ${data.penaltyCount}</div>
          <div class="details-cell"></div>
        </div>
      </div>
    </div>

    <div class="section legal-text">
      <p>The traffic infraction enforcement officer named herein has reviewed the recorded images evidencing the violation, has identified the registration number of violating vehicle and has found reasonable and probable grounds that a violation has been committed.</p>
      <p><strong>INSTRUCTIONS:</strong> You have been fined under Section 116-A of motor vehicle ordinance 1965. Please pay your fine within 10 days of issuance of this notice, failing which your vehicle can also be impounded till payment of outstanding fine.</p>
    </div>

    <div class="section">
      <div class="officer-section">
        <div class="officer-info">
          <p><span class="label">Issuing Officer:</span> ${data.officerName}</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p style="font-size: 10px; margin: 0;">Signature</p>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">EVIDENCE</div>
      <div style="background: #f5f5f5; padding: 10px; text-align: center; min-height: 150px; display: flex; align-items: center; justify-content: center;">
        ${data.evidenceImageUrl
          ? `<img src="${data.evidenceImageUrl}" alt="Violation Evidence" style="max-height: 200px; max-width: 100%; object-fit: contain;" />`
          : `<p style="color: #999; font-size: 12px;">No evidence image available</p>`
        }
      </div>
    </div>

    <div class="bottom-boxes">
      <div class="bottom-box">
        <div class="bottom-box-title">BANK DEPOSIT SLIP</div>
        <p>Account Title: Punjab Traffic Police</p>
        <p>Bank: National Bank of Pakistan</p>
        <p>Branch Code: 0123</p>
        <p>Amount: Rs. ${data.fineAmount.toLocaleString()}</p>
      </div>
      <div class="bottom-box">
        <div class="bottom-box-title">FOR OFFICE USE ONLY</div>
        <p>Receipt No: ________________</p>
        <p>Date: ________________</p>
        <p>Amount: ________________</p>
        <p>Cashier: ________________</p>
      </div>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">Print Challan / Save as PDF</button>
</body>
</html>`;
}

function createMimeMessageWithHtml(
  to: string,
  subject: string,
  textBody: string,
  htmlAttachment: string,
  attachmentFilename: string
): string {
  const boundary = "----=_Part_" + Date.now().toString(36);
  
  
  const encodedSubject = `=?UTF-8?B?${encodeBase64(subject)}?=`;
  
  const mimeMessage = [
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    encodeBase64(textBody),
    "",
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8; name="${attachmentFilename}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${attachmentFilename}"`,
    "",
    encodeBase64(htmlAttachment),
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return toUrlSafeBase64(mimeMessage);
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let violationId: string | undefined;

  try {
    const { recipientEmail, ticketNo, violationId: vId, challanData }: ChallanEmailRequest = await req.json();
    violationId = vId;

    console.log(`Processing challan email for ticket: ${ticketNo} to: ${recipientEmail}`);
    console.log("evidenceImageUrl received:", challanData.evidenceImageUrl);

    if (!recipientEmail || !ticketNo || !challanData) {
      throw new Error("Missing required fields: recipientEmail, ticketNo, or challanData");
    }

    // Get fresh access token
    const accessToken = await getAccessToken();
    console.log("Access token obtained successfully");

    // Generate full challan HTML
    // Fetch evidence image and convert to base64 for embedding in HTML
    let embeddedImageSrc = '';
    if (challanData.evidenceImageUrl) {
      try {
        console.log("Fetching evidence image from:", challanData.evidenceImageUrl);
        const imgResponse = await fetch(challanData.evidenceImageUrl);
        console.log("Image fetch status:", imgResponse.status);
        if (imgResponse.ok) {
          const imgBuffer = await imgResponse.arrayBuffer();
          console.log("Image buffer size:", imgBuffer.byteLength);
          const imgBase64 = bytesToBase64(new Uint8Array(imgBuffer));
          console.log("Base64 length:", imgBase64.length);
          embeddedImageSrc = `data:image/jpeg;base64,${imgBase64}`;
        } else {
          console.error("Image fetch failed:", await imgResponse.text());
        }
      } catch (e) {
        console.error("Failed to fetch evidence image:", e);
      }
    } else {
      console.log("No evidenceImageUrl provided — skipping image embed");
    }
    console.log("Challan HTML generated successfully");

    // Create email with attachment
    const subject = `Traffic Violation Challan - Challan No ${ticketNo}`;
    const textBody = `Dear ${challanData.ownerName},

A traffic violation has been recorded against your vehicle (${challanData.registrationNo}).

Violation Details:
- Ticket No: ${ticketNo}
- Violation Type: ${challanData.violationType}
- Fine Amount: Rs. ${challanData.fineAmount.toLocaleString()}
- Due Date: ${challanData.dueDate}
- Location: ${challanData.violationLocation}

Please find the attached E-Challan document. Open the attachment in your browser and use "Print" or "Save as PDF" to save a copy.

Pay your fine within the due date to avoid additional penalties.

Traffic Police Department
Punjab, Pakistan`;

    const rawMessage = createMimeMessageWithHtml(
      recipientEmail,
      subject,
      textBody,
      challanHtml,
      `E-Challan-${ticketNo}.html`
    );

    console.log("MIME message created, sending via Gmail API...");

    // Send via Gmail API
    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );

    if (!sendResponse.ok) {
      const errorData = await sendResponse.text();
      console.error("Gmail API error:", errorData);
      throw new Error(`Failed to send email: ${sendResponse.status} - ${errorData}`);
    }

    const result = await sendResponse.json();
    console.log("Email sent successfully, message ID:", result.id);

    // Update violation email_status to 'sent'
    if (violationId) {
      const { error: updateError } = await supabase
        .from('violations')
        .update({ email_status: 'sent' })
        .eq('id', violationId);
      
      if (updateError) {
        console.error("Failed to update email_status:", updateError);
      } else {
        console.log("Email status updated to 'sent' for violation:", violationId);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        message: "Challan sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-challan-email:", error);

    // Update violation email_status to 'failed'
    if (violationId) {
      const { error: updateError } = await supabase
        .from('violations')
        .update({ email_status: 'failed' })
        .eq('id', violationId);
      
      if (updateError) {
        console.error("Failed to update email_status to failed:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
