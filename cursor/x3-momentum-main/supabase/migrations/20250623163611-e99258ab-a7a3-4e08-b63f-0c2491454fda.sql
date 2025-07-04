
-- Create function to increment coupon usage count
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.coupons 
  SET used_count = used_count + 1,
      updated_at = now()
  WHERE id = p_coupon_id;
END;
$$;
