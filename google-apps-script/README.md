# Paradise Steel Fabrication Works (PSFW) — Apps Script Backend v3.0

Production-ready Google Apps Script API engine linking the PSFW public website to the centralized **`PSFW — Business Operations Database`** in Google Drive.

---

## 🔒 Security & Architectural Governance

1. **Fail-Closed Administrative Security**:
   - Privileged operations (`getLeads`, `update_lead`) strictly require an authorized token.
   - **Zero Hard-Coded Fallbacks**: If `ADMIN_API_KEY` is not explicitly configured in Script Properties, the API automatically rejects administrative requests with a `401 Unauthorized` response.
2. **Master Database Integration**:
   - Target Spreadsheet: `PSFW — Business Operations Database` (`01_Leads` worksheet).
   - Configurable via `MASTER_SHEET_ID` in Script Properties (defaults to `1gDPo7gaOjcPiz5yyWfSkkBlcwG3GN5acFnf3iAuYS7Y`).
3. **Automated Audit Logging**:
   - Every lead ingestion and administrative status modification automatically generates an audit record in `15_Audit_Log`.
4. **Three Official Products**:
   - Native support and input normalization for:
     - `SPEED LIFT 150`
     - `SPEED LIFT 250`
     - `SPEED LIFT 500`
5. **Anti-Spam & Concurrency Controls**:
   - Hidden honeypot field (`leadHoneypot`) for silent bot discarding.
   - Google `LockService` concurrency lock (up to 10 seconds) ensuring sequential, conflict-free `PSFW-YYYY-XXXX` lead ID generation.
6. **XSS Protection**:
   - All user-supplied inputs (`name`, `phone`, `model`, `location`, `projectDetails`) are strictly HTML-escaped before insertion into manager and customer email templates.

---

## ⚙️ Script Properties Configuration

In the Apps Script editor, navigate to **Project Settings (⚙️) > Script Properties** and add the following keys:

| Property Key | Value Description | Example |
| :--- | :--- | :--- |
| `ADMIN_API_KEY` | Strong random alphanumeric token for internal CRM queries | *Generated secure 32-char token* |
| `MASTER_SHEET_ID` | Google Drive File ID of the master database | `1gDPo7gaOjcPiz5yyWfSkkBlcwG3GN5acFnf3iAuYS7Y` |
| `MANAGER_EMAIL` | Destination mailbox for instant lead notifications | `manager.psfw@gmail.com` |

---

## 🚀 Deployment Instructions

1. Open your Google Apps Script project at [script.google.com](https://script.google.com).
2. Copy the contents of [`Code.gs`](./Code.gs) into the project editor.
3. Configure the Script Properties as shown above.
4. Click **Deploy > Manage Deployments > Edit (or New Deployment)**:
   - **Select type**: Web app
   - **Description**: `PSFW API v3.0 - Three Model Support & Master DB`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` (required for public website form submission)
5. Click **Deploy** and copy the resulting Web App URL (`https://script.google.com/macros/s/.../exec`).
6. Update `CONFIG.APPS_SCRIPT_URL` in [`js/app.js`](../js/app.js) with the deployment URL.
