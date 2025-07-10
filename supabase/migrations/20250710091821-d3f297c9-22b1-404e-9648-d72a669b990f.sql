-- Temporarily allow everyone to manage configuration tables
-- (In production, you'd want proper admin user setup)

DROP POLICY IF EXISTS "Admins can manage supported countries" ON public.supported_countries;
DROP POLICY IF EXISTS "Admins can manage supported institutions" ON public.supported_institutions;

-- Create temporary permissive policies for everyone to manage configuration
CREATE POLICY "Everyone can manage supported countries" 
ON public.supported_countries 
FOR ALL 
USING (true)
WITH CHECK (true);

CREATE POLICY "Everyone can manage supported institutions" 
ON public.supported_institutions 
FOR ALL 
USING (true)
WITH CHECK (true);