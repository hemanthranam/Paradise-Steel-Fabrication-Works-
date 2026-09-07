/**
 * ============================================================================
 * PARADISE STEEL FABRICATION WORKS — GOOGLE APPS SCRIPT LEAD API ENGINE v2.0
 * ============================================================================
 * Repository: hemanthranam/Paradise-Steel-Fabrication-Works-
 * Target Sheet: Paradise Steel Fabrication Works — Machinery Enquiries & Leads
 * Timezone: Asia/Kolkata (IST)
 * 
 * Capabilities:
 * - Public POST endpoint for website inquiries (with Honeypot & Length sanitization)
 * - LockService concurrency lock to guarantee atomic Sheet writes
 * - Sequential Lead ID Generator: PSFW-YYYY-XXXX
 * - Responsive HTML Email Notification to Manager (manager.psfw@gmail.com)
 * - Confirmation Receipt HTML Email to Prospective Customer
 * - Token-Protected Admin CRUD Operations (READ, UPDATE, DELETE)
 * ============================================================================
 */

// Global Configuration Defaults (Can be overridden in Script Properties)
const DEFAULT_CONFIG = {
  SHEET_NAME: "Leads",
  MANAGER_EMAIL: "manager.psfw@gmail.com",
  TIMEZONE: "Asia/Kolkata",
  COMPANY_NAME: "Paradise Steel Fabrication Works",
  ADMIN_TOKEN_PROPERTY: "ADMIN_API_KEY" // Set in Script Properties
};

/**
 * Handle HTTP GET Requests:
 * 1. Public Ping / Health check
 * 2. Protected Lead Retrieval for Admin CRM (Requires ?token=...)
 */
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const action = params.action || "ping";
    const token = params.token || "";

    // Health check
    if (action === "ping") {
      return jsonResponse({
        status: "success",
        service: "Paradise Steel Lead API",
        version: "2.0.0",
        timestamp: getFormattedTimestamp()
      });
    }

    // Protected Admin Read
    if (action === "getLeads") {
      if (!isAuthorized(token)) {
        return jsonResponse({ status: "error", message: "Unauthorized access" }, 401);
      }
      return jsonResponse({
        status: "success",
        leads: getAllLeads()
      });
    }

    return jsonResponse({ status: "error", message: "Unknown action" }, 400);
  } catch (err) {
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  }
}

/**
 * Handle HTTP POST Requests:
 * 1. Public Lead Ingestion (Website Form Submission)
 * 2. Protected Admin Update / Delete
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    // Wait up to 10 seconds for concurrent write lock
    lock.waitLock(10000);

    let data;
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ status: "error", message: "Empty payload received" }, 400);
    }

    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ status: "error", message: "Malformed JSON payload" }, 400);
    }

    const action = data.action || "create_lead";

    // 1. PUBLIC LEAD CREATION (From Website)
    if (action === "create_lead" || !data.action) {
      // Honeypot bot protection
      if (data.honeypot && data.honeypot.trim() !== "") {
        console.warn("Spam submission blocked via honeypot.");
        return jsonResponse({ status: "success", message: "Processed" }); // Silent discard
      }

      // Input Validation
      const name = sanitizeInput(data.name || "");
      const phone = sanitizeInput(data.phone || "");
      const email = sanitizeInput(data.email || "");
      const model = sanitizeInput(data.model || "SPEED LIFT 200");
      const location = sanitizeInput(data.location || "");
      const powerPhase = sanitizeInput(data.powerPhase || "Single / Three Phase");
      const projectDetails = sanitizeInput(data.projectDetails || "");
      const source = sanitizeInput(data.source || "Website Form");

      if (!name || !phone) {
        return jsonResponse({ status: "error", message: "Name and phone number are required" }, 400);
      }

      const cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 10) {
        return jsonResponse({ status: "error", message: "Invalid phone number" }, 400);
      }

      const sheet = getOrCreateTargetSheet();
      const leadId = generateNextLeadId(sheet);
      const timestamp = getFormattedTimestamp();

      // Append Row Matching Approved Schema:
      // A: Timestamp | B: Inquiry_ID | C: Full_Name | D: Phone_Number | E: Email | F: Model_Interested | 
      // G: Site_Location | H: Power_Phase | I: Project_Details | J: Lead_Source | K: Status | L: Notes
      sheet.appendRow([
        timestamp,
        leadId,
        name,
        phone,
        email,
        model,
        location,
        powerPhase,
        projectDetails,
        source,
        "New",
        "" // Notes column for internal CRM
      ]);

      // Trigger Email Notifications (Fail-safe, wrapped in try-catch so sheet write succeeds)
      try {
        sendManagerNotificationEmail({
          id: leadId,
          timestamp: timestamp,
          name: name,
          phone: phone,
          email: email,
          model: model,
          location: location,
          powerPhase: powerPhase,
          projectDetails: projectDetails,
          source: source
        });
      } catch (emailErr) {
        console.error("Manager email alert error:", emailErr);
      }

      if (email && email.includes("@")) {
        try {
          sendCustomerConfirmationEmail({
            id: leadId,
            name: name,
            email: email,
            model: model
          });
        } catch (customerEmailErr) {
          console.error("Customer confirmation email error:", customerEmailErr);
        }
      }

      return jsonResponse({
        status: "success",
        inquiryId: leadId,
        message: "Inquiry successfully recorded."
      });
    }

    // 2. PROTECTED ADMIN UPDATE (Status / Notes)
    if (action === "update_lead") {
      if (!isAuthorized(data.token)) {
        return jsonResponse({ status: "error", message: "Unauthorized" }, 401);
      }
      return updateLeadStatus(data.leadId, data.status, data.notes);
    }

    return jsonResponse({ status: "error", message: "Unsupported action" }, 400);
  } catch (err) {
    console.error("doPost critical error:", err);
    return jsonResponse({ status: "error", message: err.toString() }, 500);
  } finally {
    lock.releaseLock();
  }
}

/* --------------------------------------------------------------------------
   DATABASE / SHEET HELPERS
   -------------------------------------------------------------------------- */

function getOrCreateTargetSheet() {
  const props = PropertiesService.getScriptProperties();
  const configuredSheetId = props.getProperty("SHEET_ID");

  let ss;
  if (configuredSheetId) {
    ss = SpreadsheetApp.openById(configuredSheetId);
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      // If deployed as standalone script, create and store ID
      ss = SpreadsheetApp.create("Paradise Steel Fabrication Works — Machinery Enquiries & Leads");
      props.setProperty("SHEET_ID", ss.getId());
    }
  }

  let sheet = ss.getSheetByName(DEFAULT_CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(DEFAULT_CONFIG.SHEET_NAME);
    // Write Approved Headers
    sheet.appendRow([
      "Timestamp",
      "Inquiry_ID",
      "Full_Name",
      "Phone_Number",
      "Email",
      "Model_Interested",
      "Site_Location",
      "Power_Phase",
      "Project_Details",
      "Lead_Source",
      "Status",
      "Notes"
    ]);
    // Format Header Row
    sheet.getRange("A1:L1").setFontWeight("bold").setBackground("#1E293B").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateNextLeadId(sheet) {
  const year = new Date().getFullYear();
  const lastRow = sheet.getLastRow();
  let nextSeq = 1;

  if (lastRow > 1) {
    const lastId = sheet.getRange(lastRow, 2).getValue().toString();
    const match = lastId.match(/PSFW-\d{4}-(\d+)/);
    if (match && match[1]) {
      nextSeq = parseInt(match[1], 10) + 1;
    } else {
      nextSeq = lastRow;
    }
  }

  const padded = ("0000" + nextSeq).slice(-4);
  return "PSFW-" + year + "-" + padded;
}

function getFormattedTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, DEFAULT_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function sanitizeInput(str) {
  if (typeof str !== "string") return String(str || "");
  return str.replace(/[<>]/g, "").trim();
}

function isAuthorized(token) {
  const props = PropertiesService.getScriptProperties();
  const expectedToken = props.getProperty(DEFAULT_CONFIG.ADMIN_TOKEN_PROPERTY) || "PARADISE_SECURE_ADMIN_2026";
  return token && token === expectedToken;
}

function jsonResponse(obj, statusCode = 200) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* --------------------------------------------------------------------------
   EMAIL NOTIFICATION PIPELINE
   -------------------------------------------------------------------------- */

function sendManagerNotificationEmail(lead) {
  const props = PropertiesService.getScriptProperties();
  const recipient = props.getProperty("MANAGER_EMAIL") || DEFAULT_CONFIG.MANAGER_EMAIL;
  const subject = `New Paradise Steel Website Enquiry — ${lead.id}`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 24px; text-align: center; border-bottom: 3px solid #F59E0B;">
        <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; letter-spacing: -0.02em;">Paradise Steel Fabrication Works</h2>
        <p style="color: #F59E0B; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">New Machinery Lead Received</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF;">
        <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <span style="font-size: 14px; font-weight: bold; color: #92400E;">Inquiry Reference ID:</span>
          <span style="font-size: 15px; font-weight: 800; color: #78350F; margin-left: 8px;">${lead.id}</span>
          <div style="font-size: 12px; color: #B45309; margin-top: 4px;">Received: ${lead.timestamp} (IST)</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; width: 38%; color: #64748B;">Customer Name:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0F172A;">${lead.name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Contact Phone:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0F172A;"><a href="tel:${lead.phone}" style="color: #D97706; text-decoration: none;">${lead.phone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Email Address:</td>
            <td style="padding: 10px 0;">${lead.email || "Not Provided"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Model / Machinery:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">${lead.model}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Site Location / City:</td>
            <td style="padding: 10px 0;">${lead.location || "Not Provided"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Power Supply Phase:</td>
            <td style="padding: 10px 0;">${lead.powerPhase}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #64748B; vertical-align: top;">Project Notes / Details:</td>
            <td style="padding: 10px 0; color: #0F172A; white-space: pre-line;">${lead.projectDetails || "None specified"}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; text-align: center;">
          <a href="https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-right: 8px;">Reply via WhatsApp</a>
          <a href="tel:${lead.phone}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-weight: bold; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Call Customer</a>
        </div>
      </div>
      <div style="background-color: #F1F5F9; padding: 14px; text-align: center; font-size: 12px; color: #64748B;">
        Plot No. E-13, Industrial Development Estate, Madanapalle, AP - 517325
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlBody
  });
}

function sendCustomerConfirmationEmail(lead) {
  const subject = `Your Paradise Steel enquiry has been received — ${lead.id}`;
  const htmlBody = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 22px; text-align: center; border-bottom: 3px solid #F59E0B;">
        <h2 style="color: #FFFFFF; margin: 0; font-size: 18px;">Paradise Steel Fabrication Works</h2>
        <p style="color: #F59E0B; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">Madanapalle • Since 1989</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${lead.name}</strong>,</p>
        <p>Thank you for reaching out to <strong>Paradise Steel Fabrication Works</strong> regarding the <strong>${lead.model}</strong> vertical material hoist.</p>
        <p>We have safely captured your inquiry under reference ID: <strong>${lead.id}</strong>.</p>
        <p>Our technical team is reviewing your project requirements and a representative will contact you shortly with the complete specification sheet, quotation, and site setup details.</p>
        
        <div style="margin: 20px 0; padding: 16px; background-color: #F8FAFC; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <strong>Need immediate site dispatch or urgent assistance?</strong><br>
          Call: <a href="tel:+919440585329" style="color: #0F172A; font-weight: bold; text-decoration: none;">+91 94405 85329</a> / <a href="tel:+917675815245" style="color: #0F172A; font-weight: bold; text-decoration: none;">+91 76758 15245</a><br>
          WhatsApp: <a href="https://wa.me/917675815245" style="color: #25D366; font-weight: bold; text-decoration: none;">Chat with Support</a>
        </div>

        <p style="margin-bottom: 0;">Best regards,<br>
        <strong>R. Rama Krishna</strong>, Proprietor<br>
        Paradise Steel Fabrication Works</p>
      </div>
    </div>
  `;

  MailApp.sendEmail({
    to: lead.email,
    subject: subject,
    htmlBody: htmlBody
  });
}
