const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userEmail: string;
  completedCount: number;
}

Deno.serve(async (req: Request): Promise<Response> => {
  console.log("send-analysis-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT is verified by Supabase (verify_jwt = true in config.toml)
    // Extract user from the verified JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ code: 401, message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JWT to get user info (already verified by Supabase relay)
    const token = authHeader.replace("Bearer ", "");
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      if (!userId) {
        throw new Error("No user ID in token");
      }
      console.log("Authenticated user:", userId);
    } catch (e) {
      console.error("Failed to parse JWT:", e);
      return new Response(JSON.stringify({ code: 401, message: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userEmail, completedCount }: NotificationRequest = await req.json();

    console.log(`Sending notification to ${userEmail} for ${completedCount} resumes`);

    if (!userEmail) {
      throw new Error("User email is required");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
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
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const responseData = await emailResponse.json();

    console.log("Email sent successfully:", responseData);

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-analysis-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
