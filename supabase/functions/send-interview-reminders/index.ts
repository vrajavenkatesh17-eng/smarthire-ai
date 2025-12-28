import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Get interviews scheduled in the next 24 hours that haven't been reminded
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

      // Get recruiter email from profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", interview.user_id)
        .single();

      const recruiterEmail = profile?.email;
      const recruiterName = profile?.full_name || "Recruiter";

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
              subject: `Interview Reminder: ${candidateName} - ${formattedDate}`,
              html: `
                <h2>Interview Reminder</h2>
                <p>Hi ${recruiterName},</p>
                <p>This is a reminder that you have an upcoming interview:</p>
                <ul>
                  <li><strong>Candidate:</strong> ${candidateName}</li>
                  <li><strong>Date:</strong> ${formattedDate}</li>
                  <li><strong>Time:</strong> ${formattedTime}</li>
                  <li><strong>Duration:</strong> ${interview.duration_minutes} minutes</li>
                  <li><strong>Type:</strong> ${interview.interview_type}</li>
                  ${interview.location ? `<li><strong>Location:</strong> ${interview.location}</li>` : ""}
                  ${interview.interviewer_name ? `<li><strong>Interviewer:</strong> ${interview.interviewer_name}</li>` : ""}
                </ul>
                ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ""}
                <p>Good luck with the interview!</p>
              `,
            }),
          });

          if (recruiterResponse.ok) {
            emailsSent.push(`Recruiter: ${recruiterEmail}`);
            console.log(`Sent reminder to recruiter: ${recruiterEmail}`);
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

      // Send reminder to candidate if they have an email
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
              subject: `Interview Reminder - ${formattedDate}`,
              html: `
                <h2>Interview Reminder</h2>
                <p>Hi ${candidateName},</p>
                <p>This is a friendly reminder about your upcoming interview:</p>
                <ul>
                  <li><strong>Date:</strong> ${formattedDate}</li>
                  <li><strong>Time:</strong> ${formattedTime}</li>
                  <li><strong>Duration:</strong> ${interview.duration_minutes} minutes</li>
                  <li><strong>Type:</strong> ${interview.interview_type}</li>
                  ${interview.location ? `<li><strong>Location:</strong> ${interview.location}</li>` : ""}
                </ul>
                <p>We look forward to speaking with you!</p>
                <p>Best regards,<br>The Hiring Team</p>
              `,
            }),
          });

          if (candidateResponse.ok) {
            emailsSent.push(`Candidate: ${candidateEmail}`);
            console.log(`Sent reminder to candidate: ${candidateEmail}`);
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
