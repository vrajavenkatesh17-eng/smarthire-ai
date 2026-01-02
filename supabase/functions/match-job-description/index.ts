import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Authenticated user:", user.id);

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

    console.log(`Matching ${resumes.length} resumes against job description for user:`, user.id);

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
