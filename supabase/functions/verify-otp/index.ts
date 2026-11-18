import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
const escapeHtml = (value: string) => value.replace(/[&<>\"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;' }[character]!));
async function otpDigest(otp: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(otp)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ success: false, error: "Method not allowed." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), secret = Deno.env.get("OTP_HASH_SECRET");
    if (!url || !key || !secret) return reply({ success: false, error: "Verification service is not configured." }, 503);
    const { bookingId, otp } = await req.json();
    if (typeof bookingId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId) || typeof otp !== "string" || !/^\d{6}$/.test(otp))
      return reply({ success: false, error: "Invalid or expired verification code." });
    const db = createClient(url, key);
    const { data: ok, error } = await db.rpc("verify_booking_otp", { p_booking_id: bookingId, p_otp_hash: await otpDigest(otp, secret) });
    if (error) { console.error("OTP verification failed:", error.message); return reply({ success: false, error: "Unable to verify this code." }, 500); }
    if (!ok) return reply({ success: false, error: "That code is invalid or has expired. Request a new code and try again." });
    const { data: booking, error: readError } = await db.from("bookings")
      .select("id,room_id,guest_name,guest_email,guest_phone,check_in_date,check_out_date,number_of_guests,special_requests,total_amount,status,created_at,confirmation_email_sent_at,room:rooms(id,name,room_type,size_sqft,images)")
      .eq("id", bookingId).single();
    if (readError || !booking) { console.error("Confirmation fetch failed:", readError?.message); return reply({ success: false, error: "Booking verified, but confirmation could not be loaded." }, 500); }

    let emailSent = Boolean(booking.confirmation_email_sent_at);
    if (!emailSent) {
      const mailKey = Deno.env.get("RESEND_API_KEY");
      if (mailKey) {
        const { data: hotel } = await db.from("hotel_info").select("name,address,phone,email").maybeSingle();
        const hotelName = hotel?.name || "Hotel";
        const room = Array.isArray(booking.room) ? booking.room[0] : booking.room;
        const nights = Math.max(1, Math.round((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / 86400000));
        const date = (value: string) => new Date(value + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
        const details = [
          ["Confirmation number", booking.id.slice(0, 8).toUpperCase()],
          ["Booking created", new Date(booking.created_at).toLocaleString("en-US")],
          ["Email verified", "Yes"],
          ["Guest name", booking.guest_name],
          ["Email", booking.guest_email],
          ["Phone", booking.guest_phone],
          ["Room", room?.name || "Reserved room"],
          ["Room type", room?.room_type || "—"],
          ["Room size", room?.size_sqft ? String(room.size_sqft) + " sq ft" : "—"],
          ["Check-in", date(booking.check_in_date)],
          ["Check-out", date(booking.check_out_date)],
          ["Nights", String(nights)],
          ["Guests", String(booking.number_of_guests)],
          ["Special requests", booking.special_requests || "None"],
          ["Total amount", "NPR " + Number(booking.total_amount).toLocaleString()],
          ["Status", "Confirmed"],
        ];
        const rows = details.map(([label, value]) => "<tr><td style='padding:9px 12px;color:#667085;border-bottom:1px solid #eee'>" + escapeHtml(label) + "</td><td style='padding:9px 12px;color:#101828;border-bottom:1px solid #eee;font-weight:600'>" + escapeHtml(value) + "</td></tr>").join("");
        let mailResponse: Response | null = null;
        try {
          mailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + mailKey, "Content-Type": "application/json", "Idempotency-Key": "booking-confirmation-" + bookingId },
            body: JSON.stringify({
              from: Deno.env.get("BOOKING_FROM_EMAIL") ?? hotelName + " <onboarding@resend.dev>",
              to: [booking.guest_email],
              subject: "Booking confirmed - " + hotelName + " (" + booking.id.slice(0, 8).toUpperCase() + ")",
              html: "<div style='font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#101828'><h1 style='color:#b45309'>" + escapeHtml(hotelName) + "</h1><h2>Your booking is confirmed</h2><p>Hello " + escapeHtml(booking.guest_name) + ",</p><p>Your email has been verified and your reservation is confirmed. Keep this email for your records.</p><table style='width:100%;border-collapse:collapse'>" + rows + "</table><p style='margin-top:24px;color:#667085'>Contact: " + escapeHtml(hotel?.phone || "") + " · " + escapeHtml(hotel?.email || "") + "<br>" + escapeHtml(hotel?.address || "") + "</p></div>"
            })
          });
        } catch (mailError) {
          console.error("Confirmation email request failed:", mailError);
        }
        if (mailResponse?.ok) {
          const { error: emailUpdateError } = await db.from("bookings").update({ confirmation_email_sent_at: new Date().toISOString() }).eq("id", bookingId).is("confirmation_email_sent_at", null);
          if (emailUpdateError) console.error("Confirmation email sent but tracking update failed:", emailUpdateError.message);
          emailSent = true;
        } else if (mailResponse) {
          console.error("Confirmation email delivery failed:", await mailResponse.text());
        }
        } else {
          console.error("Confirmation email not sent: RESEND_API_KEY is missing.");
        }
      }
    return reply({ success: true, booking, emailSent });
  } catch (e) {
    console.error("verify-otp error:", e);
    return reply({ success: false, error: "Unable to verify this code." }, 500);
  }
});
