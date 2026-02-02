import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
const escapeHtml = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface PasskeyRequestData {
  companyName: string;
  companyEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing passkey request...");
    
    const { companyName, companyEmail }: PasskeyRequestData = await req.json();

    // Validate required fields
    if (!companyName || !companyEmail) {
      return new Response(
        JSON.stringify({ error: "Company name and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate input lengths
    if (companyName.length > 100 || companyEmail.length > 255) {
      return new Response(
        JSON.stringify({ error: "Input exceeds maximum allowed length" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(companyEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Admin email to receive passkey requests
    const adminEmail = "v.rajavenkatesh17@gmail.com";

    // Save to admin_notifications table for tracking
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all company admins
    const { data: admins } = await supabase
      .from("company_admins")
      .select("id");

    if (admins && admins.length > 0) {
      const notifications = admins.map(admin => ({
        admin_id: admin.id,
        sender_name: companyName,
        sender_email: companyEmail,
        subject: "Passkey Request - Company Access",
        message: `Company "${companyName}" has requested a passkey for company access. Their contact email is: ${companyEmail}. Please review and generate a passkey for them.`,
        status: "unread",
      }));

      await supabase
        .from("admin_notifications")
        .insert(notifications);
    }

    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "ResumeAI Passkey <onboarding@resend.dev>",
      to: [adminEmail],
      subject: `🔑 New Passkey Request: ${escapeHtml(companyName)}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3B82F6; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🔑 New Passkey Request</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">A company wants to access ResumeAI</p>
            </div>
            <div class="content">
              <div class="info-box">
                <p style="margin: 0 0 10px; font-weight: bold; color: #6b7280;">Company Details:</p>
                <p style="margin: 0;"><strong>Company Name:</strong> ${escapeHtml(companyName)}</p>
                <p style="margin: 10px 0 0;"><strong>Contact Email:</strong> ${escapeHtml(companyEmail)}</p>
              </div>
              <p>A new company has requested access to ResumeAI's enterprise features. Please review their request and generate a passkey if approved.</p>
              <p>To generate a passkey:</p>
              <ol>
                <li>Log in to your admin dashboard</li>
                <li>Go to the Passkeys tab</li>
                <li>Create a new passkey for this company</li>
                <li>Send the passkey to: ${escapeHtml(companyEmail)}</li>
              </ol>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation to requester
    const confirmationResponse = await resend.emails.send({
      from: "ResumeAI Team <onboarding@resend.dev>",
      to: [companyEmail],
      subject: "Passkey Request Received! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3B82F6, #8B5CF6); color: white; padding: 40px; border-radius: 12px 12px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; }
            .highlight { background: linear-gradient(135deg, #3B82F6, #8B5CF6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">🔑 Passkey Request Received!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">We're on it!</p>
            </div>
            <div class="content">
              <p>Hello ${escapeHtml(companyName)} team,</p>
              <p>Thank you for your interest in ResumeAI's enterprise features! We've received your passkey request and our team is reviewing it now.</p>
              <p><strong>What happens next?</strong></p>
              <ul>
                <li>Our team will review your request within 24 hours</li>
                <li>Once approved, you'll receive your unique company passkey via email</li>
                <li>Use the passkey to unlock all enterprise features</li>
              </ul>
              <p>If you have any questions, feel free to reach out to us.</p>
              <p>Best regards,<br><strong>The ResumeAI Team</strong></p>
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
        message: "Passkey request sent successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-passkey-request function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send passkey request. Please try again later." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
