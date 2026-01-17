import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AdminReplyRequest {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  originalMessage: string;
  replyMessage: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      subject, 
      originalMessage, 
      replyMessage 
    }: AdminReplyRequest = await req.json();

    if (!recipientEmail || !replyMessage) {
      return new Response(
        JSON.stringify({ error: "Recipient email and reply message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending admin reply to:", recipientEmail);

    const emailResponse = await resend.emails.send({
      from: "ResumeAI Support <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Re: ${subject || "Your Inquiry"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #1a1a2e;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 40px 20px;
            }
            .email-wrapper {
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              color: white; 
              padding: 32px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .content { 
              padding: 32px;
            }
            .greeting {
              font-size: 18px;
              color: #1a1a2e;
              margin-bottom: 24px;
            }
            .reply-box {
              background: linear-gradient(145deg, #f0f9ff, #e0f2fe);
              padding: 24px;
              border-radius: 12px;
              border-left: 4px solid #3b82f6;
              margin: 24px 0;
            }
            .reply-box p {
              margin: 0;
              color: #1e3a5f;
              font-size: 15px;
              line-height: 1.7;
            }
            .original-section {
              margin-top: 32px;
              padding-top: 24px;
              border-top: 1px solid #e2e8f0;
            }
            .original-label {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .original-message {
              background: #f8fafc;
              padding: 16px;
              border-radius: 8px;
              color: #64748b;
              font-size: 14px;
            }
            .footer { 
              padding: 24px 32px;
              background: #f8fafc;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 0;
              color: #64748b;
              font-size: 13px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-wrapper">
              <div class="header">
                <h1>📧 Response from ResumeAI</h1>
              </div>
              <div class="content">
                <p class="greeting">Hi ${recipientName || "there"},</p>
                <p>Thank you for reaching out to us. Here's our response to your inquiry:</p>
                
                <div class="reply-box">
                  <p>${replyMessage.replace(/\n/g, '<br>')}</p>
                </div>
                
                <div class="original-section">
                  <p class="original-label">Your original message:</p>
                  <div class="original-message">
                    ${originalMessage.replace(/\n/g, '<br>')}
                  </div>
                </div>
              </div>
              <div class="footer">
                <p>If you have any more questions, feel free to reply to this email.</p>
                <p style="margin-top: 16px;">Best regards,<br>The ResumeAI Team</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Reply email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending admin reply:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
