import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS in email templates
const escapeHtml = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// In-memory rate limiting store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const checkRateLimit = (clientIp: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIp);

  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  rateLimitStore.set(clientIp, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetIn: entry.resetTime - now };
};

const getClientIp = (req: Request): string => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  website?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = getClientIp(req);
    
    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil(rateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
            ...corsHeaders 
          } 
        }
      );
    }

    console.log("Processing contact form submission...");
    
    const { name, email, subject, message, website }: ContactEmailRequest = await req.json();

    // Honeypot check
    if (website && website.trim() !== "") {
      console.warn(`Honeypot triggered by IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ success: true, message: "Message received" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate required fields
    if (!name || !email || !message) {
      console.error("Missing required fields:", { name: !!name, email: !!email, message: !!message });
      return new Response(
        JSON.stringify({ error: "Name, email, and message are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input lengths
    if (name.length > 100 || email.length > 255 || (subject && subject.length > 200) || message.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum allowed length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Save to admin_notifications table for all company admins
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all company admins to notify them
    const { data: admins, error: adminsError } = await supabase
      .from("company_admins")
      .select("id");

    if (!adminsError && admins && admins.length > 0) {
      // Create notification for each admin
      const notifications = admins.map(admin => ({
        admin_id: admin.id,
        sender_name: name,
        sender_email: email,
        subject: subject || "General Inquiry",
        message: message,
        status: "unread",
      }));

      const { error: insertError } = await supabase
        .from("admin_notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error saving notification:", insertError);
      } else {
        console.log(`Created ${notifications.length} admin notifications`);
      }
    }

    console.log(`Sending contact notification email (IP: ${clientIp}, remaining: ${rateLimit.remaining})...`);

    // Send notification email to the team
    const notificationResponse = await resend.emails.send({
      from: "ResumeAI Contact <onboarding@resend.dev>",
      to: ["hello@resumeai.com"],
      subject: `New Contact Form: ${escapeHtml(subject || "General Inquiry")}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .value { font-size: 16px; color: #111; }
            .message-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">📬 New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">From</div>
                <div class="value">${escapeHtml(name)} (${escapeHtml(email)})</div>
              </div>
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${escapeHtml(subject || "General Inquiry")}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-box">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Notification email sent:", notificationResponse);

    // Send confirmation email to the user
    const confirmationResponse = await resend.emails.send({
      from: "ResumeAI Team <onboarding@resend.dev>",
      to: [email],
      subject: "We received your message! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Thank You, ${escapeHtml(name)}! 🙏</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">We've received your message</p>
            </div>
            <div class="content">
              <p>Hi ${escapeHtml(name)},</p>
              <p>Thank you for reaching out to the ResumeAI team! We've received your message and will get back to you as soon as possible, typically within 24 hours.</p>
              <p>In the meantime, feel free to explore our platform and discover how AI can transform your hiring process.</p>
              <p>Best regards,<br><strong>The ResumeAI Team</strong></p>
            </div>
            <div class="footer">
              <p>This is an automated message from ResumeAI</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Confirmation email sent:", confirmationResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails sent successfully",
        notificationId: notificationResponse.data?.id,
        confirmationId: confirmationResponse.data?.id
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
