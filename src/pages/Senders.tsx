import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Mail, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const senderSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  label: z.string().optional(),
});

interface SenderMailId {
  id: string;
  email: string;
  label: string | null;
  created_at: string;
}

export default function Senders() {
  const { user } = useAuth();
  const [senders, setSenders] = useState<SenderMailId[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSender, setEditingSender] = useState<SenderMailId | null>(null);
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  useEffect(() => {
    if (user) {
      fetchSenders();
    }
  }, [user]);

  const fetchSenders = async () => {
    const { data, error } = await supabase
      .from('sender_mail_ids')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load sender IDs');
      return;
    }

    setSenders(data || []);
    setLoading(false);
  };

  const openAddDialog = () => {
    setEditingSender(null);
    setEmail('');
    setLabel('');
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (sender: SenderMailId) => {
    setEditingSender(sender);
    setEmail(sender.email);
    setLabel(sender.label || '');
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setErrors({});
    
    const result = senderSchema.safeParse({ email, label });
    if (!result.success) {
      const fieldErrors: { email?: string } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    if (editingSender) {
      // Update
      const { error } = await supabase
        .from('sender_mail_ids')
        .update({ email, label: label || null })
        .eq('id', editingSender.id);

      if (error) {
        toast.error(error.message.includes('duplicate') 
          ? 'This email is already being tracked'
          : 'Failed to update sender'
        );
        setSaving(false);
        return;
      }

      toast.success('Sender updated successfully');
    } else {
      // Insert
      const { error } = await supabase
        .from('sender_mail_ids')
        .insert({
          user_id: user!.id,
          email,
          label: label || null,
        });

      if (error) {
        toast.error(error.message.includes('duplicate') 
          ? 'This email is already being tracked'
          : 'Failed to add sender'
        );
        setSaving(false);
        return;
      }

      toast.success('Sender added successfully');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchSenders();
  };

  const handleDelete = async (sender: SenderMailId) => {
    if (!confirm(`Remove ${sender.email} from tracked senders? This will also delete all associated emails.`)) {
      return;
    }

    const { error } = await supabase
      .from('sender_mail_ids')
      .delete()
      .eq('id', sender.id);

    if (error) {
      toast.error('Failed to delete sender');
      return;
    }

    toast.success('Sender removed');
    fetchSenders();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Sender Email IDs</h1>
            <p className="text-muted-foreground">
              Manage the email addresses you want to track
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="gap-2 primary-gradient">
                <Plus className="w-4 h-4" />
                Add Sender
              </Button>
            </DialogTrigger>
            
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSender ? 'Edit Sender' : 'Add Sender Email'}
                </DialogTitle>
                <DialogDescription>
                  Enter an email address to track. Only emails from this sender will be captured.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Email Address</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="hr@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({});
                    }}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender-label">Label (Optional)</Label>
                  <Input
                    id="sender-label"
                    placeholder="e.g., HR Department"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    A friendly name to identify this sender
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="primary-gradient">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingSender ? (
                    'Save Changes'
                  ) : (
                    'Add Sender'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sender List */}
        {senders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No senders added yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add email addresses you want to track. Only emails from these senders will be captured and organized into spreadsheets.
              </p>
              <Button onClick={openAddDialog} className="gap-2 primary-gradient">
                <Plus className="w-4 h-4" />
                Add Your First Sender
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {senders.map(sender => (
              <Card key={sender.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{sender.email}</p>
                      {sender.label && (
                        <p className="text-sm text-muted-foreground">{sender.label}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(sender)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sender)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
