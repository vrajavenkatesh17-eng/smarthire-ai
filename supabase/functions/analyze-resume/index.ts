import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const AnalyzeResumeSchema = z.object({
  resumeText: z.string()
    .min(50, "Resume text too short (minimum 50 characters)")
    .max(50000, "Resume text too long (maximum 50KB)"),
  jobDescription: z.string()
    .max(10000, "Job description too long (maximum 10KB)")
    .optional()
    .nullable(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // With ES256 signing keys, platform-level JWT verification may fail in some environments.
    // We therefore verify the access token ourselves against the auth service.
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
    const validationResult = AnalyzeResumeSchema.safeParse(rawBody);
    
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

    const { resumeText, jobDescription } = validationResult.data;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("AI service configuration error");
    }

    console.log("Analyzing resume for user:", userId, "length:", resumeText.length);

    const systemPrompt = `You are an expert AI resume analyzer for HR teams. Analyze the provided resume and return a detailed evaluation.

Your analysis should include:
1. **Candidate Overview**: Name, current role, years of experience
2. **Skills Assessment**: List technical and soft skills found
3. **Experience Analysis**: Key roles and achievements
4. **Education**: Degrees, certifications, relevant courses
5. **Scoring**: Rate the following on a scale of 1-100:
   - Technical Skills Match
   - Experience Relevance  
   - Education & Certifications
   - Communication (based on resume quality)
6. **Strengths**: Top 3-5 candidate strengths
7. **Potential Concerns**: Any gaps or areas for interview focus
8. **Interview Recommendations**: 3 specific questions to ask this candidate

## 🎯 HIRING POSSIBILITY SCORE (CRITICAL - ALWAYS INCLUDE)
At the end of your analysis, you MUST provide a clear hiring score:

**📊 HIRING SCORE: [X]/100**

This score represents the candidate's overall hiring possibility based on:
- Skills match (25%)
- Experience relevance (30%)
- Education & certifications (15%)
- Communication quality (10%)
- Cultural fit indicators (10%)
- Growth potential (10%)

Provide a brief explanation of the score and a final recommendation: Strong Hire / Hire / Consider / Pass

${jobDescription ? `\nJob Description for context:\n${jobDescription}` : ''}

Format your response with clear headers and emojis for readability. Be objective and professional. ALWAYS end with the HIRING SCORE section.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this resume:\n\n${resumeText}` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Failed to analyze resume" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
