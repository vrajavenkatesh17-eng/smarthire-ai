import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

interface EmailRequest {
  candidateName: string;
  candidateEmail: string;
  emailType: "rejection" | "offer" | "interview_confirmation" | "follow_up";
  companyName?: string;
  position?: string;
  salary?: string;
  startDate?: string;
  customMessage?: string;
  interviewDetails?: {
    date: string;
    time: string;
    type: string;
    location?: string;
    interviewerName?: string;
  };
}

const getEmailTemplate = (data: EmailRequest) => {
  const company = escapeHtml(data.companyName || "Our Company");
  const position = escapeHtml(data.position || "the position");
  const candidateName = escapeHtml(data.candidateName);
  const salary = data.salary ? escapeHtml(data.salary) : null;
  const startDate = data.startDate ? escapeHtml(data.startDate) : null;
  const customMessage = data.customMessage ? escapeHtml(data.customMessage) : null;
  
  switch (data.emailType) {
    case "rejection":
      return {
        subject: `Application Update for ${position}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #64748b, #475569); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #334155; font-size: 16px;">Dear ${candidateName},</p>
              
              <p style="color: #334155; font-size: 16px;">
                Thank you for taking the time to apply for ${position} at ${company} and for your interest in joining our team.
              </p>
              
              <p style="color: #334155; font-size: 16px;">
                After careful consideration of all applications, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our current needs.
              </p>
              
              <p style="color: #334155; font-size: 16px;">
                This was not an easy decision as we received many impressive applications. We were genuinely impressed by your background and experience.
              </p>
              
              ${customMessage ? `
                <div style="background: #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #334155; margin: 0; font-style: italic;">"${customMessage}"</p>
                </div>
              ` : ''}
              
              <p style="color: #334155; font-size: 16px;">
                We encourage you to apply for future positions that match your skills and experience. We wish you all the best in your career journey.
              </p>
              
              <p style="color: #334155; font-size: 16px;">
                Best regards,<br>
                The ${company} Hiring Team
              </p>
            </div>
          </div>
        `,
      };

    case "offer":
      return {
        subject: `🎉 Job Offer - ${position} at ${company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Congratulations!</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #334155; font-size: 16px;">Dear ${candidateName},</p>
              
              <p style="color: #334155; font-size: 16px;">
                We are thrilled to extend an offer for the position of <strong>${position}</strong> at ${company}!
              </p>
              
              <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <h3 style="color: #059669; margin-top: 0;">Offer Details</h3>
                <p style="margin: 8px 0;"><strong>Position:</strong> ${position}</p>
                ${salary ? `<p style="margin: 8px 0;"><strong>Compensation:</strong> ${salary}</p>` : ''}
                ${startDate ? `<p style="margin: 8px 0;"><strong>Proposed Start Date:</strong> ${startDate}</p>` : ''}
              </div>
              
              <p style="color: #334155; font-size: 16px;">
                Throughout our interview process, you demonstrated exceptional skills, experience, and cultural fit that made you stand out among all candidates.
              </p>
              
              ${customMessage ? `
                <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #065f46; margin: 0;">${customMessage}</p>
                </div>
              ` : ''}
              
              <p style="color: #334155; font-size: 16px;">
                Please review this offer and feel free to reach out with any questions. We are excited about the possibility of having you join our team!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #64748b; font-size: 14px;">Please respond within 5 business days</p>
              </div>
              
              <p style="color: #334155; font-size: 16px;">
                Warm regards,<br>
                The ${company} Team
              </p>
            </div>
          </div>
        `,
      };

    case "interview_confirmation":
      const interview = data.interviewDetails;
      const interviewDate = interview?.date ? escapeHtml(interview.date) : null;
      const interviewTime = interview?.time ? escapeHtml(interview.time) : null;
      const interviewType = interview?.type ? escapeHtml(interview.type) : null;
      const interviewLocation = interview?.location ? escapeHtml(interview.location) : null;
      const interviewerName = interview?.interviewerName ? escapeHtml(interview.interviewerName) : null;
      return {
        subject: `Interview Confirmation - ${position} at ${company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📅 Interview Confirmed</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #334155; font-size: 16px;">Dear ${candidateName},</p>
              
              <p style="color: #334155; font-size: 16px;">
                We're pleased to confirm your interview for the ${position} position at ${company}.
              </p>
              
              ${interview ? `
                <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3 style="color: #1d4ed8; margin-top: 0;">Interview Details</h3>
                  <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${interviewDate}</p>
                  <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${interviewTime}</p>
                  <p style="margin: 8px 0;"><strong>📋 Type:</strong> ${interviewType}</p>
                  ${interviewLocation ? `<p style="margin: 8px 0;"><strong>📍 Location:</strong> ${interviewLocation}</p>` : ''}
                  ${interviewerName ? `<p style="margin: 8px 0;"><strong>👤 Interviewer:</strong> ${interviewerName}</p>` : ''}
                </div>
              ` : ''}
              
              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>💡 Preparation Tips:</strong></p>
                <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
                  <li>Research our company and the role</li>
                  <li>Prepare questions about the position</li>
                  <li>Have examples of your relevant experience ready</li>
                  <li>Test your technology if it's a video interview</li>
                </ul>
              </div>
              
              ${customMessage ? `
                <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #334155; margin: 0;">${customMessage}</p>
                </div>
              ` : ''}
              
              <p style="color: #334155; font-size: 16px;">
                We look forward to meeting you!<br>
                The ${company} Hiring Team
              </p>
            </div>
          </div>
        `,
      };

    case "follow_up":
      return {
        subject: `Following Up - ${position} at ${company}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
            </div>
            <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="color: #334155; font-size: 16px;">Dear ${candidateName},</p>
              
              <p style="color: #334155; font-size: 16px;">
                Thank you for your continued interest in the ${position} position at ${company}.
              </p>
              
              <p style="color: #334155; font-size: 16px;">
                We wanted to provide you with an update on your application status. Our team is currently reviewing all candidates and we appreciate your patience during this process.
              </p>
              
              ${customMessage ? `
                <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="color: #5b21b6; margin: 0;">${customMessage}</p>
                </div>
              ` : ''}
              
              <p style="color: #334155; font-size: 16px;">
                We will be in touch soon with next steps. If you have any questions in the meantime, please don't hesitate to reach out.
              </p>
              
              <p style="color: #334155; font-size: 16px;">
                Best regards,<br>
                The ${company} Hiring Team
              </p>
            </div>
          </div>
        `,
      };

    default:
      throw new Error("Invalid email type");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailData: EmailRequest = await req.json();

    if (!emailData.candidateEmail || !emailData.candidateName || !emailData.emailType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const template = getEmailTemplate(emailData);

    // Use Resend REST API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "ResumeAI <onboarding@resend.dev>",
        to: [emailData.candidateEmail],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${emailResponse.status}`);
    }

    const responseData = await emailResponse.json();
    console.log("Hiring stage email sent:", responseData);

    return new Response(JSON.stringify({ success: true, id: responseData.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error sending hiring stage email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});