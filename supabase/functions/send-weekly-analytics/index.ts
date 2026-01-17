import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log("Generating weekly analytics report...");

    // Get date range for last week
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    // Fetch analytics data
    const { data: companyAdmins, error: adminsError } = await supabase
      .from("company_admins")
      .select("id, user_id");

    if (adminsError) throw adminsError;

    // Fetch company users
    const { data: companyUsers, error: usersError } = await supabase
      .from("company_users")
      .select("id, email, upgraded_at");

    if (usersError) throw usersError;

    // Fetch resumes
    const { data: resumes, error: resumesError } = await supabase
      .from("analyzed_resumes")
      .select("id, created_at, role_category, ai_score");

    if (resumesError) throw resumesError;

    // Calculate weekly stats
    const weeklyResumes = resumes?.filter(r => 
      new Date(r.created_at) >= lastWeekStart
    ).length || 0;

    const weeklyNewUsers = companyUsers?.filter(u => 
      new Date(u.upgraded_at) >= lastWeekStart
    ).length || 0;

    const totalResumes = resumes?.length || 0;
    const totalUsers = companyUsers?.length || 0;

    // Calculate average score
    const avgScore = resumes?.length > 0
      ? Math.round(resumes.reduce((sum, r) => sum + (r.ai_score || 0), 0) / resumes.length)
      : 0;

    // Get role distribution
    const roleDistribution = resumes?.reduce((acc, r) => {
      const role = r.role_category || 'Other';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const topRoles = Object.entries(roleDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Get admin emails
    const adminEmails: string[] = [];
    for (const admin of companyAdmins || []) {
      const user = companyUsers?.find(u => u.email);
      if (user?.email) {
        adminEmails.push(user.email);
      }
    }

    // If no admin emails found, get from profiles
    if (adminEmails.length === 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("email")
        .in("user_id", companyAdmins?.map(a => a.user_id) || []);
      
      profiles?.forEach(p => {
        if (p.email) adminEmails.push(p.email);
      });
    }

    console.log(`Sending weekly report to ${adminEmails.length} admins`);

    // Send email to each admin
    for (const email of adminEmails) {
      await resend.emails.send({
        from: "ResumeAI Analytics <onboarding@resend.dev>",
        to: [email],
        subject: `📊 Your Weekly ResumeAI Analytics Report`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                line-height: 1.6; 
                color: #1a1a2e;
                background-color: #0f0f23;
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 40px 20px;
              }
              .email-wrapper {
                background: linear-gradient(145deg, #1a1a2e, #16162a);
                border-radius: 20px;
                overflow: hidden;
                border: 1px solid rgba(139, 92, 246, 0.2);
              }
              .header { 
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #d946ef 100%);
                padding: 40px 32px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: 800;
                color: white;
                text-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .header p {
                margin: 12px 0 0;
                color: rgba(255,255,255,0.9);
                font-size: 14px;
              }
              .content { 
                padding: 40px 32px;
              }
              .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
                margin-bottom: 32px;
              }
              .stat-card {
                background: linear-gradient(145deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05));
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
              }
              .stat-value {
                font-size: 32px;
                font-weight: 800;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 4px;
              }
              .stat-label {
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                color: #94a3b8;
              }
              .section-title {
                font-size: 16px;
                font-weight: 700;
                color: #f1f5f9;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .role-list {
                background: rgba(30, 30, 50, 0.5);
                border-radius: 12px;
                padding: 16px;
              }
              .role-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                color: #e2e8f0;
              }
              .role-item:last-child {
                border-bottom: none;
              }
              .role-count {
                color: #8b5cf6;
                font-weight: 600;
              }
              .footer { 
                padding: 24px 32px;
                background: rgba(15, 15, 35, 0.5);
                text-align: center;
                border-top: 1px solid rgba(139, 92, 246, 0.1);
              }
              .footer p {
                margin: 0;
                color: #64748b;
                font-size: 13px;
              }
              .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                color: white;
                padding: 14px 32px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                margin-top: 24px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="email-wrapper">
                <div class="header">
                  <h1>📊 Weekly Analytics Report</h1>
                  <p>${lastWeekStart.toLocaleDateString()} - ${now.toLocaleDateString()}</p>
                </div>
                <div class="content">
                  <div class="stats-grid">
                    <div class="stat-card">
                      <div class="stat-value">${weeklyResumes}</div>
                      <div class="stat-label">Resumes This Week</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">${weeklyNewUsers}</div>
                      <div class="stat-label">New Users</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">${totalResumes}</div>
                      <div class="stat-label">Total Resumes</div>
                    </div>
                    <div class="stat-card">
                      <div class="stat-value">${avgScore}</div>
                      <div class="stat-label">Avg AI Score</div>
                    </div>
                  </div>
                  
                  <div class="section-title">🎯 Top Role Categories</div>
                  <div class="role-list">
                    ${topRoles.length > 0 ? topRoles.map(([role, count]) => `
                      <div class="role-item">
                        <span>${role}</span>
                        <span class="role-count">${count} resumes</span>
                      </div>
                    `).join('') : '<div class="role-item"><span>No data yet</span></div>'}
                  </div>
                  
                  <div style="text-align: center;">
                    <a href="https://id-preview--b026ca43-9125-495f-9e3d-b6ef02923345.lovable.app/company-admin" class="cta-button">
                      View Full Dashboard
                    </a>
                  </div>
                </div>
                <div class="footer">
                  <p>This is your automated weekly analytics summary from ResumeAI.</p>
                  <p style="margin-top: 8px;">© ${new Date().getFullYear()} ResumeAI. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    console.log("Weekly analytics report sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Weekly report sent to ${adminEmails.length} admins`,
        stats: { weeklyResumes, weeklyNewUsers, totalResumes, avgScore }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending weekly analytics:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

Deno.serve(handler);
