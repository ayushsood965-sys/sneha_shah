import FormData from 'form-data';
import Mailgun from 'mailgun.js';

// ─── Mailgun client (lazy-initialized) ──────────────────────────
let _mgClient = null;

function getMailgunClient() {
    if (!_mgClient) {
        const mailgun = new Mailgun(FormData);
        _mgClient = mailgun.client({
            username: 'api',
            key: process.env.MAILGUN_API_KEY
        });
        console.log('🔫 Mailgun API client initialized.');
    }
    return _mgClient;
}

function getMailgunDomain() {
    return process.env.MAILGUN_DOMAIN;
}

function getFrom() {
    return `"${process.env.SMTP_FROM_NAME || 'EdVantage Uni'}" <${process.env.SMTP_FROM_EMAIL}>`;
}

function getNotifyEmail() {
    return process.env.NOTIFY_EMAIL || 'connectwithsnehashah@gmail.com';
}

// ─── Shared Template Wrapper ────────────────────────────────────
function wrapTemplate(bodyContent) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EdVantage Uni</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,58,138,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">
                EdVantage <span style="color:#93c5fd;">Uni</span>
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.75);font-size:13px;font-weight:500;letter-spacing:0.5px;">
                YOUR GLOBAL EDUCATION PARTNER
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 24px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;border-top:1px solid #e2e8f0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">
                      © ${new Date().getFullYear()} EdVantage Uni. All rights reserved.
                    </p>
                    <p style="margin:0;color:#94a3b8;font-size:11px;">
                      📧 info@edvantageuni.com
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Detail Row Helper ──────────────────────────────────────────
function detailRow(label, value, icon = '') {
    return `
    <tr>
      <td style="padding:10px 16px;color:#64748b;font-size:13px;font-weight:600;width:140px;vertical-align:top;">
        ${icon} ${label}
      </td>
      <td style="padding:10px 16px;color:#0f172a;font-size:14px;font-weight:500;">
        ${value}
      </td>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════════
//  INQUIRY EMAILS
// ═══════════════════════════════════════════════════════════════

/**
 * Send inquiry confirmation to the student
 */
function buildStudentInquiryEmail(data) {
    const body = `
    <h2 style="margin:0 0 8px;color:#1e3a8a;font-size:20px;font-weight:700;">
      Thank You for Your Inquiry! 🎓
    </h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
      Hi <strong>${data.name}</strong>, we've received your inquiry and our counselor will get back to you within 
      <strong>24 hours</strong>. Here's a summary of what you submitted:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:12px 16px;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          📋 INQUIRY DETAILS
        </td>
      </tr>
      ${detailRow('Name', data.name, '👤')}
      ${detailRow('Email', data.email, '📧')}
      ${detailRow('Phone', data.phone, '📞')}
      ${detailRow('Destination', data.destination, '🌍')}
      ${detailRow('Service', data.service, '🛠️')}
      ${detailRow('Message', data.message, '💬')}
    </table>

    <div style="background:linear-gradient(135deg,rgba(30,58,138,0.06),rgba(37,99,235,0.08));border:1px solid rgba(30,58,138,0.12);border-radius:10px;padding:16px 20px;margin-bottom:8px;">
      <p style="margin:0;color:#1e3a8a;font-size:13px;font-weight:600;">
        💡 <strong>What's next?</strong> Our counselor will review your profile and reach out to you personally.
      </p>
    </div>`;

    return wrapTemplate(body);
}

/**
 * Send inquiry notification to the counselor
 */
function buildCounselorInquiryEmail(data) {
    const body = `
    <h2 style="margin:0 0 8px;color:#1e3a8a;font-size:20px;font-weight:700;">
      📩 New Student Inquiry Received
    </h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
      A new inquiry has been submitted through the EdVantage Uni portal. Details below:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:12px 16px;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          📋 STUDENT INQUIRY
        </td>
      </tr>
      ${detailRow('Name', data.name, '👤')}
      ${detailRow('Email', `<a href="mailto:${data.email}" style="color:#2563eb;text-decoration:none;">${data.email}</a>`, '📧')}
      ${detailRow('Phone', data.phone, '📞')}
      ${detailRow('Destination', data.destination, '🌍')}
      ${detailRow('Service', data.service, '🛠️')}
      ${detailRow('Message', data.message, '💬')}
      ${detailRow('Submitted', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST', '🕒')}
    </table>

    <p style="margin:0;color:#64748b;font-size:13px;">
      Please respond to the student at <a href="mailto:${data.email}" style="color:#2563eb;">${data.email}</a> at your earliest convenience.
    </p>`;

    return wrapTemplate(body);
}

// ═══════════════════════════════════════════════════════════════
//  BOOKING EMAILS
// ═══════════════════════════════════════════════════════════════

/**
 * Send booking confirmation to the student
 */
function buildStudentBookingEmail(data) {
    const body = `
    <h2 style="margin:0 0 8px;color:#1e3a8a;font-size:20px;font-weight:700;">
      Your Discovery Call is Confirmed! 📅
    </h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
      Hi <strong>${data.name}</strong>, your free discovery call with our counselor has been successfully 
      scheduled. Here are your booking details:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:12px 16px;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          📅 BOOKING CONFIRMATION
        </td>
      </tr>
      ${detailRow('Name', data.name, '👤')}
      ${detailRow('Email', data.email, '📧')}
      ${detailRow('Phone', data.phone, '📞')}
      ${detailRow('Date', data.date, '📆')}
      ${detailRow('Time Slot', data.timeSlot + ' (IST)', '🕒')}
    </table>

    <div style="background:linear-gradient(135deg,rgba(16,185,129,0.06),rgba(5,150,105,0.08));border:1px solid rgba(16,185,129,0.18);border-radius:10px;padding:16px 20px;margin-bottom:16px;">
      <p style="margin:0;color:#047857;font-size:13px;font-weight:600;">
        ✅ <strong>You're all set!</strong> Our counselor will connect with you at the scheduled time. Please keep your phone accessible.
      </p>
    </div>

    <div style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);border-radius:10px;padding:14px 20px;">
      <p style="margin:0;color:#92400e;font-size:12px;font-weight:600;">
        ⚠️ Need to reschedule? Reply to this email or contact us at info@edvantageuni.com
      </p>
    </div>`;

    return wrapTemplate(body);
}

/**
 * Send booking notification to the counselor
 */
function buildCounselorBookingEmail(data) {
    const body = `
    <h2 style="margin:0 0 8px;color:#1e3a8a;font-size:20px;font-weight:700;">
      📅 New Discovery Call Booked
    </h2>
    <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.7;">
      A student has booked a free discovery call session. Details below:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td colspan="2" style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:12px 16px;color:#fff;font-size:13px;font-weight:700;letter-spacing:0.5px;">
          📅 BOOKING DETAILS
        </td>
      </tr>
      ${detailRow('Student Name', data.name, '👤')}
      ${detailRow('Email', `<a href="mailto:${data.email}" style="color:#2563eb;text-decoration:none;">${data.email}</a>`, '📧')}
      ${detailRow('Phone', data.phone, '📞')}
      ${detailRow('Date', `<strong style="color:#1e3a8a;">${data.date}</strong>`, '📆')}
      ${detailRow('Time Slot', `<strong style="color:#2563eb;">${data.timeSlot} (IST)</strong>`, '🕒')}
      ${detailRow('Booked At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST', '📝')}
    </table>

    <p style="margin:0;color:#64748b;font-size:13px;">
      Please ensure you are available at the scheduled time to connect with <strong>${data.name}</strong>.
    </p>`;

    return wrapTemplate(body);
}

// ═══════════════════════════════════════════════════════════════
//  SEND FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Send inquiry emails (to student + counselor)
 */
export async function sendInquiryEmails(data) {
    try {
        const client = getMailgunClient();
        const domain = getMailgunDomain();
        const from = getFrom();
        const notifyEmail = getNotifyEmail();

        // Email to student
        const studentRes = await client.messages.create(domain, {
            from,
            to: [data.email],
            subject: '✅ Inquiry Received — EdVantage Uni',
            html: buildStudentInquiryEmail(data)
        });
        console.log(`📧 Inquiry confirmation sent to student via Mailgun: ${data.email}. ID: ${studentRes.id}. Msg: ${studentRes.message}`);

        // Email to counselor
        const counselorRes = await client.messages.create(domain, {
            from,
            to: [notifyEmail],
            subject: `📩 New Inquiry from ${data.name} — ${data.destination}`,
            html: buildCounselorInquiryEmail(data)
        });
        console.log(`📧 Inquiry notification sent to counselor via Mailgun: ${notifyEmail}. ID: ${counselorRes.id}. Msg: ${counselorRes.message}`);
        return true;
    } catch (err) {
        console.error('❌ Failed to send inquiry emails via Mailgun:', err.message || err);
        return false;
    }
}

/**
 * Send booking confirmation emails (to student + counselor)
 */
export async function sendBookingEmails(data) {
    try {
        const client = getMailgunClient();
        const domain = getMailgunDomain();
        const from = getFrom();
        const notifyEmail = getNotifyEmail();

        // Email to student
        const studentRes = await client.messages.create(domain, {
            from,
            to: [data.email],
            subject: `📅 Discovery Call Confirmed — ${data.date} at ${data.timeSlot} (IST)`,
            html: buildStudentBookingEmail(data)
        });
        console.log(`📧 Booking confirmation sent to student via Mailgun: ${data.email}. ID: ${studentRes.id}. Msg: ${studentRes.message}`);

        // Email to counselor
        const counselorRes = await client.messages.create(domain, {
            from,
            to: [notifyEmail],
            subject: `📅 New Booking: ${data.name} — ${data.date} at ${data.timeSlot}`,
            html: buildCounselorBookingEmail(data)
        });
        console.log(`📧 Booking notification sent to counselor via Mailgun: ${notifyEmail}. ID: ${counselorRes.id}. Msg: ${counselorRes.message}`);
        return true;
    } catch (err) {
        console.error('❌ Failed to send booking emails via Mailgun:', err.message || err);
        return false;
    }
}

