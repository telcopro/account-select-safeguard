import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shield, Globe, Building2, CreditCard, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  };
  balances?: Array<{
    balanceAmount: {
      amount: string;
      currency: string;
    };
    balanceType: string;
    referenceDate: string;
  }>;
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

// Mock data for countries and institutions (you'll replace this with API calls)
const mockCountries: Country[] = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
];

export default function BankAccountSelector() {
  const [step, setStep] = useState<'country' | 'bank' | 'auth' | 'accounts' | 'details'>('country');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<Institution | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [apiSecretId, setApiSecretId] = useState<string>('');
  const [apiSecretKey, setApiSecretKey] = useState<string>('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [requisition, setRequisition] = useState<Requisition | null>(null);
  
  const { toast } = useToast();

  // API base URL
  const API_BASE = 'https://bankaccountdata.gocardless.com/api/v2';

  // Helper function for API calls
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('gc_access_token');
    
    // For prototype: simulate API responses with mock data
    console.log(`Mock API call to ${endpoint}`);
    
    if (endpoint.includes('/institutions/')) {
      return getMockInstitutions(selectedCountry);
    }
    
    if (endpoint.includes('/requisitions/')) {
      return getMockRequisition();
    }
    
    if (endpoint.includes('/accounts/')) {
      return getMockAccountData();
    }

    throw new Error('API endpoint not implemented in mock');
  };

  // Mock data functions
  const getMockInstitutions = (country: string) => {
    const mockInstitutions = {
      'GB': [
        { id: 'MONZO_GBBGB2L', name: 'Monzo', bic: 'MONZGB2L', transaction_total_days: '90', countries: ['GB'], logo: 'https://cdn.nordigen.com/ais/MONZO_GBBGB2L.png' },
        { id: 'REVOLUT_GBBGB2L', name: 'Revolut', bic: 'REVOGB21', transaction_total_days: '90', countries: ['GB'], logo: 'https://cdn.nordigen.com/ais/REVOLUT_GBBGB2L.png' },
        { id: 'STARLING_GBBGB2L', name: 'Starling Bank', bic: 'SRLGGB2L', transaction_total_days: '90', countries: ['GB'], logo: 'https://cdn.nordigen.com/ais/STARLING_GBBGB2L.png' },
      ],
      'SE': [
        { id: 'SWEDBANK_SWEDSESS', name: 'Swedbank', bic: 'SWEDSESS', transaction_total_days: '90', countries: ['SE'], logo: 'https://cdn.nordigen.com/ais/SWEDBANK_SWEDSESS.png' },
        { id: 'SEB_SESSESS1', name: 'SEB', bic: 'ESSESESS', transaction_total_days: '90', countries: ['SE'], logo: 'https://cdn.nordigen.com/ais/SEB_SESSESS1.png' },
        { id: 'NORDEA_NDEASESSKK', name: 'Nordea', bic: 'NDEASESS', transaction_total_days: '90', countries: ['SE'], logo: 'https://cdn.nordigen.com/ais/NORDEA_NDEASESSKK.png' },
      ]
    };
    
    return mockInstitutions[country as keyof typeof mockInstitutions] || [];
  };

  const getMockRequisition = () => ({
    id: 'mock-requisition-123',
    redirect: `${window.location.origin}/bank-auth-return`,
    status: 'CR',
    institution_id: selectedBank?.id || 'MOCK_BANK',
    reference: `ref_${Date.now()}`,
    accounts: [],
    user_language: 'EN',
    link: '#mock-auth-link',
    account_selection: true,
    redirect_immediate: false
  });

  const getMockAccountData = () => ({
    id: 'mock-account-123',
    iban: 'GB33BUKB20201555555555',
    institution_id: selectedBank?.id || 'MOCK_BANK',
    status: 'READY',
    owner_name: 'John Doe',
    details: {
      iban: 'GB33BUKB20201555555555',
      currency: 'GBP',
      name: 'Current Account',
      displayName: 'John\'s Current Account',
      product: 'Current Account',
      cashAccountType: 'CACC'
    },
    balances: [
      {
        balanceAmount: { amount: '1234.56', currency: 'GBP' },
        balanceType: 'expected',
        referenceDate: new Date().toISOString().split('T')[0]
      },
      {
        balanceAmount: { amount: '1200.00', currency: 'GBP' },
        balanceType: 'interimAvailable',
        referenceDate: new Date().toISOString().split('T')[0]
      }
    ]
  });

  // Step 1: Get access token (now mocked for prototype)
  const getAccessToken = async () => {
    if (!apiSecretId || !apiSecretKey) {
      toast({
        title: "Missing API credentials",
        description: "Please provide both Secret ID and Secret Key",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🎭 PROTOTYPE MODE: Simulating GoCardless authentication...');
      console.log('In production, this would validate:', {
        secret_id: apiSecretId.substring(0, 8) + '...',
        secret_key: apiSecretKey.substring(0, 8) + '...'
      });

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock successful authentication
      const mockToken = 'mock-access-token-' + Date.now();
      localStorage.setItem('gc_access_token', mockToken);
      
      console.log('✅ Mock authentication successful');
      
      // Load mock institutions for selected country
      await loadInstitutions();
      setStep('bank');
      
      toast({
        title: "Authentication successful",
        description: "Connected to GoCardless API (Prototype Mode)",
      });
    } catch (error) {
      console.error('Authentication error details:', error);
      toast({
        title: "Authentication failed", 
        description: error instanceof Error ? error.message : "Failed to connect to GoCardless",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Load institutions for selected country
  const loadInstitutions = async () => {
    if (!selectedCountry) return;

    setLoading(true);
    try {
      const data = await apiCall(`/institutions/?country=${selectedCountry}`) as Institution[];
      setInstitutions(data);
    } catch (error) {
      toast({
        title: "Failed to load banks",
        description: error instanceof Error ? error.message : "Could not fetch institutions",
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
        }),
      }) as Requisition;

      setRequisition(requisitionData);
      setStep('auth');
      
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

  // Step 4: Handle return from bank auth and load accounts (now mocked)
  const loadAccounts = async () => {
    if (!requisition?.id) return;

    setLoading(true);
    try {
      console.log('🎭 PROTOTYPE: Simulating account loading...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock multiple accounts
      const mockAccounts = [
        {
          id: 'account-1',
          iban: 'GB33BUKB20201555555555',
          institution_id: selectedBank?.id || 'MOCK_BANK',
          status: 'READY',
          owner_name: 'John Doe'
        },
        {
          id: 'account-2', 
          iban: 'GB82WEST12345698765432',
          institution_id: selectedBank?.id || 'MOCK_BANK',
          status: 'READY',
          owner_name: 'John Doe'
        }
      ];

      setAccounts(mockAccounts);
      setStep('accounts');

      toast({
        title: "Accounts loaded",
        description: `Found ${mockAccounts.length} account(s) (Prototype Mode)`,
      });
    } catch (error) {
      toast({
        title: "Failed to load accounts",
        description: error instanceof Error ? error.message : "Could not fetch accounts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Load account details (now mocked)
  const selectAccount = async (account: Account) => {
    setLoading(true);
    try {
      console.log('🎭 PROTOTYPE: Loading account details...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Use mock data function
      const accountWithDetails = {
        ...account,
        ...getMockAccountData(),
        id: account.id,
        iban: account.iban
      };

      setSelectedAccount(accountWithDetails);
      setStep('details');

      toast({
        title: "Account details loaded",
        description: "Account information retrieved successfully (Prototype Mode)",
      });
    } catch (error) {
      toast({
        title: "Failed to load account details",
        description: error instanceof Error ? error.message : "Could not fetch account details",
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
    localStorage.removeItem('gc_access_token');
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
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Step 1: Country Selection */}
            {step === 'country' && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
                  <h4 className="font-medium mb-2">🎭 Prototype Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    This is a <strong>demonstration</strong> of the GoCardless API integration. 
                    Enter any values for Secret ID and Key - the prototype will simulate the complete flow 
                    with realistic mock data including bank logos and account information.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="secret-id">GoCardless Secret ID</Label>
                    <Input
                      id="secret-id"
                      type="password"
                      placeholder="Enter any value (prototype mode)"
                      value={apiSecretId}
                      onChange={(e) => setApiSecretId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secret-key">GoCardless Secret Key</Label>
                    <Input
                      id="secret-key"
                      type="password"
                      placeholder="Enter any value (prototype mode)"
                      value={apiSecretKey}
                      onChange={(e) => setApiSecretKey(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCountries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={getAccessToken} 
                  disabled={!selectedCountry || !apiSecretId || !apiSecretKey || loading}
                  className="w-full"
                >
                  {loading ? 'Connecting...' : 'Continue to Bank Selection'}
                </Button>
              </div>
            )}

            {/* Step 2: Bank Selection */}
            {step === 'bank' && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {institutions.map((institution) => (
                    <Card 
                      key={institution.id} 
                      className="cursor-pointer hover:shadow-lg transition-smooth border hover:border-primary/50"
                      onClick={() => selectBank(institution)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          {institution.logo && (
                            <img 
                              src={institution.logo} 
                              alt={institution.name}
                              className="w-12 h-12 object-contain rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-medium">{institution.name}</h3>
                            <p className="text-sm text-muted-foreground">{institution.bic}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
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
                  
                  <div className="p-4 border rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
                    <p className="text-sm text-muted-foreground">
                      🎭 <strong>Prototype Mode:</strong> In a real implementation, you would be redirected to {selectedBank.name} 
                      for secure authentication. This prototype simulates the complete flow.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    onClick={loadAccounts}
                    disabled={loading}
                    className="bg-gradient-primary hover:bg-gradient-accent"
                  >
                    {loading ? 'Loading Accounts...' : `Simulate Authentication with ${selectedBank.name}`}
                  </Button>
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
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAccount.details && (
                        <>
                          <div>
                            <Label className="text-sm font-medium">Account Name</Label>
                            <p className="text-sm">{selectedAccount.details.displayName || selectedAccount.details.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">IBAN</Label>
                            <p className="text-sm font-mono">{selectedAccount.details.iban}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Currency</Label>
                            <p className="text-sm">{selectedAccount.details.currency}</p>
                          </div>
                          {selectedAccount.details.product && (
                            <div>
                              <Label className="text-sm font-medium">Product</Label>
                              <p className="text-sm">{selectedAccount.details.product}</p>
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Balance Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedAccount.balances?.map((balance, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{balance.balanceType}</Badge>
                            <p className="font-semibold">
                              {balance.balanceAmount.amount} {balance.balanceAmount.currency}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            As of {new Date(balance.referenceDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

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