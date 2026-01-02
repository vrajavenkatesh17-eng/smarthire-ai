import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResumeInput {
  id: string;
  candidateName: string;
  analysisResult: any;
}

interface MatchResult {
  resumeId: string;
  candidateName: string;
  matchScore: number;
  breakdown: {
    skillsMatch: number;
    experienceMatch: number;
    educationMatch: number;
    overallFit: number;
  };
  highlights: string[];
  gaps: string[];
}

serve(async (req) => {
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
      // Handle base64url encoding (JWT uses - and _ instead of + and /)
      const base64Payload = token.split('.')[1];
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
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

    const { jobDescription, resumes } = await req.json() as { 
      jobDescription: string; 
      resumes: ResumeInput[];
    };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!jobDescription || !resumes?.length) {
      return new Response(JSON.stringify({ error: "Job description and resumes are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Matching ${resumes.length} resumes against job description for user:`, userId);

    const results: MatchResult[] = [];

    for (const resume of resumes) {
      const analysisText = typeof resume.analysisResult === "string" 
        ? resume.analysisResult 
        : JSON.stringify(resume.analysisResult);

      const prompt = `You are an expert job-candidate matching AI. Analyze how well this candidate matches the job description.

Job Description:
${jobDescription}

Candidate Resume Analysis:
${analysisText}

Provide a JSON response with EXACTLY this structure (no markdown, just JSON):
{
  "matchScore": <number 0-100>,
  "breakdown": {
    "skillsMatch": <number 0-100>,
    "experienceMatch": <number 0-100>,
    "educationMatch": <number 0-100>,
    "overallFit": <number 0-100>
  },
  "highlights": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "gaps": ["<gap 1>", "<gap 2>"]
}

Be objective and fair. Score based on actual qualifications vs requirements.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "user", content: prompt },
          ],
        }),
      });

      if (!response.ok) {
        console.error(`AI error for ${resume.candidateName}:`, await response.text());
        // Return a default result on error
        results.push({
          resumeId: resume.id,
          candidateName: resume.candidateName,
          matchScore: 0,
          breakdown: { skillsMatch: 0, experienceMatch: 0, educationMatch: 0, overallFit: 0 },
          highlights: [],
          gaps: ["Could not analyze - AI error"],
        });
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      try {
        // Extract JSON from response (handle potential markdown wrapping)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          results.push({
            resumeId: resume.id,
            candidateName: resume.candidateName,
            matchScore: parsed.matchScore || 0,
            breakdown: parsed.breakdown || { skillsMatch: 0, experienceMatch: 0, educationMatch: 0, overallFit: 0 },
            highlights: parsed.highlights || [],
            gaps: parsed.gaps || [],
          });
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error(`Parse error for ${resume.candidateName}:`, parseError);
        results.push({
          resumeId: resume.id,
          candidateName: resume.candidateName,
          matchScore: 50,
          breakdown: { skillsMatch: 50, experienceMatch: 50, educationMatch: 50, overallFit: 50 },
          highlights: ["Analysis completed"],
          gaps: ["Detailed breakdown unavailable"],
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Job matching error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
