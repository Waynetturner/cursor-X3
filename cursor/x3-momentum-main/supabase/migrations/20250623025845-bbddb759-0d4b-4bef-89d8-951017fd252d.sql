
-- Create subscribers table to track subscription information
CREATE TABLE public.subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupons table for managing discount codes
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  applicable_tiers TEXT[] DEFAULT ARRAY['basic', 'premium', 'pro'],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coupon_usage table to track coupon usage
CREATE TABLE public.coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers
CREATE POLICY "Users can view their own subscription" ON public.subscribers
  FOR SELECT USING (user_id = auth.uid() OR email = auth.email());

CREATE POLICY "Edge functions can insert subscriptions" ON public.subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Edge functions can update subscriptions" ON public.subscribers
  FOR UPDATE USING (true);

-- RLS Policies for coupons
CREATE POLICY "Everyone can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'wayne@waynetturner.com'
    )
  );

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view their own coupon usage" ON public.coupon_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Edge functions can insert coupon usage" ON public.coupon_usage
  FOR INSERT WITH CHECK (true);

-- Create function to validate coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT 'basic'
)
RETURNS TABLE(
  valid BOOLEAN,
  coupon_id UUID,
  discount_type TEXT,
  discount_value NUMERIC,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Find the coupon
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE code = p_coupon_code AND is_active = true;
  
  -- Check if coupon exists
  IF coupon_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::NUMERIC, 'Invalid coupon code'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon is expired
  IF coupon_record.valid_until IS NOT NULL AND coupon_record.valid_until < now() THEN
    RETURN QUERY SELECT false, coupon_record.id, NULL::TEXT, NULL::NUMERIC, 'Coupon has expired'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon hasn't started yet
  IF coupon_record.valid_from > now() THEN
    RETURN QUERY SELECT false, coupon_record.id, NULL::TEXT, NULL::NUMERIC, 'Coupon is not yet valid'::TEXT;
    RETURN;
  END IF;
  
  -- Check if coupon has usage limit
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RETURN QUERY SELECT false, coupon_record.id, NULL::TEXT, NULL::NUMERIC, 'Coupon usage limit reached'::TEXT;
    RETURN;
  END IF;
  
  -- Check if tier is applicable
  IF NOT (p_tier = ANY(coupon_record.applicable_tiers)) THEN
    RETURN QUERY SELECT false, coupon_record.id, NULL::TEXT, NULL::NUMERIC, 'Coupon not applicable to this plan'::TEXT;
    RETURN;
  END IF;
  
  -- Check if user has already used this coupon
  IF p_user_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.coupon_usage WHERE coupon_id = coupon_record.id AND user_id = p_user_id) THEN
      RETURN QUERY SELECT false, coupon_record.id, NULL::TEXT, NULL::NUMERIC, 'Coupon already used'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Coupon is valid
  RETURN QUERY SELECT 
    true, 
    coupon_record.id, 
    coupon_record.discount_type, 
    coupon_record.discount_value, 
    'Coupon is valid'::TEXT;
END;
$$;
