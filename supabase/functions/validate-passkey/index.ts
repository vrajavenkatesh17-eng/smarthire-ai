import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { passkey } = await req.json();
    
    if (!passkey) {
      return new Response(JSON.stringify({ valid: false, error: "Passkey required" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // First check against the environment variable (fallback)
    const storedPasskey = Deno.env.get("COMPANY_PASSKEY");
    
    if (storedPasskey && passkey === storedPasskey) {
      console.log("Passkey validated against environment variable");
      return new Response(JSON.stringify({ valid: true, adminId: null }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check against database passkeys using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: passkeyData, error: passkeyError } = await supabase
      .from("passkey_settings")
      .select("id, admin_id, is_active")
      .eq("passkey", passkey)
      .eq("is_active", true)
      .single();

    if (passkeyError || !passkeyData) {
      console.log("Passkey not found in database:", passkeyError?.message);
      return new Response(JSON.stringify({ valid: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Passkey validated against database");
    return new Response(JSON.stringify({ 
      valid: true, 
      adminId: passkeyData.admin_id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error validating passkey:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
