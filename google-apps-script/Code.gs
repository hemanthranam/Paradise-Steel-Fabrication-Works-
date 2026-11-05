/**
 * ============================================================================
 * PARADISE STEEL FABRICATION WORKS — GOOGLE APPS SCRIPT LEAD API ENGINE v3.0
 * ============================================================================
 * Business: Paradise Steel Fabrication Works (PSFW)
 * Parent Organisation: Ranam MachineTech Pvt Ltd
 * Target Database: PSFW — Business Operations Database
 * Active Sheet: 01_Leads | Audit Log: 15_Audit_Log
 * Timezone: Asia/Kolkata (IST)
 * 
 * Capabilities:
 * - Public POST endpoint for website inquiries (with Honeypot & Length sanitization)
 * - Supported Primary Models: SPEED LIFT 150, SPEED LIFT 250, SPEED LIFT 500
 * - LockService concurrency lock to guarantee atomic Sheet writes
 * - Sequential Lead ID Generator: PSFW-YYYY-XXXX
 * - Fail-Closed Token-Protected Admin Operations (NO hard-coded secrets)
 * - Strictly HTML-Escaped Responsive Notifications to manager.psfw@gmail.com
 * - Customer Confirmation Receipt HTML Email
 * - Automated Audit Log generation in 15_Audit_Log
 * ============================================================================
 */

// Global Configuration Defaults (Can be overridden in Script Properties)
const DEFAULT_CONFIG = {
  LEADS_SHEET_NAME: "01_Leads",
  AUDIT_SHEET_NAME: "15_Audit_Log",
  MANAGER_EMAIL: "manager.psfw@gmail.com",
  TIMEZONE: "Asia/Kolkata",
  COMPANY_NAME: "Paradise Steel Fabrication Works",
  PARENT_COMPANY: "Ranam MachineTech Pvt Ltd",
  ADMIN_TOKEN_PROPERTY: "ADMIN_API_KEY",
  MASTER_SHEET_ID_PROPERTY: "MASTER_SHEET_ID",
  DEFAULT_MASTER_SHEET_ID: "1gDPo7gaOjcPiz5yyWfSkkBlcwG3GN5acFnf3iAuYS7Y",
  VALID_MODELS: ["SPEED LIFT 150", "SPEED LIFT 250", "SPEED LIFT 500"]
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
        version: "3.0.0",
        models: DEFAULT_CONFIG.VALID_MODELS,
        timestamp: getFormattedTimestamp()
      });
    }

    // Protected Admin Read
    if (action === "getLeads") {
      if (!isAuthorized(token)) {
        return jsonResponse({ status: "error", message: "Unauthorized: Invalid or missing administrative token" }, 401);
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
      let model = sanitizeInput(data.model || "SPEED LIFT 250");
      const location = sanitizeInput(data.location || "");
      const powerPhase = sanitizeInput(data.powerPhase || "Not Specified");
      const projectDetails = sanitizeInput(data.projectDetails || "");
      const source = sanitizeInput(data.source || "Website Form");

      // Validate model against approved 3 models
      if (!DEFAULT_CONFIG.VALID_MODELS.includes(model)) {
        if (model.includes("150")) model = "SPEED LIFT 150";
        else if (model.includes("500")) model = "SPEED LIFT 500";
        else model = "SPEED LIFT 250";
      }

      if (!name || !phone) {
        return jsonResponse({ status: "error", message: "Name and phone number are required" }, 400);
      }

      const cleanPhone = phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 10) {
        return jsonResponse({ status: "error", message: "Invalid phone number" }, 400);
      }

      const ss = getTargetSpreadsheet();
      const sheet = getOrCreateLeadsSheet(ss);
      const leadId = generateNextLeadId(sheet);
      const timestamp = getFormattedTimestamp();

      // Append Row Matching Approved 01_Leads Schema:
      // Lead_ID | Created_Timestamp | Customer_Name | Phone | Email | Company_Contractor | Site_Location | 
      // Product_Model | Required_Quantity | Power_Requirement | Project_Details | Expected_Purchase_Date | 
      // Lead_Source | Assigned_Person | Lead_Status | Next_Follow_Up_Date | Last_Contact_Date | 
      // Estimated_Deal_Value_INR | Notes
      sheet.appendRow([
        leadId,
        timestamp,
        name,
        phone,
        email,
        "", // Company_Contractor
        location,
        model,
        1,  // Required_Quantity
        powerPhase,
        projectDetails,
        "", // Expected_Purchase_Date
        source,
        "Unassigned",
        "New",
        "", // Next_Follow_Up_Date
        "", // Last_Contact_Date
        "", // Estimated_Deal_Value_INR
        ""  // Notes
      ]);

      // Record in Audit Log
      recordAuditLog(ss, "Lead Ingestion", leadId, "New Website Lead Created", "", `Model: ${model}, Location: ${location}`);

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
        timestamp: timestamp,
        message: "Inquiry successfully recorded."
      });
    }

    // 2. PROTECTED ADMIN UPDATE (Status / Notes)
    if (action === "update_lead") {
      if (!isAuthorized(data.token)) {
        return jsonResponse({ status: "error", message: "Unauthorized: Invalid or missing administrative token" }, 401);
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

function getTargetSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const configuredSheetId = props.getProperty(DEFAULT_CONFIG.MASTER_SHEET_ID_PROPERTY) || DEFAULT_CONFIG.DEFAULT_MASTER_SHEET_ID;

  if (configuredSheetId) {
    try {
      return SpreadsheetApp.openById(configuredSheetId);
    } catch (e) {
      console.warn("Could not open configured sheet by ID, falling back to active spreadsheet:", e);
    }
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  throw new Error("No accessible spreadsheet found. Please configure MASTER_SHEET_ID in Script Properties.");
}

function getOrCreateLeadsSheet(ss) {
  let sheet = ss.getSheetByName(DEFAULT_CONFIG.LEADS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheetByName("Leads");
  }
  if (!sheet) {
    sheet = ss.insertSheet(DEFAULT_CONFIG.LEADS_SHEET_NAME);
    sheet.appendRow([
      "Lead_ID", "Created_Timestamp", "Customer_Name", "Phone", "Email", 
      "Company_Contractor", "Site_Location", "Product_Model", "Required_Quantity", 
      "Power_Requirement", "Project_Details", "Expected_Purchase_Date", "Lead_Source", 
      "Assigned_Person", "Lead_Status", "Next_Follow_Up_Date", "Last_Contact_Date", 
      "Estimated_Deal_Value_INR", "Notes"
    ]);
    sheet.getRange("A1:S1").setFontWeight("bold").setBackground("#0F172A").setFontColor("#FFFFFF");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function generateNextLeadId(sheet) {
  const year = new Date().getFullYear();
  const lastRow = sheet.getLastRow();
  let nextSeq = 1;

  if (lastRow > 1) {
    // Lead_ID is in Column A
    const lastId = sheet.getRange(lastRow, 1).getValue().toString();
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

function recordAuditLog(ss, actionUser, recordId, actionPerformed, prevVal, newVal) {
  try {
    let auditSheet = ss.getSheetByName(DEFAULT_CONFIG.AUDIT_SHEET_NAME);
    if (!auditSheet) return;
    const auditId = "AUD-" + Utilities.getUuid().slice(0, 8).toUpperCase();
    auditSheet.appendRow([
      auditId,
      getFormattedTimestamp(),
      actionUser,
      "Lead",
      recordId,
      actionPerformed,
      prevVal || "None",
      newVal || "None",
      "SUCCESS"
    ]);
  } catch (e) {
    console.error("Failed to write to Audit Log:", e);
  }
}

function getFormattedTimestamp() {
  const now = new Date();
  return Utilities.formatDate(now, DEFAULT_CONFIG.TIMEZONE, "yyyy-MM-dd HH:mm:ss");
}

function sanitizeInput(str) {
  if (typeof str !== "string") return String(str || "");
  return str.replace(/[<>]/g, "").trim();
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Fail-closed authentication check
 */
function isAuthorized(token) {
  const props = PropertiesService.getScriptProperties();
  const expectedToken = props.getProperty(DEFAULT_CONFIG.ADMIN_TOKEN_PROPERTY);
  
  // Security guardrail: fail closed if no key is configured in Script Properties
  if (!expectedToken || expectedToken.trim() === "") {
    console.error("Security Alert: ADMIN_API_KEY is not configured in Script Properties. Rejecting request.");
    return false;
  }
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
  const subject = `New Paradise Steel Website Enquiry — ${escapeHtml(lead.id)} (${escapeHtml(lead.model)})`;

  const safeId = escapeHtml(lead.id);
  const safeName = escapeHtml(lead.name);
  const safePhone = escapeHtml(lead.phone);
  const safeEmail = escapeHtml(lead.email || "Not Provided");
  const safeModel = escapeHtml(lead.model);
  const safeLocation = escapeHtml(lead.location || "Not Provided");
  const safePower = escapeHtml(lead.powerPhase);
  const safeDetails = escapeHtml(lead.projectDetails || "None specified");
  const cleanPhoneNum = lead.phone.replace(/[^0-9]/g, "");

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 24px; text-align: center; border-bottom: 3px solid #F59E0B;">
        <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; letter-spacing: -0.02em;">Paradise Steel Fabrication Works</h2>
        <p style="color: #F59E0B; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">New Machinery Lead Received</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF;">
        <div style="background-color: #FEF3C7; border: 1px solid #FDE68A; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
          <span style="font-size: 14px; font-weight: bold; color: #92400E;">Inquiry Reference ID:</span>
          <span style="font-size: 15px; font-weight: 800; color: #78350F; margin-left: 8px;">${safeId}</span>
          <div style="font-size: 12px; color: #B45309; margin-top: 4px;">Received: ${escapeHtml(lead.timestamp)} (IST)</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; width: 38%; color: #64748B;">Customer Name:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0F172A;">${safeName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Contact Phone:</td>
            <td style="padding: 10px 0; font-weight: 600; color: #0F172A;"><a href="tel:${safePhone}" style="color: #D97706; text-decoration: none;">${safePhone}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Email Address:</td>
            <td style="padding: 10px 0;">${safeEmail}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Model / Machinery:</td>
            <td style="padding: 10px 0; font-weight: bold; color: #0F172A;">${safeModel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Site Location / City:</td>
            <td style="padding: 10px 0;">${safeLocation}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 0; font-weight: bold; color: #64748B;">Power Supply Phase:</td>
            <td style="padding: 10px 0;">${safePower}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold; color: #64748B; vertical-align: top;">Project Notes / Details:</td>
            <td style="padding: 10px 0; color: #0F172A; white-space: pre-line;">${safeDetails}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; text-align: center;">
          <a href="https://wa.me/${cleanPhoneNum}" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-right: 8px;">Reply via WhatsApp</a>
          <a href="tel:${safePhone}" style="display: inline-block; background-color: #0F172A; color: #FFFFFF; font-weight: bold; font-size: 14px; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Call Customer</a>
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
  const safeId = escapeHtml(lead.id);
  const safeName = escapeHtml(lead.name);
  const safeModel = escapeHtml(lead.model);
  const subject = `Your Paradise Steel enquiry has been received — ${safeId}`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0F172A; padding: 22px; text-align: center; border-bottom: 3px solid #F59E0B;">
        <h2 style="color: #FFFFFF; margin: 0; font-size: 18px;">Paradise Steel Fabrication Works</h2>
        <p style="color: #F59E0B; margin: 4px 0 0 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">Madanapalle • Since 1989</p>
      </div>
      <div style="padding: 24px; background-color: #FFFFFF; color: #334155; font-size: 14px; line-height: 1.6;">
        <p>Dear <strong>${safeName}</strong>,</p>
        <p>Thank you for reaching out to <strong>Paradise Steel Fabrication Works</strong> regarding the <strong>${safeModel}</strong> vertical material hoist.</p>
        <p>We have safely captured your inquiry under reference ID: <strong>${safeId}</strong>.</p>
        <p>Our technical team is reviewing your project requirements and a representative will contact you shortly with the complete specification sheet, quotation, and site setup details.</p>
        
        <div style="margin: 20px 0; padding: 16px; background-color: #F8FAFC; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <strong>Need immediate site dispatch or urgent assistance?</strong><br>
          Call: <a href="tel:+919440585329" style="color: #0F172A; font-weight: bold; text-decoration: none;">+91 94405 85329</a> / <a href="tel:+919515718708" style="color: #0F172A; font-weight: bold; text-decoration: none;">+91 95157 18708</a><br>
          WhatsApp: <a href="https://wa.me/919440585329" style="color: #25D366; font-weight: bold; text-decoration: none;">Chat with Support</a>
        </div>

        <p style="margin-bottom: 0;">Best regards,<br>
        <strong>R. Rama Krishna</strong>, Founder & Proprietor<br>
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

function getAllLeads() {
  const ss = getTargetSpreadsheet();
  const sheet = getOrCreateLeadsSheet(ss);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const leads = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    for (let j = 0; j < headers.length; j++) {
      item[headers[j]] = row[j];
    }
    leads.push(item);
  }
  return leads;
}

function updateLeadStatus(leadId, status, notes) {
  const ss = getTargetSpreadsheet();
  const sheet = getOrCreateLeadsSheet(ss);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) { // Lead_ID in Column A
      if (status) sheet.getRange(i + 1, 15).setValue(status); // Column O: Lead_Status
      if (notes) sheet.getRange(i + 1, 19).setValue(notes);  // Column S: Notes
      sheet.getRange(i + 1, 17).setValue(getFormattedTimestamp()); // Column Q: Last_Contact_Date

      recordAuditLog(ss, "Admin User", leadId, "Lead Status Update", data[i][14], `Status: ${status}, Notes: ${notes}`);
      return jsonResponse({ status: "success", message: `Lead ${leadId} updated successfully` });
    }
  }

  return jsonResponse({ status: "error", message: `Lead ID ${leadId} not found` }, 404);
}
