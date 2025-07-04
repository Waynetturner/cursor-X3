
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-CHECKOUT-SUCCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");
    
    const { session_id } = await req.json();
    if (!session_id) throw new Error("Session ID is required");
    logStep("Processing session", { session_id });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved session", { sessionId: session.id, status: session.payment_status });

    if (session.payment_status === 'paid' && session.metadata) {
      const userId = session.metadata.user_id;
      const couponCode = session.metadata.coupon_code;
      const couponId = session.metadata.coupon_id;

      logStep("Processing successful payment", { userId, couponCode, couponId });

      // Record coupon usage if applicable
      if (couponId && userId) {
        await supabaseClient.from("coupon_usage").insert({
          coupon_id: couponId,
          user_id: userId,
          stripe_session_id: session_id
        });

        // Update coupon usage count
        await supabaseClient.rpc('increment_coupon_usage', { p_coupon_id: couponId });
        logStep("Recorded coupon usage", { couponId, userId });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: false, message: "Payment not completed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-checkout-success", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
