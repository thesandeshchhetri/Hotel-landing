import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendOtpRequest {
  email: string;
  otp: string;
  guestName: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, otp, guestName }: SendOtpRequest = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      // Use Resend API for email sending
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Thamel Heritage Hotel <noreply@thamelheritage.com>",
          to: email,
          subject: "Your Booking Verification Code - Thamel Heritage Hotel",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verification Code</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 0;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Thamel Heritage Hotel</h1>
                          <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 14px;">Experience Luxury in the Heart of Kathmandu</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 40px;">
                          <h2 style="margin: 0; color: #1f2937; font-size: 24px;">Dear ${guestName},</h2>
                          <p style="margin: 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Thank you for choosing Thamel Heritage Hotel! To complete your booking confirmation, please use the verification code below:
                          </p>
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                            <tr>
                              <td align="center">
                                <table cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 2px dashed #d97706; border-radius: 12px; padding: 20px 40px;">
                                  <tr>
                                    <td style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #b45309; text-align: center;">
                                      ${otp}
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          <p style="margin: 20px 0; color: #dc2626; font-size: 14px; font-weight: 600;">
                            This code will expire in 10 minutes.
                          </p>
                          <p style="margin: 20px 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
                            If you did not make this booking request, please ignore this email.
                          </p>
                          <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 12px;">
                              Best regards,<br>
                              <strong style="color: #b45309;">Thamel Heritage Hotel Team</strong><br>
                              Thamel, Kathmandu, Nepal
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin-top: 20px; color: #9ca3af; font-size: 12px;">
                      &copy; ${new Date().getFullYear()} Thamel Heritage Hotel. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.text();
        console.error("Resend API error:", errorData);
        throw new Error("Failed to send email via Resend");
      }

      const emailResult = await emailResponse.json();
      console.log("Email sent successfully via Resend:", emailResult);

      return new Response(
        JSON.stringify({
          success: true,
          message: "OTP sent successfully",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Fallback: Store OTP in database and return for testing
      console.log("RESEND_API_KEY not configured. Using fallback mode.");
      console.log(`OTP for ${email}: ${otp}`);

      // Store the OTP for verification
      return new Response(
        JSON.stringify({
          success: true,
          message: "OTP generated (email service not configured)",
          otp: otp,
          note: "Configure RESEND_API_KEY for email delivery",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in send-otp function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send OTP",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
