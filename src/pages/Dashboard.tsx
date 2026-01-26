import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Mail, 
  Plus, 
  Download, 
  Search, 
  Calendar,
  ArrowUpDown,
  Inbox,
  FileSpreadsheet,
  Link2
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SenderMailId {
  id: string;
  email: string;
  label: string | null;
  created_at: string;
}

interface Email {
  id: string;
  sender_email: string;
  subject: string;
  content: string | null;
  received_at: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [senders, setSenders] = useState<SenderMailId[]>([]);
  const [emails, setEmails] = useState<{ [key: string]: Email[] }>({});
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [connectedAccounts, setConnectedAccounts] = useState<number>(0);

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch sender mail IDs
    const { data: sendersData } = await supabase
      .from('sender_mail_ids')
      .select('*')
      .order('created_at', { ascending: false });

    if (sendersData) {
      setSenders(sendersData);
      if (sendersData.length > 0 && !selectedSender) {
        setSelectedSender(sendersData[0].id);
      }

      // Fetch emails for each sender
      const emailsMap: { [key: string]: Email[] } = {};
      for (const sender of sendersData) {
        const { data: emailsData } = await supabase
          .from('emails')
          .select('*')
          .eq('sender_mail_id', sender.id)
          .order('received_at', { ascending: false });
        
        if (emailsData) {
          emailsMap[sender.id] = emailsData;
        }
      }
      setEmails(emailsMap);
    }

    // Fetch connected accounts count
    const { count } = await supabase
      .from('connected_accounts')
      .select('*', { count: 'exact', head: true });
    
    setConnectedAccounts(count || 0);
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('emails-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emails' },
        (payload) => {
          const newEmail = payload.new as Email & { sender_mail_id: string };
          setEmails(prev => ({
            ...prev,
            [newEmail.sender_mail_id]: [newEmail, ...(prev[newEmail.sender_mail_id] || [])]
          }));
          toast.success('New email received!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const exportToCSV = (senderId: string) => {
    const sender = senders.find(s => s.id === senderId);
    const senderEmails = emails[senderId] || [];
    
    if (senderEmails.length === 0) {
      toast.error('No emails to export');
      return;
    }

    const headers = ['Sender Email', 'Subject', 'Received Date', 'Received Time', 'Content'];
    const rows = senderEmails.map(email => [
      email.sender_email,
      `"${email.subject.replace(/"/g, '""')}"`,
      format(parseISO(email.received_at), 'yyyy-MM-dd'),
      format(parseISO(email.received_at), 'HH:mm:ss'),
      `"${(email.content || '').replace(/"/g, '""').substring(0, 500)}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sender?.email || 'emails'}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Exported successfully!');
  };

  const filteredEmails = selectedSender 
    ? (emails[selectedSender] || [])
        .filter(email => 
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.content?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
          const comparison = new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
          return sortOrder === 'asc' ? comparison : -comparison;
        })
    : [];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Empty state - no senders configured
  if (senders.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Welcome to MailFlow</h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start by adding sender email addresses you want to track, then connect your email account.
            </p>
            
            <div className="grid gap-4 md:grid-cols-2 max-w-lg mx-auto">
              <Link to="/dashboard/senders">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Add Sender IDs</h3>
                    <p className="text-sm text-muted-foreground">
                      Specify which senders to track
                    </p>
                  </CardContent>
                </Card>
              </Link>
              
              <Link to="/dashboard/connections">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="p-6 text-center">
                    <Link2 className="w-8 h-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold mb-1">Connect Email</h3>
                    <p className="text-sm text-muted-foreground">
                      Link Gmail or Outlook account
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Email Spreadsheets</h1>
            <p className="text-muted-foreground">
              View and export emails from your tracked senders
            </p>
          </div>
          
          {connectedAccounts === 0 && (
            <Link to="/dashboard/connections">
              <Button variant="outline" className="gap-2">
                <Link2 className="w-4 h-4" />
                Connect Email Account
              </Button>
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tracked Senders</p>
                  <p className="text-2xl font-bold">{senders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Emails</p>
                  <p className="text-2xl font-bold">
                    {Object.values(emails).flat().length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Connected Accounts</p>
                  <p className="text-2xl font-bold">{connectedAccounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spreadsheet Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search emails..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {selectedSender && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportToCSV(selectedSender)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={selectedSender || undefined} onValueChange={setSelectedSender}>
              <TabsList className="mb-4">
                {senders.map(sender => (
                  <TabsTrigger key={sender.id} value={sender.id} className="max-w-[200px]">
                    <span className="truncate">{sender.label || sender.email}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {senders.map(sender => (
                <TabsContent key={sender.id} value={sender.id}>
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No emails from this sender yet</p>
                      <p className="text-sm mt-1">
                        {connectedAccounts === 0 
                          ? 'Connect your email account to start syncing'
                          : 'Emails will appear here once received'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sender Email</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>
                              <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="flex items-center gap-1 hover:text-foreground transition-colors"
                              >
                                <Calendar className="w-4 h-4" />
                                Date & Time
                                <ArrowUpDown className="w-3 h-3" />
                              </button>
                            </TableHead>
                            <TableHead>Content Preview</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredEmails.map(email => (
                            <TableRow key={email.id}>
                              <TableCell className="font-medium">
                                {email.sender_email}
                              </TableCell>
                              <TableCell>{email.subject}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {format(parseISO(email.received_at), 'MMM d, yyyy')}
                                <span className="text-muted-foreground ml-2">
                                  {format(parseISO(email.received_at), 'HH:mm')}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate text-muted-foreground">
                                {email.content?.substring(0, 100) || '—'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
