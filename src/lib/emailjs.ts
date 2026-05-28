import emailjs from '@emailjs/browser';

// EmailJS Configuration
// Sign up at https://www.emailjs.com/ and get your credentials
// 1. Create an account at emailjs.com
// 2. Add an email service (Gmail, Outlook, etc.)
// 3. Create an email template
// 4. Get your Public Key, Service ID, and Template ID

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';

export interface EmailOTPData {
  to_email: string;
  to_name: string;
  otp_code: string;
  hotel_name: string;
}

export const initEmailJS = () => {
  if (EMAILJS_PUBLIC_KEY) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }
};

export const sendOTPEmail = async (data: EmailOTPData): Promise<{ success: boolean; error?: string }> => {
  // Check if EmailJS is configured
  if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
    console.warn('EmailJS not configured. OTP for testing:', data.otp_code);
    // Return success for development/testing purposes
    return {
      success: true,
      error: 'EmailJS not configured. Check console for OTP code.'
    };
  }

  try {
    const templateParams = {
      to_email: data.to_email,
      to_name: data.to_name,
      otp_code: data.otp_code,
      hotel_name: data.hotel_name,
      from_name: 'Thamel Heritage Hotel',
      reply_to: 'noreply@thamelheritage.com',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Email sent successfully:', response);
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
};

// Check if EmailJS is configured
export const isEmailJSConfigured = (): boolean => {
  return !!(EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID);
};
