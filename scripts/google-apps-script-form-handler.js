/**
 * Google Apps Script — Consulting Form Handler
 *
 * SETUP:
 * 1. Create a new Google Sheet (name it "Qinnovate Consulting Leads")
 * 2. In the sheet, go to Extensions → Apps Script
 * 3. Paste this entire file into the script editor (replace any existing code)
 * 4. Update NOTIFICATION_EMAIL below with your real email
 * 5. Click Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the deployment URL
 * 7. Paste the URL into consulting.astro (replace the GOOGLE_SCRIPT_URL constant)
 * 8. Done — form submissions go to the Sheet + you get email notifications
 *
 * The Sheet will auto-create headers on the first submission.
 */

// ====== CONFIGURATION ======
const NOTIFICATION_EMAIL = 'YOUR_EMAIL_HERE'; // ← Replace with your email
const SHEET_NAME = 'Submissions';
// ============================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    let tab = sheet.getSheetByName(SHEET_NAME);

    // Create sheet with headers if it doesn't exist
    if (!tab) {
      tab = sheet.insertSheet(SHEET_NAME);
      tab.appendRow([
        'Timestamp',
        'Name',
        'Email',
        'Organization',
        'Role',
        'Service',
        'Timeline',
        'Budget',
        'Message',
        'Status'
      ]);
      tab.getRange(1, 1, 1, 10).setFontWeight('bold');
    }

    // Write the row
    tab.appendRow([
      new Date().toISOString(),
      data.name || '',
      data.email || '',
      data.organization || '',
      data.role || '',
      data.service || '',
      data.timeline || '',
      data.budget || '',
      data.message || '',
      'New'
    ]);

    // Send email notification
    const subject = `New Consulting Inquiry: ${data.service || 'General'} — ${data.organization || 'Unknown'}`;
    const body = [
      `New consulting inquiry from qinnovate.com`,
      ``,
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Organization: ${data.organization}`,
      `Role: ${data.role || 'Not provided'}`,
      `Service: ${data.service || 'Not specified'}`,
      `Timeline: ${data.timeline || 'Not specified'}`,
      `Budget: ${data.budget || 'Not specified'}`,
      ``,
      `Message:`,
      `${data.message}`,
      ``,
      `---`,
      `Reply directly to ${data.email} to respond.`,
    ].join('\n');

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      replyTo: data.email,
      subject: subject,
      body: body,
    });

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle CORS preflight
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'Form handler is active' }))
    .setMimeType(ContentService.MimeType.JSON);
}
