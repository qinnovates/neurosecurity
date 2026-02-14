// ====== CONFIGURATION ======
var NOTIFICATION_EMAIL = 'YOUR_EMAIL_HERE'; // ← Replace with your email
var SHEET_NAME = 'Submissions';
var MAX_FIELD_LENGTH = 1000;   // Max chars per field
var MAX_MESSAGE_LENGTH = 5000; // Max chars for message body
var MAX_SUBMISSIONS_PER_HOUR = 20;
// ============================

// Prevent spreadsheet formula injection
function sanitize(val) {
  if (typeof val !== 'string') return '';
  // Strip control characters (except newlines in message)
  val = val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // Prefix dangerous characters that Sheets interprets as formulas
  if (/^[=+\-@\t\r]/.test(val)) return "'" + val;
  return val;
}

// Truncate string to max length
function truncate(val, max) {
  if (typeof val !== 'string') return '';
  return val.slice(0, max);
}

// Validate email format — no newlines, basic structure
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  if (/[\r\n\x00]/.test(email)) return false; // Header injection prevention
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Strip control characters from string (for email subject/body)
function stripControl(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x1F\x7F]/g, '');
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Basic validation — reject if required fields missing or wrong type
    if (!data.name || typeof data.name !== 'string' ||
        !data.email || typeof data.email !== 'string' ||
        !data.message || typeof data.message !== 'string') {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', error: 'Missing required fields' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', error: 'Invalid email format' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Rate limit — max submissions per hour via script properties
    var props = PropertiesService.getScriptProperties();
    var hourKey = 'rate_' + new Date().toISOString().slice(0, 13);
    var count = parseInt(props.getProperty(hourKey) || '0');
    if (count >= MAX_SUBMISSIONS_PER_HOUR) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', error: 'Too many submissions. Try again later.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    props.setProperty(hourKey, (count + 1).toString());

    // Truncate and sanitize all fields
    var clean = {
      name:         sanitize(truncate(data.name, MAX_FIELD_LENGTH)),
      email:        truncate(data.email, 254),
      organization: sanitize(truncate(data.organization || '', MAX_FIELD_LENGTH)),
      role:         sanitize(truncate(data.role || '', MAX_FIELD_LENGTH)),
      service:      sanitize(truncate(data.service || '', MAX_FIELD_LENGTH)),
      timeline:     sanitize(truncate(data.timeline || '', MAX_FIELD_LENGTH)),
      budget:       sanitize(truncate(data.budget || '', MAX_FIELD_LENGTH)),
      message:      sanitize(truncate(data.message, MAX_MESSAGE_LENGTH)),
    };

    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var tab = sheet.getSheetByName(SHEET_NAME);

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
      clean.name,
      clean.email,
      clean.organization,
      clean.role,
      clean.service,
      clean.timeline,
      clean.budget,
      clean.message,
      'New'
    ]);

    // Send email notification (all values stripped of control chars)
    var subject = stripControl(
      'New Consulting Inquiry: ' + (clean.service || 'General') + ' — ' + (clean.organization || 'Unknown')
    ).slice(0, 200);

    var body = [
      'New consulting inquiry from qinnovate.com',
      '',
      'Name: ' + stripControl(clean.name),
      'Email: ' + clean.email,
      'Organization: ' + stripControl(clean.organization),
      'Role: ' + stripControl(clean.role || 'Not provided'),
      'Service: ' + stripControl(clean.service || 'Not specified'),
      'Timeline: ' + stripControl(clean.timeline || 'Not specified'),
      'Budget: ' + stripControl(clean.budget || 'Not specified'),
      '',
      'Message:',
      stripControl(clean.message),
      '',
      '---',
      'Reply directly to ' + clean.email + ' to respond.',
    ].join('\n');

    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      replyTo: clean.email, // Already validated format + no newlines
      subject: subject,
      body: body,
    });

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Don't leak internal error details
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: 'Something went wrong. Please try again.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
