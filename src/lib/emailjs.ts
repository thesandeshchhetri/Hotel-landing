// OTP delivery is handled by the server-side create-booking Edge Function.
// This module remains as a compatibility shim for any older imports; it never logs or exposes OTPs.
export interface EmailOTPData {
  to_email: string;
  to_name: string;
  otp_code: string;
  hotel_name: string;
}

export const initEmailJS = (): void => {};

export const sendOTPEmail = async (_data: EmailOTPData): Promise<{ success: boolean; error?: string }> => ({
  success: false,
  error: 'Client-side OTP email delivery is disabled. Use the create-booking Edge Function.',
});

export const isEmailJSConfigured = (): boolean => false;
