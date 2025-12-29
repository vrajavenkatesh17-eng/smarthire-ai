import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InterviewEmailTemplate {
  subject: string;
  recruiterHtml: (data: TemplateData) => string;
  candidateHtml: (data: TemplateData) => string;
}

interface TemplateData {
  candidateName: string;
  recruiterName: string;
  formattedDate: string;
  formattedTime: string;
  durationMinutes: number;
  location: string | null;
  interviewerName: string | null;
  notes: string | null;
}

const emailTemplates: Record<string, InterviewEmailTemplate> = {
  phone: {
    subject: "Phone Screen Reminder",
    recruiterHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📞 Phone Screen Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.recruiterName},</p>
          <p style="color: #334155; font-size: 16px;">You have an upcoming <strong>phone screen</strong> scheduled:</p>
          <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>👤 Candidate:</strong> ${data.candidateName}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Phone/Link:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>💡 Phone Screen Tips:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Have the candidate's resume ready</li>
              <li>Prepare your screening questions</li>
              <li>Note cultural fit indicators</li>
            </ul>
          </div>
          ${data.notes ? `<p style="color: #64748b; font-size: 14px; margin-top: 20px;"><strong>Notes:</strong> ${data.notes}</p>` : ""}
        </div>
      </div>
    `,
    candidateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📞 Phone Screen Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.candidateName},</p>
          <p style="color: #334155; font-size: 16px;">This is a friendly reminder about your upcoming <strong>phone screen</strong>:</p>
          <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Phone/Link:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>💡 Preparation Tips:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Find a quiet location with good reception</li>
              <li>Have your resume nearby for reference</li>
              <li>Prepare questions about the role</li>
            </ul>
          </div>
          <p style="color: #334155; font-size: 16px; margin-top: 20px;">We look forward to speaking with you!</p>
        </div>
      </div>
    `,
  },
  technical: {
    subject: "Technical Interview Reminder",
    recruiterHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💻 Technical Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.recruiterName},</p>
          <p style="color: #334155; font-size: 16px;">You have an upcoming <strong>technical interview</strong> scheduled:</p>
          <div style="background: white; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>👤 Candidate:</strong> ${data.candidateName}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Interviewer:</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Location/Link:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #5b21b6; margin: 0; font-size: 14px;"><strong>🔧 Technical Interview Checklist:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Prepare coding challenges or system design questions</li>
              <li>Have the collaborative coding environment ready</li>
              <li>Review the candidate's technical background</li>
            </ul>
          </div>
          ${data.notes ? `<p style="color: #64748b; font-size: 14px; margin-top: 20px;"><strong>Notes:</strong> ${data.notes}</p>` : ""}
        </div>
      </div>
    `,
    candidateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">💻 Technical Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.candidateName},</p>
          <p style="color: #334155; font-size: 16px;">This is a reminder about your upcoming <strong>technical interview</strong>:</p>
          <div style="background: white; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Interviewer:</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Location/Link:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #f5f3ff; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #5b21b6; margin: 0; font-size: 14px;"><strong>💡 Preparation Tips:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Review data structures and algorithms</li>
              <li>Practice coding on a whiteboard or shared editor</li>
              <li>Think out loud during problem solving</li>
              <li>Prepare questions about the tech stack</li>
            </ul>
          </div>
          <p style="color: #334155; font-size: 16px; margin-top: 20px;">Good luck! We're excited to learn about your technical skills.</p>
        </div>
      </div>
    `,
  },
  onsite: {
    subject: "Onsite Interview Reminder",
    recruiterHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 Onsite Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.recruiterName},</p>
          <p style="color: #334155; font-size: 16px;">You have an <strong>onsite interview</strong> scheduled:</p>
          <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>👤 Candidate:</strong> ${data.candidateName}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Interviewer(s):</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Location:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #047857; margin: 0; font-size: 14px;"><strong>🏢 Onsite Checklist:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Confirm meeting room is booked</li>
              <li>Notify reception of arrival</li>
              <li>Prepare interview panel</li>
              <li>Arrange office tour if applicable</li>
            </ul>
          </div>
          ${data.notes ? `<p style="color: #64748b; font-size: 14px; margin-top: 20px;"><strong>Notes:</strong> ${data.notes}</p>` : ""}
        </div>
      </div>
    `,
    candidateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🏢 Onsite Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.candidateName},</p>
          <p style="color: #334155; font-size: 16px;">We're excited to welcome you for your <strong>onsite interview</strong>!</p>
          <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Meeting with:</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>📍 Address:</strong> ${data.location}</p>` : ""}
          </div>
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #047857; margin: 0; font-size: 14px;"><strong>💡 What to Expect:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Arrive 10-15 minutes early</li>
              <li>Bring a valid photo ID</li>
              <li>Dress code: Business casual</li>
              <li>You may meet multiple team members</li>
            </ul>
          </div>
          <p style="color: #334155; font-size: 16px; margin-top: 20px;">We can't wait to meet you in person!</p>
        </div>
      </div>
    `,
  },
  video: {
    subject: "Video Interview Reminder",
    recruiterHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎥 Video Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.recruiterName},</p>
          <p style="color: #334155; font-size: 16px;">You have an upcoming <strong>video interview</strong>:</p>
          <div style="background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>👤 Candidate:</strong> ${data.candidateName}</p>
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Interviewer:</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>🔗 Meeting Link:</strong> <a href="${data.location}" style="color: #f59e0b;">${data.location}</a></p>` : ""}
          </div>
          ${data.notes ? `<p style="color: #64748b; font-size: 14px; margin-top: 20px;"><strong>Notes:</strong> ${data.notes}</p>` : ""}
        </div>
      </div>
    `,
    candidateHtml: (data) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🎥 Video Interview Reminder</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #334155; font-size: 16px;">Hi ${data.candidateName},</p>
          <p style="color: #334155; font-size: 16px;">Reminder about your upcoming <strong>video interview</strong>:</p>
          <div style="background: white; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${data.formattedDate}</p>
            <p style="margin: 8px 0;"><strong>⏰ Time:</strong> ${data.formattedTime}</p>
            <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${data.durationMinutes} minutes</p>
            ${data.interviewerName ? `<p style="margin: 8px 0;"><strong>👨‍💼 Interviewer:</strong> ${data.interviewerName}</p>` : ""}
            ${data.location ? `<p style="margin: 8px 0;"><strong>🔗 Join here:</strong> <a href="${data.location}" style="color: #f59e0b;">${data.location}</a></p>` : ""}
          </div>
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #b45309; margin: 0; font-size: 14px;"><strong>💡 Video Call Tips:</strong></p>
            <ul style="color: #334155; font-size: 14px; margin: 10px 0;">
              <li>Test your camera and microphone beforehand</li>
              <li>Choose a quiet, well-lit location</li>
              <li>Have a clean, professional background</li>
              <li>Join 5 minutes early to troubleshoot</li>
            </ul>
          </div>
          <p style="color: #334155; font-size: 16px; margin-top: 20px;">Looking forward to our conversation!</p>
        </div>
      </div>
    `,
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`Checking for interviews between ${now.toISOString()} and ${tomorrow.toISOString()}`);

    const { data: interviews, error: fetchError } = await supabase
      .from("interviews")
      .select(`
        *,
        candidate_pipeline (
          candidate_name,
          candidate_email
        )
      `)
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", tomorrow.toISOString());

    if (fetchError) {
      console.error("Error fetching interviews:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${interviews?.length || 0} upcoming interviews`);

    if (!interviews || interviews.length === 0) {
      return new Response(
        JSON.stringify({ message: "No upcoming interviews to remind" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const interview of interviews) {
      const candidateName = interview.candidate_pipeline?.candidate_name || "Candidate";
      const candidateEmail = interview.candidate_pipeline?.candidate_email;
      const scheduledAt = new Date(interview.scheduled_at);
      const formattedDate = scheduledAt.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = scheduledAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", interview.user_id)
        .single();

      const recruiterEmail = profile?.email;
      const recruiterName = profile?.full_name || "Recruiter";

      // Get the appropriate template based on interview type
      const interviewType = interview.interview_type?.toLowerCase() || "video";
      const template = emailTemplates[interviewType] || emailTemplates.video;

      const templateData: TemplateData = {
        candidateName,
        recruiterName,
        formattedDate,
        formattedTime,
        durationMinutes: interview.duration_minutes,
        location: interview.location,
        interviewerName: interview.interviewer_name,
        notes: interview.notes,
      };

      // Send reminder to recruiter
      if (recruiterEmail) {
        try {
          const recruiterResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Interview Reminders <onboarding@resend.dev>",
              to: [recruiterEmail],
              subject: `${template.subject}: ${candidateName} - ${formattedDate}`,
              html: template.recruiterHtml(templateData),
            }),
          });

          if (recruiterResponse.ok) {
            emailsSent.push(`Recruiter: ${recruiterEmail}`);
            console.log(`Sent ${interviewType} reminder to recruiter: ${recruiterEmail}`);
          } else {
            const errorData = await recruiterResponse.json();
            errors.push(`Failed to send to ${recruiterEmail}: ${JSON.stringify(errorData)}`);
            console.error(`Failed to send to recruiter:`, errorData);
          }
        } catch (emailError) {
          errors.push(`Error sending to ${recruiterEmail}: ${emailError}`);
          console.error(`Error sending to recruiter:`, emailError);
        }
      }

      // Send reminder to candidate
      if (candidateEmail) {
        try {
          const candidateResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "Interview Reminders <onboarding@resend.dev>",
              to: [candidateEmail],
              subject: `${template.subject} - ${formattedDate}`,
              html: template.candidateHtml(templateData),
            }),
          });

          if (candidateResponse.ok) {
            emailsSent.push(`Candidate: ${candidateEmail}`);
            console.log(`Sent ${interviewType} reminder to candidate: ${candidateEmail}`);
          } else {
            const errorData = await candidateResponse.json();
            errors.push(`Failed to send to ${candidateEmail}: ${JSON.stringify(errorData)}`);
            console.error(`Failed to send to candidate:`, errorData);
          }
        } catch (emailError) {
          errors.push(`Error sending to ${candidateEmail}: ${emailError}`);
          console.error(`Error sending to candidate:`, emailError);
        }
      }
    }

    console.log(`Sent ${emailsSent.length} reminder emails`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
        interviewsProcessed: interviews.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-interview-reminders:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
