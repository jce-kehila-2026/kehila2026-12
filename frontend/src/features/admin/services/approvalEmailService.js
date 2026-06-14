// Sends the membership-approval email (containing the temporary password)
// straight from the browser via EmailJS — no backend / Firebase Blaze needed.
//
// One-time setup (https://www.emailjs.com, free tier):
//   1. Add an email service (e.g. connect a Gmail account).
//   2. Create a template whose body uses the variables listed below.
//   3. Put these three IDs in frontend/.env.local:
//        VITE_EMAILJS_SERVICE_ID    Email Services → your service ID
//        VITE_EMAILJS_TEMPLATE_ID   Email Templates → your template ID
//        VITE_EMAILJS_PUBLIC_KEY    Account → General → Public Key
//
// Template variables this service sends:
//   {{to_email}}      recipient address — set this as the template's "To Email"
//   {{full_name}}     applicant's full name
//   {{login_email}}   the email they sign in with (same as to_email)
//   {{temp_password}} the temporary password
//   {{login_url}}     link to the login page
//   {{org_name}}      organization name
import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

const ORG_NAME = 'שינה את החיים שלך';

/** True only when all three EmailJS env vars are present. */
export function isApprovalEmailConfigured() {
  return Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);
}

/**
 * Send the approval email. Throws on missing config or send failure so the
 * caller can fall back to sharing the password manually.
 */
export async function sendApprovalEmail({ toEmail, fullName, tempPassword, loginUrl }) {
  if (!isApprovalEmailConfigured()) {
    const error = new Error('EmailJS is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const templateParams = {
    to_email: toEmail,
    email: toEmail,
    login_email: toEmail,
    full_name: fullName || '',
    to_name: fullName || '',
    temp_password: tempPassword,
    login_url: loginUrl || '',
    org_name: ORG_NAME,
  };

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY });
}
