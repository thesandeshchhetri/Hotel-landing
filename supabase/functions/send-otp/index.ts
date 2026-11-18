import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info",
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]!),
  );

async function otpDigest(otp: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(otp)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ success: false, error: "Method not allowed." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mailKey = Deno.env.get("RESEND_API_KEY");
    const hashSecret = Deno.env.get("OTP_HASH_SECRET");

    if (!url || !serviceKey || !mailKey || !hashSecret) {
      return reply({ success: false, error: "The verification service is not configured." }, 503);
    }

    const body = await req.json();
    const bookingId = body?.bookingId;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (
      typeof bookingId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254
    ) {
      return reply({ success: false, error: "Unable to resend the code. Please check your booking and email." });
    }

    const db = createClient(url, serviceKey);
    const otp = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
    const { data: outcome, error: rpcError } = await db.rpc("resend_booking_otp", {
      p_booking_id: bookingId,
      p_guest_email: email,
      p_otp_hash: await otpDigest(otp, hashSecret),
      p_otp_expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
    });

    if (rpcError) {
      console.error("OTP resend RPC failed:", rpcError.message);
      return reply({ success: false, error: "Unable to resend the code right now." }, 500);
    }

    if (outcome === "cooldown") {
      return reply({ success: false, error: "Please wait 60 seconds before requesting another code." });
    }
    if (outcome === "limit") {
      return reply({ success: false, error: "You have reached the resend limit. Please try again in an hour." });
    }
    if (outcome !== "sent") {
      return reply({ success: false, error: "This booking cannot receive another verification code." });
    }

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .select("guest_name, guest_email")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking || booking.guest_email.toLowerCase() !== email) {
      console.error("OTP resend booking lookup failed:", bookingError?.message);
      return reply({ success: false, error: "Unable to deliver the verification code." }, 500);
    }

    const html =
      '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">' +
      '<h2>Thamel Heritage Hotel</h2><p>Hello ' + escapeHtml(booking.guest_name) + ',</p>' +
      '<p>Your new one-time booking code:</p>' +
      '<p style="font-size:32px;font-weight:bold;letter-spacing:8px">' + otp + '</p>' +
      '<p>This code expires in 10 minutes. Ignore this email if you did not request it.</p></div>';

    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + mailKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("BOOKING_FROM_EMAIL") ?? "Thamel Heritage Hotel <onboarding@resend.dev>",
        to: [email],
        subject: "Your new Thamel Heritage Hotel verification code",
        html,
      }),
    });

    if (!mail.ok) {
      console.error("OTP resend email delivery failed:", await mail.text());
      return reply({ success: false, error: "The email could not be delivered. Please wait 60 seconds before trying again." }, 502);
    }

    return reply({ success: true, message: "A new verification code has been sent." });
  } catch (error) {
    console.error("send-otp error:", error);
    return reply({ success: false, error: "Unable to resend the code right now." }, 500);
  }
});
