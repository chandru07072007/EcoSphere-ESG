import emailjs from '@emailjs/browser';

// ============================================================
// EMAILJS CONFIGURATION
// ============================================================
// To configure EmailJS:
// 1. Sign up at https://www.emailjs.com/
// 2. Create an Email Service (Gmail, Outlook, etc.)
// 3. Create Email Templates for each use case
// 4. Replace the constants below with your actual keys
// 5. Optionally store them in environment variables (VITE_EMAILJS_*)
//
// Example .env:
//   VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
//   VITE_EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxx
//   VITE_EMAILJS_TEMPLATE_WELCOME=template_xxxxxxx
//   VITE_EMAILJS_TEMPLATE_NOTIFICATION=template_xxxxxxx
//   VITE_EMAILJS_TEMPLATE_COMPLIANCE=template_xxxxxxx
// ============================================================

const SERVICE_ID         = import.meta.env.VITE_EMAILJS_SERVICE_ID         || 'service_ecosphere';
const PUBLIC_KEY         = import.meta.env.VITE_EMAILJS_PUBLIC_KEY          || 'YOUR_EMAILJS_PUBLIC_KEY';
const TEMPLATE_WELCOME   = import.meta.env.VITE_EMAILJS_TEMPLATE_WELCOME    || 'template_welcome';
const TEMPLATE_NOTIF     = import.meta.env.VITE_EMAILJS_TEMPLATE_NOTIF      || 'template_notification';
const TEMPLATE_COMPLIANCE= import.meta.env.VITE_EMAILJS_TEMPLATE_COMPLIANCE || 'template_compliance';

// Initialize EmailJS
emailjs.init(PUBLIC_KEY);

// ============================================================
// EMAIL FUNCTIONS
// ============================================================

/**
 * Send a welcome email to a newly registered user.
 * @param {string} toEmail - Recipient email address
 * @param {string} toName  - Recipient's display name
 */
export const sendWelcomeEmail = async (toEmail, toName) => {
  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_WELCOME, {
      to_email: toEmail,
      to_name: toName,
      from_name: 'EcoSphere ESG Platform',
      platform_url: window.location.origin,
      year: new Date().getFullYear(),
    });
    return result;
  } catch (error) {
    console.error('EmailJS sendWelcomeEmail error:', error);
    throw error;
  }
};

/**
 * Send a general notification email.
 * @param {string} toEmail  - Recipient email address
 * @param {string} subject  - Email subject
 * @param {string} message  - Email body message
 */
export const sendNotificationEmail = async (toEmail, subject, message) => {
  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_NOTIF, {
      to_email: toEmail,
      subject,
      message,
      from_name: 'EcoSphere ESG Platform',
      sent_at: new Date().toLocaleString(),
    });
    return result;
  } catch (error) {
    console.error('EmailJS sendNotificationEmail error:', error);
    throw error;
  }
};

/**
 * Send a compliance alert email when a critical issue is raised.
 * @param {string} toEmail   - Recipient email address
 * @param {string} issueName - Name/title of the compliance issue
 * @param {string} severity  - Severity level: critical | high | medium | low
 */
export const sendComplianceAlert = async (toEmail, issueName, severity) => {
  try {
    const result = await emailjs.send(SERVICE_ID, TEMPLATE_COMPLIANCE, {
      to_email: toEmail,
      issue_name: issueName,
      severity: severity.toUpperCase(),
      severity_color: {
        critical: '#E05C5C',
        high: '#F7A84F',
        medium: '#4F8EF7',
        low: '#7B8DB0',
      }[severity] || '#7B8DB0',
      platform_url: `${window.location.origin}/governance/compliance`,
      sent_at: new Date().toLocaleString(),
      from_name: 'EcoSphere Compliance Team',
    });
    return result;
  } catch (error) {
    console.error('EmailJS sendComplianceAlert error:', error);
    throw error;
  }
};
