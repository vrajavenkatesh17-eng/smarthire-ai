import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const NotificationSchema = z.object({
  userEmail: z.string()
    .email("Invalid email format")
    .max(255, "Email too long (max 255 characters)"),
  completedCount: z.number()
    .int("Count must be an integer")
    .min(1, "Count must be at least 1")
    .max(10000, "Count exceeds maximum (10000)"),
});

Deno.serve(async (req: Request): Promise<Response> => {
  console.log("send-analysis-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT in code (verify_jwt = false in config.toml)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ code: 401, message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error("JWT validation failed:", error);
      return new Response(JSON.stringify({ code: 401, message: "Invalid JWT" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = NotificationSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error.errors);
      return new Response(JSON.stringify({ 
        error: "Invalid input", 
        details: validationResult.error.errors.map(e => e.message).join(", ")
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userEmail, completedCount } = validationResult.data;

    console.log(`Sending notification for ${completedCount} resumes`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("Email service configuration error");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HireAI <onboarding@resend.dev>",
        to: [userEmail],
        subject: `Resume Analysis Complete - ${completedCount} Resume${completedCount > 1 ? "s" : ""} Analyzed`,
        html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✨</span>
                </div>
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Analysis Complete!</h1>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Great news! Your bulk resume analysis has been completed successfully.
              </p>
              
              <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #71717a; font-size: 14px; margin: 0 0 8px;">Resumes Analyzed</p>
                <p style="color: #18181b; font-size: 48px; font-weight: bold; margin: 0;">${completedCount}</p>
              </div>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 32px;">
                View your analyzed resumes and candidate insights in your dashboard. Each resume has been scored and analyzed for key qualifications.
              </p>
              
              <div style="text-align: center;">
                <a href="https://lovable.dev/resume-history" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                  View Results
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;">
              
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                This email was sent by HireAI Resume Analyzer.<br>
                You received this because you analyzed resumes on our platform.
              </p>
            </div>
          </body>
        </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      console.error("Email service error:", emailResponse.status);
      throw new Error("Failed to send email notification");
    }

    const responseData = await emailResponse.json();

    console.log("Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-analysis-notification function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
