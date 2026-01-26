import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Mail, AlertCircle, CheckCircle2, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  expires_at: string | null;
  created_at: string;
}

export default function Connections() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAccounts();
    }
  }, [user]);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load connected accounts');
      return;
    }

    setAccounts(data || []);
    setLoading(false);
  };

  const handleConnectGmail = () => {
    toast.info('Gmail OAuth integration requires Google Cloud Console setup. See documentation for details.');
  };

  const handleConnectOutlook = () => {
    toast.info('Outlook OAuth integration requires Azure AD setup. See documentation for details.');
  };

  const handleDisconnect = async (account: ConnectedAccount) => {
    if (!confirm(`Disconnect ${account.email}? You'll need to reconnect to sync emails.`)) {
      return;
    }

    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('id', account.id);

    if (error) {
      toast.error('Failed to disconnect account');
      return;
    }

    toast.success('Account disconnected');
    fetchAccounts();
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold">Email Connections</h1>
          <p className="text-muted-foreground">
            Connect your email accounts to sync messages from tracked senders
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium mb-1">How it works</h3>
              <p className="text-sm text-muted-foreground">
                We use OAuth to securely connect to your email with read-only access. 
                Only emails from your specified sender IDs are fetched — all other emails remain private and are never accessed.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        {accounts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
            <div className="space-y-3">
              {accounts.map(account => (
                <Card key={account.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{account.email}</p>
                          <Badge variant={isExpired(account.expires_at) ? "destructive" : "secondary"}>
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {isExpired(account.expires_at) ? (
                            <span className="text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Token expired — reconnect required
                            </span>
                          ) : (
                            <span className="text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Connected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDisconnect(account)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Connect Options */}
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {accounts.length > 0 ? 'Add Another Account' : 'Connect an Email Account'}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={handleConnectGmail}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#EA4335]/10 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Google Gmail</h3>
                    <p className="text-sm text-muted-foreground">Connect your Google account</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Gmail
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={handleConnectOutlook}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0078D4]/10 flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#0078D4" d="M7.88 12.04c0-1.25.73-2.64 2.29-2.64s2.25 1.36 2.25 2.64c0 1.26-.65 2.64-2.25 2.64-1.56 0-2.29-1.38-2.29-2.64m3.24 5.8l.05-1.03c.35.52.95.99 1.87.99 1.56 0 2.87-1.18 2.87-3.68 0-2.24-1.16-3.79-2.95-3.79-.86 0-1.52.42-1.87.97l-.05-.85H9.49v10.36l1.63-2.97z"/>
                      <path fill="#0078D4" d="M24 6.3v11.4c0 1.83-1.47 3.3-3.3 3.3H8.4c-.93 0-1.77-.38-2.38-1l7.77-4.49v-.01l2.51-1.44c1.09-.63 1.7-1.82 1.7-3.06V3c.61.61 1 1.45 1 2.38v.92z"/>
                      <path fill="#28A8EA" d="M15.6 3c-.93 0-1.77.38-2.38 1L5.45 8.49l2.51 1.45 2.35 1.36v.01l7.69 4.44V6.3c0-1.83-1.47-3.3-3.3-3.3H5.4C4.47 3 3.63 3.38 3.02 4l9.69 5.61V6.3c0-.73.59-1.3 1.3-1.3h1.59z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Microsoft Outlook</h3>
                    <p className="text-sm text-muted-foreground">Connect your Microsoft account</p>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <Link2 className="w-4 h-4 mr-2" />
                  Connect Outlook
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
