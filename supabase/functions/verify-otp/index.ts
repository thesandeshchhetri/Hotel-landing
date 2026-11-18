import { createClient } from "npm:@supabase/supabase-js@2.57.4";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey, X-Client-Info" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
async function otpDigest(otp: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(otp)));
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async req => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), secret = Deno.env.get("OTP_HASH_SECRET");
    if (!url || !key || !secret) return reply({ success: false, error: "Verification service is not configured." }, 503);
    const { bookingId, otp } = await req.json();
    if (typeof bookingId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId) || typeof otp !== "string" || !/^\d{6}$/.test(otp))
      return reply({ success: false, error: "Invalid or expired verification code." }, 400);
    const db = createClient(url, key);
    const { data: ok, error } = await db.rpc("verify_booking_otp", { p_booking_id: bookingId, p_otp_hash: await otpDigest(otp, secret) });
    if (error) { console.error("OTP verification failed:", error.message); return reply({ success: false, error: "Unable to verify this code." }, 500); }
    if (!ok) return reply({ success: false, error: "Invalid or expired verification code." }, 400);
    const { data: booking, error: readError } = await db.from("bookings")
      .select("id,room_id,guest_name,guest_email,guest_phone,check_in_date,check_out_date,number_of_guests,special_requests,total_amount,status,created_at,room:rooms(id,name,room_type,size_sqft,images)")
      .eq("id", bookingId).single();
    if (readError || !booking) { console.error("Confirmation fetch failed:", readError?.message); return reply({ success: false, error: "Booking verified, but confirmation could not be loaded." }, 500); }
    return reply({ success: true, booking });
  } catch (e) {
    console.error("verify-otp error:", e);
    return reply({ success: false, error: "Unable to verify this code." }, 500);
  }
});
