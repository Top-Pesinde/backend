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

// Get sender email from environment or use verified default
const getSenderEmail = (): string => {
  // Environment variable'dan al
  const envSender = process.env.MAIL_FROM_ADDRESS;
  if (envSender) {
    return envSender;
  }

  // Brevo'da doğrulanmış olası sender adresleri (fallback)
  const verifiedSenders = [
    '90bc05001@smtp-brevo.com', // Brevo login email'i genellikle doğrulanmış olur
    'noreply@gmail.com',        // Test için generic
    'test@example.com'          // Geliştirme için
  ];

  console.warn('⚠️  MAIL_FROM_ADDRESS environment variable bulunamadı. Fallback sender kullanılıyor.');
  return verifiedSenders[0];
};

// Email sending utility function
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const senderEmail = getSenderEmail();
    const senderName = process.env.MAIL_FROM_NAME || 'Halısaha App';

    console.log(`📧 Email gönderiliyor: ${senderName} <${senderEmail}> -> ${to}`);

    await smtpTransport.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      html
    });

    console.log('✅ Email başarıyla gönderildi');
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};