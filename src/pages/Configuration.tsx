import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Globe, Building2, Save, RefreshCw, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Country {
  code: string;
  name: string;
  is_enabled?: boolean;
  display_order?: number;
}

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
  is_enabled?: boolean;
  display_order?: number;
}

interface SupportedCountry {
  id: string;
  country_code: string;
  country_name: string;
  is_enabled: boolean;
  display_order: number;
}

interface SupportedInstitution {
  id: string;
  institution_id: string;
  institution_name: string;
  country_code: string;
  bic: string | null;
  logo_url: string | null;
  is_enabled: boolean;
  display_order: number;
}

export default function Configuration() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [availableCountries, setAvailableCountries] = useState<Country[]>([]);
  const [availableInstitutions, setAvailableInstitutions] = useState<Institution[]>([]);
  const [supportedCountries, setSupportedCountries] = useState<SupportedCountry[]>([]);
  const [supportedInstitutions, setSupportedInstitutions] = useState<SupportedInstitution[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // API call helper using edge function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const { data, error } = await supabase.functions.invoke('gocardless-api', {
        body: {
          endpoint,
          method: options.method || 'GET',
          body: options.body ? JSON.parse(options.body as string) : undefined
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Edge function call failed:', error);
      throw error;
    }
  };

  // Load available countries and institutions from GoCardless API
  const loadAvailableData = async () => {
    setLoading(true);
    try {
      const institutions = await apiCall('/institutions/') as Institution[];
      setAvailableInstitutions(institutions);

      // Extract unique countries
      const countryMap = new Map();
      const countryNames: { [key: string]: string } = {
        'GB': 'United Kingdom',
        'DE': 'Germany', 
        'FR': 'France',
        'ES': 'Spain',
        'IT': 'Italy',
        'NL': 'Netherlands',
        'SE': 'Sweden',
        'NO': 'Norway',
        'DK': 'Denmark',
        'FI': 'Finland',
        'BE': 'Belgium',
        'AT': 'Austria',
        'PT': 'Portugal',
        'IE': 'Ireland',
        'LU': 'Luxembourg',
        'IS': 'Iceland',
        'EE': 'Estonia',
        'LV': 'Latvia',  
        'LT': 'Lithuania',
        'PL': 'Poland',
        'CZ': 'Czech Republic',
        'SK': 'Slovakia',
        'HU': 'Hungary',
        'SI': 'Slovenia',
        'HR': 'Croatia',
        'BG': 'Bulgaria',
        'RO': 'Romania'
      };

      institutions.forEach(institution => {
        institution.countries.forEach(countryCode => {
          if (!countryMap.has(countryCode)) {
            countryMap.set(countryCode, {
              code: countryCode,
              name: countryNames[countryCode] || countryCode
            });
          }
        });
      });

      const countries = Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setAvailableCountries(countries);
    } catch (error) {
      toast({
        title: "Failed to load data",
        description: "Could not fetch available countries and institutions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load current configuration from database
  const loadConfiguration = async () => {
    try {
      const [countriesResult, institutionsResult] = await Promise.all([
        supabase.from('supported_countries').select('*').order('display_order'),
        supabase.from('supported_institutions').select('*').order('country_code, display_order')
      ]);

      if (countriesResult.error) throw countriesResult.error;
      if (institutionsResult.error) throw institutionsResult.error;

      setSupportedCountries(countriesResult.data || []);
      setSupportedInstitutions(institutionsResult.data || []);
    } catch (error) {
      console.error('Failed to load configuration:', error);
    }
  };

  // Toggle country support
  const toggleCountrySupport = async (countryCode: string, enabled: boolean) => {
    try {
      const country = availableCountries.find(c => c.code === countryCode);
      if (!country) return;

      if (enabled) {
        // Add to supported countries
        const { error } = await supabase.from('supported_countries').insert({
          country_code: countryCode,
          country_name: country.name,
          is_enabled: true,
          display_order: supportedCountries.length
        });
        if (error) throw error;
      } else {
        // Remove from supported countries and all institutions for this country
        const { error: countryError } = await supabase
          .from('supported_countries')
          .delete()
          .eq('country_code', countryCode);
        
        const { error: institutionsError } = await supabase
          .from('supported_institutions')
          .delete()
          .eq('country_code', countryCode);

        if (countryError) throw countryError;
        if (institutionsError) throw institutionsError;
      }

      await loadConfiguration();
    } catch (error) {
      toast({
        title: "Failed to update country",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Toggle institution support
  const toggleInstitutionSupport = async (institution: Institution, enabled: boolean) => {
    if (!selectedCountry) return;

    try {
      if (enabled) {
        // Add to supported institutions
        const { error } = await supabase.from('supported_institutions').insert({
          institution_id: institution.id,
          institution_name: institution.name,
          country_code: selectedCountry,
          bic: institution.bic,
          logo_url: institution.logo,
          is_enabled: true,
          display_order: supportedInstitutions.filter(i => i.country_code === selectedCountry).length
        });
        if (error) throw error;
      } else {
        // Remove from supported institutions
        const { error } = await supabase
          .from('supported_institutions')
          .delete()
          .eq('institution_id', institution.id)
          .eq('country_code', selectedCountry);
        
        if (error) throw error;
      }

      await loadConfiguration();
    } catch (error) {
      toast({
        title: "Failed to update institution",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // Initialize default configuration
  const initializeDefaultConfig = async () => {
    setSaving(true);
    try {
      // Enable all countries by default
      const countriesToInsert = availableCountries.map((country, index) => ({
        country_code: country.code,
        country_name: country.name,
        is_enabled: true,
        display_order: index
      }));

      const { error: countriesError } = await supabase
        .from('supported_countries')
        .upsert(countriesToInsert, { onConflict: 'country_code' });

      if (countriesError) throw countriesError;

      // Enable all institutions by default
      const institutionsToInsert: any[] = [];
      availableInstitutions.forEach((institution, index) => {
        institution.countries.forEach(countryCode => {
          institutionsToInsert.push({
            institution_id: institution.id,
            institution_name: institution.name,
            country_code: countryCode,
            bic: institution.bic,
            logo_url: institution.logo,
            is_enabled: true,
            display_order: index
          });
        });
      });

      const { error: institutionsError } = await supabase
        .from('supported_institutions')
        .upsert(institutionsToInsert, { onConflict: 'institution_id,country_code' });

      if (institutionsError) throw institutionsError;

      await loadConfiguration();
      
      toast({
        title: "Configuration initialized",
        description: "Default configuration has been applied"
      });
    } catch (error) {
      toast({
        title: "Failed to initialize configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    loadAvailableData();
    loadConfiguration();
  }, []);

  const isCountrySupported = (countryCode: string) => {
    return supportedCountries.some(c => c.country_code === countryCode && c.is_enabled);
  };

  const isInstitutionSupported = (institutionId: string, countryCode: string) => {
    return supportedInstitutions.some(i => 
      i.institution_id === institutionId && 
      i.country_code === countryCode && 
      i.is_enabled
    );
  };

  const getInstitutionsForCountry = (countryCode: string) => {
    return availableInstitutions.filter(institution => 
      institution.countries.includes(countryCode)
    );
  };

  const enabledCountries = supportedCountries.filter(c => c.is_enabled);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Bank Configuration</h1>
            </div>
            <p className="text-muted-foreground">
              Configure which countries and banks are available for connection
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bank Selection
            </Button>
            {supportedCountries.length === 0 && (
              <Button onClick={initializeDefaultConfig} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
                Initialize Default Config
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="countries" className="space-y-6">
          <TabsList>
            <TabsTrigger value="countries" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Countries ({enabledCountries.length})
            </TabsTrigger>
            <TabsTrigger value="institutions" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Banks
            </TabsTrigger>
          </TabsList>

          {/* Countries Tab */}
          <TabsContent value="countries">
            <Card>
              <CardHeader>
                <CardTitle>Supported Countries</CardTitle>
                <CardDescription>
                  Enable or disable countries available for bank connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading countries...</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableCountries.map((country) => (
                      <Card key={country.code} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{country.name}</h3>
                            <p className="text-sm text-muted-foreground">{country.code}</p>
                          </div>
                          <Switch
                            checked={isCountrySupported(country.code)}
                            onCheckedChange={(checked) => toggleCountrySupport(country.code, checked)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Institutions Tab */}
          <TabsContent value="institutions">
            <div className="space-y-6">
              {/* Country Selector */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Country</CardTitle>
                  <CardDescription>
                    Choose a country to configure its available banks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {enabledCountries.map((country) => (
                      <Button
                        key={country.country_code}
                        variant={selectedCountry === country.country_code ? "default" : "outline"}
                        onClick={() => setSelectedCountry(country.country_code)}
                      >
                        {country.country_name}
                      </Button>
                    ))}
                  </div>
                  {enabledCountries.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No countries enabled. Please enable countries first.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Institutions for Selected Country */}
              {selectedCountry && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Banks for {enabledCountries.find(c => c.country_code === selectedCountry)?.country_name}
                    </CardTitle>
                    <CardDescription>
                      Enable or disable specific banks for this country
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {getInstitutionsForCountry(selectedCountry).map((institution) => (
                        <Card key={institution.id} className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                              {institution.logo && (
                                <img 
                                  src={institution.logo} 
                                  alt={institution.name}
                                  className="w-8 h-8 object-contain rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{institution.name}</h3>
                                <p className="text-sm text-muted-foreground">{institution.bic}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {institution.transaction_total_days} days
                              </Badge>
                              <Switch
                                checked={isInstitutionSupported(institution.id, selectedCountry)}
                                onCheckedChange={(checked) => toggleInstitutionSupport(institution, checked)}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}