import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, Building2, CreditCard, CheckCircle2, AlertCircle, ExternalLink, Settings, X, TrendingUp, Code } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Types based on GoCardless API structure
interface Country {
  code: string;
  name: string;
}

interface Institution {
  id: string;
  name: string;
  bic: string;
  transaction_total_days: string;
  countries: string[];
  logo: string;
}

interface Transaction {
  transactionId: string;
  entryReference?: string;
  endToEndId?: string;
  mandateId?: string;
  checkId?: string;
  creditorId?: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: {
    amount: string;
    currency: string;
  };
  creditorName?: string;
  creditorAccount?: {
    iban?: string;
    bban?: string;
  };
  debtorName?: string;
  debtorAccount?: {
    iban?: string;
    bban?: string;
  };
  remittanceInformationUnstructured?: string;
  remittanceInformationStructured?: string;
  additionalInformation?: string;
  bankTransactionCode?: string;
  purposeCode?: string;
  proprietaryBankTransactionCode?: string;
  [key: string]: any; // Allow additional fields from API
}

interface Account {
  id: string;
  iban: string;
  institution_id: string;
  status: string;
  owner_name?: string;
  details?: {
    iban: string;
    bban?: string;
    currency: string;
    name: string;
    displayName: string;
    product?: string;
    cashAccountType?: string;
    bic?: string;
    msisdn?: string;
    usage?: string;
    status?: string;
    ownerName?: string;
    linkedAccounts?: string[];
    [key: string]: any; // Allow additional fields from API
  };
  balances?: Array<{
    balanceAmount: {
      amount: string;
      currency: string;
    };
    balanceType: string;
    referenceDate: string;
    creditLimitIncluded?: boolean;
    lastChangeDateTime?: string;
    [key: string]: any; // Allow additional fields from API
  }>;
  transactions?: {
    booked: Transaction[];
    pending: Transaction[];
  };
}

interface Requisition {
  id: string;
  redirect: string;
  status: string;
  institution_id: string;
  agreement?: string;
  reference: string;
  accounts: string[];
  user_language: string;
  link: string;
  ssn?: string;
  account_selection: boolean;
  redirect_immediate: boolean;
}

export default function BankAccountSelector() {
  const [step, setStep] = useState<'country' | 'bank' | 'auth' | 'accounts' | 'details'>('country');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<Institution | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [requisition, setRequisition] = useState<Requisition | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle return from bank authentication
  useEffect(() => {
    const ref = searchParams.get('ref');
    const authComplete = searchParams.get('auth_complete');
    const authError = searchParams.get('auth_error');

    if (authComplete && ref) {
      console.log('🔄 Authentication completed, restoring flow state...');
      
      // Restore flow state from localStorage
      const savedRequisition = localStorage.getItem('bank_requisition');
      const savedSelectedBank = localStorage.getItem('selected_bank');
      const savedSelectedCountry = localStorage.getItem('selected_country');
      
      console.log('💾 Saved data:', {
        hasRequisition: !!savedRequisition,
        hasBank: !!savedSelectedBank,
        hasCountry: !!savedSelectedCountry
      });
      
      if (savedRequisition && savedSelectedBank && savedSelectedCountry) {
        const requisitionData = JSON.parse(savedRequisition);
        const bankData = JSON.parse(savedSelectedBank);
        
        console.log('✅ Restoring state with requisition ID:', requisitionData.id);
        
        setRequisition(requisitionData);
        setSelectedBank(bankData);
        setSelectedCountry(savedSelectedCountry);
        setStep('accounts');
        
        // Authentication completed successfully, load accounts
        toast({
          title: "Bank authentication completed",
          description: "Loading your accounts...",
        });
        
        // Load accounts directly with the requisition data
        loadAccountsWithRequisition(requisitionData);
      } else {
        console.error('❌ Missing saved flow data');
        toast({
          title: "Session expired",
          description: "Please restart the bank connection process.",
          variant: "destructive"
        });
        resetFlow();
      }
      
      // Clean up URL params
      navigate('/', { replace: true });
    } else if (authError) {
      toast({
        title: "Authentication failed",
        description: "There was an issue with bank authentication. Please try again.",
        variant: "destructive"
      });
      
      // Restore to auth step
      const savedSelectedBank = localStorage.getItem('selected_bank');
      const savedSelectedCountry = localStorage.getItem('selected_country');
      
      if (savedSelectedBank && savedSelectedCountry) {
        setSelectedBank(JSON.parse(savedSelectedBank));
        setSelectedCountry(savedSelectedCountry);
        setStep('auth');
      }
      
      // Clean up URL params
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  // Helper function for API calls via Supabase edge function
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

  // Load configured countries from database
  const loadCountries = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supported_countries')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order');
      
      if (error) throw error;
      
      // Transform to match expected format
      const countries = (data || []).map(country => ({
        code: country.country_code,
        name: country.country_name
      }));
      
      setCountries(countries);
    } catch (error) {
      console.error('Failed to load configured countries:', error);
      toast({
        title: "Failed to load countries",
        description: "Could not fetch configured countries. Please configure countries first.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load countries when component mounts
  useEffect(() => {
    loadCountries();
  }, []);

  // Auto-load institutions when country is selected
  useEffect(() => {
    if (selectedCountry) {
      getAccessToken();
    }
  }, [selectedCountry]);

  // Step 1: Get access token via Edge Function
  const getAccessToken = async () => {
    setLoading(true);
    try {
      console.log('🔥 Edge Function Mode: Connecting to GoCardless...');
      
      // Load real institutions
      await loadInstitutions();
      setStep('bank');
      
      toast({
        title: "Authentication successful",
        description: "Connected to GoCardless API via Supabase",
      });
    } catch (error) {
      console.error('Edge function authentication error:', error);
      toast({
        title: "Authentication failed", 
        description: error instanceof Error ? error.message : "Failed to connect to GoCardless API",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Load configured institutions for selected country
  const loadInstitutions = async () => {
    if (!selectedCountry) return;

    setLoading(true);
    try {
      // Get configured institutions for this country
      const { data, error } = await supabase
        .from('supported_institutions')
        .select('*')
        .eq('country_code', selectedCountry)
        .eq('is_enabled', true)
        .order('display_order');
      
      if (error) throw error;
      
      // Transform to match expected Institution format
      const institutions = (data || []).map(inst => ({
        id: inst.institution_id,
        name: inst.institution_name,
        bic: inst.bic || '',
        transaction_total_days: '90', // Default value
        countries: [inst.country_code],
        logo: inst.logo_url || ''
      }));
      
      setInstitutions(institutions);
    } catch (error) {
      toast({
        title: "Failed to load banks",
        description: error instanceof Error ? error.message : "Could not fetch configured institutions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create requisition and redirect to bank
  const selectBank = async (institution: Institution) => {
    setSelectedBank(institution);
    setLoading(true);

    try {
      const requisitionData = await apiCall('/requisitions/', {
        method: 'POST',
        body: JSON.stringify({
          redirect: `${window.location.origin}/bank-auth-return`,
          institution_id: institution.id,
          reference: `ref_${Date.now()}`,
          user_language: 'EN',
          account_selection: false,
          redirect_immediate: false
        }),
      }) as Requisition;

      setRequisition(requisitionData);
      setStep('auth');
      
      // Save flow state to localStorage for return from authentication
      localStorage.setItem('bank_requisition', JSON.stringify(requisitionData));
      localStorage.setItem('selected_bank', JSON.stringify(institution));
      localStorage.setItem('selected_country', selectedCountry);
      
      toast({
        title: "Bank selected",
        description: `Ready to connect to ${institution.name}`,
      });
    } catch (error) {
      toast({
        title: "Failed to create connection",
        description: error instanceof Error ? error.message : "Could not create bank connection",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Handle return from bank auth and load accounts (REAL API)
  const loadAccountsWithRequisition = async (requisitionData: Requisition) => {
    setLoading(true);
    try {
      console.log('🔥 REAL API: Loading accounts for requisition:', requisitionData.id);
      
      // Check requisition status first
      const reqStatus = await apiCall(`/requisitions/${requisitionData.id}/`) as any;
      
      console.log('Requisition status:', reqStatus);
      
      if (reqStatus.status !== 'LN') {
        toast({
          title: "Authentication not complete",
          description: `Requisition status: ${reqStatus.status}. Please complete bank authentication first.`,
          variant: "destructive"
        });
        setStep('auth');
        return;
      }

      // Load real accounts
      const accountPromises = reqStatus.accounts.map((accountId: string) =>
        apiCall(`/accounts/${accountId}/`)
      );

      const accountsData = await Promise.all(accountPromises);
      setAccounts(accountsData);
      setStep('accounts');

      toast({
        title: "Accounts loaded",
        description: `Found ${accountsData.length} real account(s)`,
      });
    } catch (error) {
      console.error('Failed to load real accounts:', error);
      toast({
        title: "Failed to load accounts",
        description: error instanceof Error ? error.message : "Could not fetch accounts",
        variant: "destructive"
      });
      setStep('auth'); // Go back to auth step on error
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Handle return from bank auth and load accounts (REAL API)
  const loadAccounts = async () => {
    if (!requisition?.id) return;

    setLoading(true);
    try {
      console.log('🔥 REAL API: Loading accounts for requisition:', requisition.id);
      
      // Check requisition status first
      const reqStatus = await apiCall(`/requisitions/${requisition.id}/`) as any;
      
      console.log('Requisition status:', reqStatus);
      
      if (reqStatus.status !== 'LN') {
        toast({
          title: "Authentication not complete",
          description: `Requisition status: ${reqStatus.status}. Please complete bank authentication first.`,
          variant: "destructive"
        });
        return;
      }

      // Load real accounts
      const accountPromises = reqStatus.accounts.map((accountId: string) =>
        apiCall(`/accounts/${accountId}/`)
      );

      const accountsData = await Promise.all(accountPromises);
      setAccounts(accountsData);
      setStep('accounts');

      toast({
        title: "Accounts loaded",
        description: `Found ${accountsData.length} real account(s)`,
      });
    } catch (error) {
      console.error('Failed to load real accounts:', error);
      toast({
        title: "Failed to load accounts",
        description: error instanceof Error ? error.message : "Could not fetch accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Load account details and transactions (REAL API)
  const selectAccount = async (account: Account) => {
    setLoading(true);
    try {
      console.log('🔥 REAL API: Loading details and transactions for account:', account.id);
      
      // Get real detailed account information including transactions
      const [details, balances, transactions] = await Promise.all([
        apiCall(`/accounts/${account.id}/details/`),
        apiCall(`/accounts/${account.id}/balances/`),
        apiCall(`/accounts/${account.id}/transactions/`),
      ]);

      console.log('Account details received:', details);
      console.log('Account balances received:', balances);
      console.log('Account transactions received:', transactions);

      setSelectedAccount({
        ...account,
        details: details.account,
        balances: balances.balances,
        transactions: transactions.transactions,
      });
      setStep('details');

      toast({
        title: "Account data loaded",
        description: "Account details and transactions retrieved successfully",
      });
    } catch (error) {
      console.error('Failed to load real account data:', error);
      toast({
        title: "Failed to load account data",
        description: error instanceof Error ? error.message : "Could not fetch account details and transactions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('country');
    setSelectedCountry('');
    setSelectedBank(null);
    setSelectedAccount(null);
    setInstitutions([]);
    setAccounts([]);
    setRequisition(null);
    
    // Clear all stored flow data
    localStorage.removeItem('gc_access_token');
    localStorage.removeItem('bank_requisition');
    localStorage.removeItem('selected_bank');
    localStorage.removeItem('selected_country');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Secure Bank Connection
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect your bank account securely using GoCardless Open Banking API. 
            Your data is encrypted and processed according to PSD2 standards.
          </p>
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/configuration')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Banks
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            {[
              { key: 'country', label: 'Country', icon: Globe },
              { key: 'bank', label: 'Bank', icon: Building2 },
              { key: 'auth', label: 'Login', icon: Shield },
              { key: 'accounts', label: 'Accounts', icon: CreditCard },
              { key: 'details', label: 'Details', icon: CheckCircle2 },
            ].map(({ key, label, icon: Icon }, index) => (
              <div key={key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth ${
                  step === key 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : index < ['country', 'bank', 'auth', 'accounts', 'details'].indexOf(step)
                    ? 'border-success bg-success text-success-foreground'
                    : 'border-muted bg-background text-muted-foreground'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="ml-2 text-sm font-medium hidden sm:block">{label}</span>
                {index < 4 && <div className="w-8 h-0.5 bg-muted mx-4 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {step === 'country' && <><Globe className="h-5 w-5" /> Select Your Country</>}
                  {step === 'bank' && <><Building2 className="h-5 w-5" /> Choose Your Bank</>}
                  {step === 'auth' && <><Shield className="h-5 w-5" /> Bank Authentication</>}
                  {step === 'accounts' && <><CreditCard className="h-5 w-5" /> Select Account</>}
                  {step === 'details' && <><CheckCircle2 className="h-5 w-5" /> Account Details</>}
                </CardTitle>
                <CardDescription>
                  {step === 'country' && 'Select the country where your bank is located'}
                  {step === 'bank' && 'Choose your bank from the list of supported institutions'}
                  {step === 'auth' && 'You will be redirected to your bank to authenticate'}
                  {step === 'accounts' && 'Select the account you want to connect'}
                  {step === 'details' && 'Review your account information'}
                </CardDescription>
              </div>
              {step !== 'country' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFlow}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Country Selection */}
            {step === 'country' && (
              <div className="space-y-4">
                 <div className="p-4 border rounded-lg bg-gradient-to-r from-destructive/10 to-primary/10 border-primary/20">
                   <h4 className="font-medium mb-2 flex items-center gap-2">
                     🔥 <span>Supabase Edge Function Mode</span>
                   </h4>
                   <p className="text-sm text-muted-foreground">
                     This will make <strong>secure server-side API calls</strong> to GoCardless via Supabase edge functions. 
                     You need valid GoCardless API credentials. Make sure you're using <strong>sandbox credentials</strong> for testing.
                   </p>
                 </div>

                <div className="space-y-4">
                  <Label>Select Your Country</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {countries.map((country) => {
                      // Country code to flag emoji mapping
                      const getFlagEmoji = (countryCode: string) => {
                        const flags: { [key: string]: string } = {
                          'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'ES': '🇪🇸', 'IT': '🇮🇹',
                          'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
                          'BE': '🇧🇪', 'AT': '🇦🇹', 'PT': '🇵🇹', 'IE': '🇮🇪', 'LU': '🇱🇺',
                          'IS': '🇮🇸', 'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'PL': '🇵🇱',
                          'CZ': '🇨🇿', 'SK': '🇸🇰', 'HU': '🇭🇺', 'SI': '🇸🇮', 'HR': '🇭🇷',
                          'BG': '🇧🇬', 'RO': '🇷🇴'
                        };
                        return flags[countryCode] || '🏳️';
                      };

                      return (
                        <Card
                          key={country.code}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                            selectedCountry === country.code 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedCountry(country.code)}
                        >
                          <CardContent className="p-3 text-center">
                            <div className="text-2xl mb-1">
                              {getFlagEmoji(country.code)}
                            </div>
                            <div className="text-xs font-medium truncate">
                              {country.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {country.code}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
                
                {countries.length === 0 && !loading && (
                  <p className="text-muted-foreground text-center py-4">
                    No countries available. Please configure countries first.
                  </p>
                )}
              </div>
            )}

            {/* Step 2: Bank Selection */}
            {step === 'bank' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-select">Select Your Bank</Label>
                  <Select onValueChange={(institutionId) => {
                    const institution = institutions.find(inst => inst.id === institutionId);
                    if (institution) selectBank(institution);
                  }}>
                    <SelectTrigger id="bank-select">
                      <SelectValue placeholder="Choose your bank from the list" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {institutions
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((institution) => (
                        <SelectItem key={institution.id} value={institution.id}>
                          <div className="flex items-center space-x-3 py-1">
                            {institution.logo && (
                              <img 
                                src={institution.logo} 
                                alt={institution.name}
                                className="w-6 h-6 object-contain rounded flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{institution.name}</div>
                              <div className="text-xs text-muted-foreground">{institution.bic}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {institutions.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No banks found for this country</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Bank Authentication */}
            {step === 'auth' && selectedBank && requisition && (
              <div className="text-center space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    {selectedBank.logo && (
                      <img 
                        src={selectedBank.logo} 
                        alt={selectedBank.name}
                        className="w-16 h-16 object-contain rounded"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold">{selectedBank.name}</h3>
                      <Badge variant="secondary">{selectedBank.bic}</Badge>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground max-w-md mx-auto">
                    You will be redirected to {selectedBank.name} to securely authenticate and 
                    authorize access to your account information.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={() => window.location.href = requisition.link}
                    className="bg-gradient-primary hover:bg-gradient-accent"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Authenticate with {selectedBank.name}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground">
                    After authentication, you'll be automatically redirected back to continue
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Account Selection */}
            {step === 'accounts' && (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {accounts.map((account) => (
                    <Card 
                      key={account.id}
                      className="cursor-pointer hover:shadow-lg transition-smooth border hover:border-primary/50"
                      onClick={() => selectAccount(account)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">
                              {account.iban ? `****${account.iban.slice(-4)}` : 'Account'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Status: <Badge variant={account.status === 'READY' ? 'default' : 'secondary'}>
                                {account.status}
                              </Badge>
                            </p>
                          </div>
                          <CreditCard className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Account Details */}
            {step === 'details' && selectedAccount && (
              <div className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Account Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedAccount.details && (
                        <>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                            <p className="text-sm font-medium">{selectedAccount.details.displayName || selectedAccount.details.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">IBAN</Label>
                            <p className="text-sm font-mono bg-muted/50 p-2 rounded">{selectedAccount.details.iban}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Currency</Label>
                            <p className="text-sm">{selectedAccount.details.currency}</p>
                          </div>
                          {selectedAccount.details.product && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Product</Label>
                              <p className="text-sm">{selectedAccount.details.product}</p>
                            </div>
                          )}
                          {selectedAccount.details.cashAccountType && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                              <p className="text-sm">{selectedAccount.details.cashAccountType}</p>
                            </div>
                          )}
                          {selectedAccount.details.bic && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">BIC</Label>
                              <p className="text-sm font-mono">{selectedAccount.details.bic}</p>
                            </div>
                          )}
                          {selectedAccount.details.msisdn && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                              <p className="text-sm">{selectedAccount.details.msisdn}</p>
                            </div>
                          )}
                          {selectedAccount.details.usage && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Usage</Label>
                              <p className="text-sm">{selectedAccount.details.usage}</p>
                            </div>
                          )}
                          {selectedAccount.details.status && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                              <Badge variant={selectedAccount.details.status === 'enabled' ? 'default' : 'secondary'}>
                                {selectedAccount.details.status}
                              </Badge>
                            </div>
                          )}
                          {selectedAccount.details.ownerName && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Owner Name</Label>
                              <p className="text-sm">{selectedAccount.details.ownerName}</p>
                            </div>
                          )}
                          {selectedAccount.details.linkedAccounts && selectedAccount.details.linkedAccounts.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">Linked Accounts</Label>
                              <div className="space-y-1">
                                {selectedAccount.details.linkedAccounts.map((linkedAccount, idx) => (
                                  <p key={idx} className="text-sm font-mono text-xs bg-muted/50 p-1 rounded">
                                    {linkedAccount}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Balance Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAccount.balances?.map((balance, index) => (
                        <div key={index} className="p-4 border rounded-lg bg-muted/30">
                          <div className="flex justify-between items-start mb-2">
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                {balance.balanceType}
                              </Badge>
                              {balance.creditLimitIncluded !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                  Credit limit included: {balance.creditLimitIncluded ? 'Yes' : 'No'}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-lg">
                                {balance.balanceAmount.amount} {balance.balanceAmount.currency}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Reference Date: {new Date(balance.referenceDate).toLocaleDateString()}</p>
                            {balance.lastChangeDateTime && (
                              <p>Last Change: {new Date(balance.lastChangeDateTime).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Transactions Section */}
                {selectedAccount.transactions && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Transaction History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Booked Transactions */}
                        {selectedAccount.transactions.booked && selectedAccount.transactions.booked.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Badge variant="default">Booked Transactions</Badge>
                              <span className="text-sm text-muted-foreground">
                                ({selectedAccount.transactions.booked.length} transactions)
                              </span>
                            </h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {selectedAccount.transactions.booked.map((transaction, index) => (
                                <div key={transaction.transactionId || index} className="border rounded-lg p-4 bg-muted/30">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {transaction.remittanceInformationUnstructured || 
                                         transaction.remittanceInformationStructured || 
                                         transaction.creditorName || 
                                         transaction.debtorName || 
                                         'Transaction'}
                                      </p>
                                      <div className="flex gap-2 items-center mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {new Date(transaction.bookingDate).toLocaleDateString()}
                                        </Badge>
                                        {transaction.valueDate && (
                                          <Badge variant="outline" className="text-xs">
                                            Value: {new Date(transaction.valueDate).toLocaleDateString()}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className={`font-semibold ${
                                        parseFloat(transaction.transactionAmount.amount) >= 0 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }`}>
                                        {transaction.transactionAmount.amount} {transaction.transactionAmount.currency}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Transaction Details */}
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {transaction.creditorName && (
                                      <p>Creditor: {transaction.creditorName}</p>
                                    )}
                                    {transaction.debtorName && (
                                      <p>Debtor: {transaction.debtorName}</p>
                                    )}
                                    {transaction.creditorAccount?.iban && (
                                      <p>Creditor IBAN: {transaction.creditorAccount.iban}</p>
                                    )}
                                    {transaction.debtorAccount?.iban && (
                                      <p>Debtor IBAN: {transaction.debtorAccount.iban}</p>
                                    )}
                                    {transaction.bankTransactionCode && (
                                      <p>Bank Code: {transaction.bankTransactionCode}</p>
                                    )}
                                    {transaction.purposeCode && (
                                      <p>Purpose: {transaction.purposeCode}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Transactions */}
                        {selectedAccount.transactions.pending && selectedAccount.transactions.pending.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <Badge variant="secondary">Pending Transactions</Badge>
                              <span className="text-sm text-muted-foreground">
                                ({selectedAccount.transactions.pending.length} transactions)
                              </span>
                            </h4>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                              {selectedAccount.transactions.pending.map((transaction, index) => (
                                <div key={transaction.transactionId || index} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {transaction.remittanceInformationUnstructured || 
                                         transaction.remittanceInformationStructured || 
                                         transaction.creditorName || 
                                         transaction.debtorName || 
                                         'Pending Transaction'}
                                      </p>
                                      <div className="flex gap-2 items-center mt-1">
                                        <Badge variant="outline" className="text-xs">
                                          {new Date(transaction.bookingDate).toLocaleDateString()}
                                        </Badge>
                                        {transaction.valueDate && (
                                          <Badge variant="outline" className="text-xs">
                                            Value: {new Date(transaction.valueDate).toLocaleDateString()}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p className={`font-semibold ${
                                        parseFloat(transaction.transactionAmount.amount) >= 0 
                                          ? 'text-green-600' 
                                          : 'text-red-600'
                                      }`}>
                                        {transaction.transactionAmount.amount} {transaction.transactionAmount.currency}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Additional Transaction Details */}
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    {transaction.creditorName && (
                                      <p>Creditor: {transaction.creditorName}</p>
                                    )}
                                    {transaction.debtorName && (
                                      <p>Debtor: {transaction.debtorName}</p>
                                    )}
                                    {transaction.creditorAccount?.iban && (
                                      <p>Creditor IBAN: {transaction.creditorAccount.iban}</p>
                                    )}
                                    {transaction.debtorAccount?.iban && (
                                      <p>Debtor IBAN: {transaction.debtorAccount.iban}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Transactions Message */}
                        {(!selectedAccount.transactions.booked || selectedAccount.transactions.booked.length === 0) &&
                         (!selectedAccount.transactions.pending || selectedAccount.transactions.pending.length === 0) && (
                          <div className="text-center py-8">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No transactions found for this account</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Raw Data Section for Debugging */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Raw Account Data
                      <Badge variant="outline" className="ml-auto">Debug Info</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Account Details</Label>
                        <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(selectedAccount.details, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Balance Data</Label>
                        <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-64">
                          {JSON.stringify(selectedAccount.balances, null, 2)}
                        </pre>
                      </div>
                      {selectedAccount.transactions && (
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Transaction Data</Label>
                          <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto max-h-64">
                            {JSON.stringify(selectedAccount.transactions, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button onClick={resetFlow} variant="outline">
                    Connect Another Account
                  </Button>
                </div>
              </div>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}