
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
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
    
    const { tier, coupon_code } = await req.json();
    logStep("Request data", { tier, coupon_code });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Find or create customer
    let customerId;
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("Created new customer", { customerId });
    }

    // Define pricing tiers
    const pricingTiers: Record<string, { amount: number; name: string }> = {
      basic: { amount: 799, name: "Basic Plan" },
      premium: { amount: 1999, name: "Premium Plan" },
      pro: { amount: 4999, name: "Pro Plan" }
    };

    const selectedTier = pricingTiers[tier];
    if (!selectedTier) throw new Error("Invalid tier selected");
    logStep("Selected tier", selectedTier);

    // Validate coupon if provided
    let couponData = null;
    if (coupon_code) {
      const { data: validation, error: validationError } = await supabaseClient
        .rpc('validate_coupon', {
          p_coupon_code: coupon_code,
          p_user_id: user.id,
          p_tier: tier
        });

      if (validationError) {
        logStep("Coupon validation error", validationError);
        throw new Error("Error validating coupon");
      }

      if (validation && validation.length > 0) {
        const result = validation[0];
        if (!result.valid) {
          logStep("Invalid coupon", result);
          throw new Error(result.message);
        }
        couponData = result;
        logStep("Valid coupon", couponData);
      }
    }

    // Create checkout session
    const sessionData: any = {
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selectedTier.name },
            unit_amount: selectedTier.amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/pricing`,
      metadata: {
        user_id: user.id,
        tier: tier,
        ...(coupon_code && { coupon_code }),
        ...(couponData && { coupon_id: couponData.coupon_id })
      }
    };

    // Apply discount if coupon is valid
    if (couponData) {
      if (couponData.discount_type === 'percentage') {
        sessionData.discounts = [{
          coupon: await stripe.coupons.create({
            percent_off: couponData.discount_value,
            duration: 'once',
            name: `${couponData.discount_value}% off`
          }).then(c => c.id)
        }];
      } else {
        sessionData.discounts = [{
          coupon: await stripe.coupons.create({
            amount_off: Math.round(couponData.discount_value * 100),
            currency: 'usd',
            duration: 'once',
            name: `$${couponData.discount_value} off`
          }).then(c => c.id)
        }];
      }
      logStep("Applied discount", { type: couponData.discount_type, value: couponData.discount_value });
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    logStep("Created checkout session", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
