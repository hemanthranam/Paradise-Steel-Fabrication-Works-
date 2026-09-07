# Paradise Steel Fabrication Works — Google Apps Script Backend Guide

This folder contains the complete, production-grade Google Apps Script backend for handling website lead capture, Google Sheet recording, and automated email dispatch.

---

## 1. Google Sheet Setup

1. Go to [Google Sheets](https://sheets.new) and create a new spreadsheet.
2. Title the spreadsheet:
   ```
   Paradise Steel Fabrication Works — Machinery Enquiries & Leads
   ```
3. Rename the first sheet tab from `Sheet1` to:
   ```
   Leads
   ```
4. Add the following 12 column headers in row 1:

| Col | Header Name | Data Description |
|:---:|---|---|
| **A** | `Timestamp` | Submission Date/Time (IST: YYYY-MM-DD HH:mm:ss) |
| **B** | `Inquiry_ID` | Sequential ID (e.g., PSFW-2026-0001) |
| **C** | `Full_Name` | Customer Name |
| **D** | `Phone_Number` | Validated Contact Mobile Number |
| **E** | `Email` | Customer Email |
| **F** | `Model_Interested` | SPEED LIFT 150 / SPEED LIFT 200 / SPEED LIFT 500 / AMC |
| **G** | `Site_Location` | City / Construction Site Pincode |
| **H** | `Power_Phase` | Single Phase / Three Phase |
| **I** | `Project_Details` | Building floors, height requirements, load notes |
| **J** | `Lead_Source` | Webpage source (index.html, quote.html, etc.) |
| **K** | `Status` | Initial value: `New` |
| **L** | `Notes` | Internal sales follow-up remarks |

---

## 2. Deploying the Apps Script

1. In your Google Sheet, click **Extensions** > **Apps Script**.
2. Delete any existing code in the editor and replace it with the entire contents of [`Code.gs`](file:///Users/rh/.gemini/antigravity-ide/scratch/Paradise-Steel-Fabrication-Works-/google-apps-script/Code.gs).
3. Click the **Settings (gear icon)** on the left navigation > **Script Properties**:
   - Add property `MANAGER_EMAIL`: `manager.psfw@gmail.com`
   - Add property `TIMEZONE`: `Asia/Kolkata`
   - (Optional) Add property `ADMIN_API_KEY`: A secure random secret for CRM integrations
4. Click **Deploy** > **New deployment**:
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Description: `Paradise Steel Lead API v2.0`
   - Execute as: **Me** (`your-email@gmail.com`)
   - Who has access: **Anyone** (Required for public contact form submissions)
5. Click **Deploy** and grant necessary Google permissions.
6. Copy the generated **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).
7. Update the `CONFIG.APPS_SCRIPT_URL` in `js/app.js` with your production URL.
