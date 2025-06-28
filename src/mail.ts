import { createTransport } from 'nodemailer';

// SMTP configuration for email sending
export const smtpTransport = createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: '90bc05001@smtp-brevo.com',
    pass: 'J7mDIhn4KTfrHwtg'
  }
});

// Email sending utility function
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    await smtpTransport.sendMail({
      from: '"Halısaha App" <noreply@halisaha.app>',
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};