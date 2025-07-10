-- Create configuration tables for bank selection
CREATE TABLE public.supported_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.supported_institutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  bic TEXT,
  logo_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(institution_id, country_code)
);

-- Enable Row Level Security
ALTER TABLE public.supported_countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_institutions ENABLE ROW LEVEL SECURITY;

-- Create policies for configuration access (anyone can view, admins can manage)
CREATE POLICY "Anyone can view supported countries" 
ON public.supported_countries 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage supported countries" 
ON public.supported_countries 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Anyone can view supported institutions" 
ON public.supported_institutions 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage supported institutions" 
ON public.supported_institutions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Create function to update timestamps
CREATE TRIGGER update_supported_countries_updated_at
BEFORE UPDATE ON public.supported_countries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_supported_institutions_updated_at
BEFORE UPDATE ON public.supported_institutions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_supported_countries_enabled ON public.supported_countries (is_enabled, display_order);
CREATE INDEX idx_supported_institutions_country_enabled ON public.supported_institutions (country_code, is_enabled, display_order);