import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function BankAuthReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    // Get the reference from the URL params
    const ref = searchParams.get('ref');
    
    if (ref) {
      // Success - redirect back to main page with the reference
      // The main component will handle continuing the flow
      setTimeout(() => {
        navigate(`/?ref=${ref}&auth_complete=true`);
      }, 2000);
    } else {
      // Error - redirect back to main page
      setTimeout(() => {
        navigate('/?auth_error=true');
      }, 2000);
    }
  }, [navigate, searchParams]);

  const ref = searchParams.get('ref');
  const hasError = !ref;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center">
            {hasError ? (
              <>
                <AlertCircle className="h-6 w-6 text-destructive" />
                Authentication Failed
              </>
            ) : (
              <>
                <CheckCircle2 className="h-6 w-6 text-success" />
                Authentication Complete
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {hasError ? (
            <p className="text-muted-foreground">
              There was an issue with the bank authentication. You will be redirected back to try again.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your bank authentication was successful! You will be redirected back to continue the process.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Redirecting...</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}