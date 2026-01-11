import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewConfirmationRequest {
  candidateName: string;
  candidateEmail: string;
  interviewDate: string;
  interviewTime: string;
  durationMinutes: number;
  interviewType: string;
  location?: string;
  interviewerName?: string;
  notes?: string;
}

const getInterviewTypeLabel = (type: string) => {
  switch (type) {
    case "video": return "Video Call";
    case "phone": return "Phone";
    case "in-person": return "In-Person";
    case "technical": return "Technical Interview";
    case "onsite": return "Onsite Interview";
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

const getInterviewTypeColor = (type: string) => {
  switch (type) {
    case "video": return "#f59e0b";
    case "phone": return "#3b82f6";
    case "in-person": 
    case "onsite": return "#10b981";
    case "technical": return "#8b5cf6";
    default: return "#6366f1";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const data: InterviewConfirmationRequest = await req.json();
    
    const {
      candidateName,
      candidateEmail,
      interviewDate,
      interviewTime,
      durationMinutes,
      interviewType,
      location,
      interviewerName,
      notes,
    } = data;

    if (!candidateEmail || !candidateName || !interviewDate || !interviewTime) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const typeLabel = getInterviewTypeLabel(interviewType);
    const typeColor = getInterviewTypeColor(interviewType);

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="background: linear-gradient(135deg, ${typeColor}, ${typeColor}dd); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">🎉 Interview Confirmed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 10px; font-size: 16px;">We're excited to meet you</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px;">
          <p style="color: #334155; font-size: 16px; margin-bottom: 20px;">
            Hi <strong>${candidateName}</strong>,
          </p>
          
          <p style="color: #334155; font-size: 16px; margin-bottom: 25px;">
            Great news! Your <strong>${typeLabel}</strong> interview has been scheduled. Here are the details:
          </p>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-left: 4px solid ${typeColor}; padding: 25px; margin: 20px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 130px;">📅 Date</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${interviewDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">⏰ Time</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${interviewTime}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">⏱️ Duration</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${durationMinutes} minutes</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">💼 Type</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${typeLabel}</td>
              </tr>
              ${interviewerName ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">👤 Interviewer</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${interviewerName}</td>
              </tr>
              ` : ""}
              ${location ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">📍 Location</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 500;">
                  ${location.startsWith("http") ? `<a href="${location}" style="color: ${typeColor};">${location}</a>` : location}
                </td>
              </tr>
              ` : ""}
            </table>
          </div>
          
          ${notes ? `
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #fef3c7;">
            <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>📝 Additional Notes:</strong></p>
            <p style="color: #78350f; margin: 8px 0 0 0; font-size: 14px;">${notes}</p>
          </div>
          ` : ""}
          
          <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin-top: 25px;">
            <p style="color: #1e40af; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">💡 Quick Tips to Prepare:</p>
            <ul style="color: #334155; font-size: 14px; margin: 0; padding-left: 20px;">
              ${interviewType === "video" ? `
              <li style="margin-bottom: 6px;">Test your camera and microphone beforehand</li>
              <li style="margin-bottom: 6px;">Choose a quiet, well-lit location</li>
              <li style="margin-bottom: 6px;">Join 5 minutes early to troubleshoot any issues</li>
              ` : interviewType === "phone" ? `
              <li style="margin-bottom: 6px;">Find a quiet location with good reception</li>
              <li style="margin-bottom: 6px;">Have your resume nearby for reference</li>
              <li style="margin-bottom: 6px;">Prepare a few questions about the role</li>
              ` : `
              <li style="margin-bottom: 6px;">Arrive 10-15 minutes early</li>
              <li style="margin-bottom: 6px;">Bring a valid photo ID</li>
              <li style="margin-bottom: 6px;">Dress professionally</li>
              `}
              <li style="margin-bottom: 0;">Research the company and role beforehand</li>
            </ul>
          </div>
          
          <p style="color: #334155; font-size: 16px; margin-top: 25px;">
            We're looking forward to speaking with you! If you have any questions or need to reschedule, please don't hesitate to reach out.
          </p>
          
          <p style="color: #334155; font-size: 16px; margin-top: 20px;">
            Best regards,<br>
            <strong>The Hiring Team</strong>
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Interview Confirmation <onboarding@resend.dev>",
      to: [candidateEmail],
      subject: `✅ Interview Confirmed - ${interviewDate} at ${interviewTime}`,
      html: emailHtml,
    });

    console.log("Interview confirmation email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending interview confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
