import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]!));

async function otpDigest(otp: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(otp)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const mailKey = Deno.env.get("RESEND_API_KEY"), secret = Deno.env.get("OTP_HASH_SECRET");
    if (!url || !key || !mailKey || !secret) return reply({ error: "Booking service is not configured." }, 503);
    const b = await req.json();
    if (typeof b.room_id !== "string" || typeof b.guest_name !== "string" || typeof b.guest_email !== "string" ||
        typeof b.guest_phone !== "string" || typeof b.check_in_date !== "string" || typeof b.check_out_date !== "string" ||
        !Number.isInteger(b.number_of_guests)) return reply({ error: "Please provide valid booking details." }, 400);
    const email = b.guest_email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reply({ error: "Invalid email address." }, 400);

    const otp = String(crypto.getRandomValues(new Uint32Array(1))[0] % 900000 + 100000);
    const supabase = createClient(url, key);
    const { data: id, error } = await supabase.rpc("create_booking_with_otp", {
      p_room_id: b.room_id, p_guest_name: b.guest_name.trim(), p_guest_email: email,
      p_guest_phone: b.guest_phone.trim(), p_check_in: b.check_in_date, p_check_out: b.check_out_date,
      p_guests: b.number_of_guests, p_special_requests: typeof b.special_requests === "string" ? b.special_requests : null,
      p_otp_hash: await otpDigest(otp, secret), p_otp_expires_at: new Date(Date.now() + 10 * 60_000).toISOString()
    });
    if (error || !id) {
      console.error("Booking rejected:", error?.message);
      return reply({ error: error?.message?.includes("Too many") ? "Too many attempts. Try again later." : "Room unavailable or booking details invalid." }, 400);
    }

    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST", headers: { Authorization: `Bearer ${mailKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("BOOKING_FROM_EMAIL") ?? "Thamel Heritage Hotel <onboarding@resend.dev>",
        to: [email], subject: "Your Thamel Heritage Hotel verification code",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px"><h2>Thamel Heritage Hotel</h2><p>Hello ${escapeHtml(b.guest_name.trim())},</p><p>Your one-time booking code:</p><p style="font-size:32px;font-weight:bold;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. Ignore this email if you did not request it.</p></div>`
      })
    });
    if (!mail.ok) {
      console.error("Email delivery failed:", await mail.text());
      await supabase.from("bookings").delete().eq("id", id);
      return reply({ error: "Verification email could not be sent. Please try again." }, 502);
    }
    return reply({ id, message: "Verification code sent." });
  } catch (e) {
    console.error("create-booking error:", e);
    return reply({ error: "Unable to create this booking right now." }, 500);
  }
});
