import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ResumeInputSchema = z.object({
  id: z.string().uuid("Invalid resume ID format"),
  candidateName: z.string().min(1, "Candidate name required").max(200, "Candidate name too long"),
  analysisResult: z.any(),
});

const JobMatchSchema = z.object({
  jobDescription: z.string()
    .min(50, "Job description too short (minimum 50 characters)")
    .max(10000, "Job description too long (maximum 10KB)"),
  resumes: z.array(ResumeInputSchema)
    .min(1, "At least one resume is required")
    .max(50, "Too many resumes (maximum 50)"),
});

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
  isSuitable: boolean;
  suitabilityReason: string;
  recommendedRole: string;
  roleDescription: string;
  limitations: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT internally using Supabase auth service
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ code: 401, message: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Backend configuration error");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid JWT:", userError?.message ?? "no user");
      return new Response(JSON.stringify({ code: 401, message: "Invalid JWT" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    console.log("Authenticated user:", userId);

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = JobMatchSchema.safeParse(rawBody);
    
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

    const { jobDescription, resumes } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service configuration error");
    }

    console.log(`Matching ${resumes.length} resumes against job description for user:`, userId);

    const results: MatchResult[] = [];

    for (const resume of resumes) {
      const analysisText = typeof resume.analysisResult === "string" 
        ? resume.analysisResult 
        : JSON.stringify(resume.analysisResult);

      const prompt = `You are an expert job-candidate matching AI with deep understanding of career development and organizational growth. Analyze how well this candidate matches the job description.

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
  "gaps": ["<gap 1>", "<gap 2>"],
  "isSuitable": <true if matchScore >= 50, false otherwise>,
  "suitabilityReason": "<A clear, honest sentence explaining why this candidate is or is not suitable. If not suitable, be direct and professional about it>",
  "recommendedRole": "<The specific job title/role this candidate would excel in based on their skills and experience. This should be a role that would help the company progress. Be specific like 'Senior Frontend Developer' or 'Data Analytics Lead'>",
  "roleDescription": "<A deep but simple 2-3 sentence explanation of WHY this role suits them and HOW they would contribute to company growth. Focus on their unique value proposition>",
  "limitations": ["<specific limitation 1>", "<specific limitation 2>", "<specific limitation 3>"]
}

IMPORTANT GUIDELINES:
- If matchScore is below 50, set isSuitable to false and clearly explain why in suitabilityReason
- recommendedRole should be the BEST role for this candidate (may differ from the job description if they're better suited elsewhere)
- roleDescription should explain in simple but insightful words how this person can drive company progress
- limitations should be honest, specific weaknesses or gaps that hiring managers should be aware of
- Be objective, fair, and constructive in your assessment`;

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
        console.error(`AI error for candidate:`, response.status);
        // Return a default result on error
        results.push({
          resumeId: resume.id,
          candidateName: resume.candidateName,
          matchScore: 0,
          breakdown: { skillsMatch: 0, experienceMatch: 0, educationMatch: 0, overallFit: 0 },
          highlights: [],
          gaps: ["Could not analyze - service unavailable"],
          isSuitable: false,
          suitabilityReason: "Analysis could not be completed due to service unavailability",
          recommendedRole: "Unable to determine",
          roleDescription: "Please retry the analysis to get role recommendations",
          limitations: ["Analysis incomplete"],
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
          const matchScore = parsed.matchScore || 0;
          results.push({
            resumeId: resume.id,
            candidateName: resume.candidateName,
            matchScore: matchScore,
            breakdown: parsed.breakdown || { skillsMatch: 0, experienceMatch: 0, educationMatch: 0, overallFit: 0 },
            highlights: parsed.highlights || [],
            gaps: parsed.gaps || [],
            isSuitable: parsed.isSuitable ?? matchScore >= 50,
            suitabilityReason: parsed.suitabilityReason || (matchScore >= 50 ? "Candidate meets basic requirements" : "Candidate does not meet minimum requirements"),
            recommendedRole: parsed.recommendedRole || "General position",
            roleDescription: parsed.roleDescription || "Role analysis not available",
            limitations: parsed.limitations || [],
          });
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("Parse error for candidate:", parseError);
        results.push({
          resumeId: resume.id,
          candidateName: resume.candidateName,
          matchScore: 50,
          breakdown: { skillsMatch: 50, experienceMatch: 50, educationMatch: 50, overallFit: 50 },
          highlights: ["Analysis completed"],
          gaps: ["Detailed breakdown unavailable"],
          isSuitable: true,
          suitabilityReason: "Basic analysis completed, detailed assessment unavailable",
          recommendedRole: "Review manually",
          roleDescription: "Detailed role analysis could not be generated",
          limitations: ["Detailed analysis unavailable"],
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Job matching error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
