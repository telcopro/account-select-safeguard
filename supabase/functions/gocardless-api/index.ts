import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOCARDLESS_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { endpoint, method = 'GET', body, secretId, secretKey } = await req.json();

    // Use provided credentials or get from environment
    const clientId = secretId || Deno.env.get('GOCARDLESS_SECRET_ID');
    const clientSecret = secretKey || Deno.env.get('GOCARDLESS_SECRET_KEY');

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'GoCardless credentials not provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let authToken = '';

    // Get access token for authenticated endpoints
    if (endpoint !== '/token/new/') {
      const tokenResponse = await fetch(`${GOCARDLESS_BASE_URL}/token/new/`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret_id: clientId,
          secret_key: clientSecret
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        console.error('Token request failed:', errorData);
        return new Response(
          JSON.stringify({ error: 'Failed to get access token', details: errorData }),
          { status: tokenResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData = await tokenResponse.json();
      authToken = tokenData.access;
    }

    // Make the actual API call
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const apiResponse = await fetch(`${GOCARDLESS_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('API call failed:', responseData);
      return new Response(
        JSON.stringify({ error: 'API call failed', details: responseData }),
        { status: apiResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gocardless-api function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});