import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpgradeNotificationRequest {
  userEmail: string;
  userName?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userEmail, userName }: UpgradeNotificationRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "HireSmart <onboarding@resend.dev>",
      to: [userEmail],
      subject: "🎉 Welcome to HireSmart Company Access!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a2e; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 40px; }
            .logo { font-size: 28px; font-weight: bold; color: #3b82f6; }
            .content { background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 24px; }
            .feature-list { list-style: none; padding: 0; }
            .feature-list li { padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; }
            .feature-list li:last-child { border-bottom: none; }
            .check-icon { color: #22c55e; margin-right: 12px; font-size: 18px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 24px; }
            .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">HireSmart</div>
            </div>
            <h1 style="text-align: center; margin-bottom: 24px;">Welcome to Company Access! 🚀</h1>
            <p>Hi ${userName || 'there'},</p>
            <p>Congratulations! Your account has been upgraded to <strong>Company Access</strong>. You now have full access to all HireSmart features:</p>
            
            <div class="content">
              <ul class="feature-list">
                <li><span class="check-icon">✓</span> Advanced Resume Analysis with AI</li>
                <li><span class="check-icon">✓</span> Job Description Matching</li>
                <li><span class="check-icon">✓</span> Talent Pipeline Management</li>
                <li><span class="check-icon">✓</span> Interview Scheduling & Feedback</li>
                <li><span class="check-icon">✓</span> Team Collaboration Tools</li>
                <li><span class="check-icon">✓</span> Candidate Comparison</li>
                <li><span class="check-icon">✓</span> Analytics Dashboard</li>
              </ul>
            </div>

            <p style="text-align: center;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovable.app')}/dashboard" class="cta-button">
                Explore Your Dashboard
              </a>
            </p>

            <div class="footer">
              <p>Thank you for choosing HireSmart!</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Upgrade notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending upgrade notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
