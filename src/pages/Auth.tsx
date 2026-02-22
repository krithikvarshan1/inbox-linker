import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowRight, Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const emailSchema = z.string().email('Please enter a valid email address');

export default function Auth() {
  const { user, signInWithOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Failed to send magic link');
      return;
    }

    setSent(true);
    toast.success('Magic link sent! Check your email.');
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in">
          <div className="w-10 h-10 rounded-lg primary-gradient flex items-center justify-center">
            <Inbox className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold text-foreground">MailFlow</span>
        </div>

        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-display text-2xl">
              {sent ? 'Check Your Email' : 'Welcome to MailFlow'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {sent
                ? `We sent a magic link to ${email}. Click it to sign in.`
                : 'Sign in or create an account with your email'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {!sent ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError('');
                      }}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                  {emailError && (
                    <p className="text-sm text-destructive">{emailError}</p>
                  )}
                </div>

                <Button type="submit" className="w-full primary-gradient" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Magic Link
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Click the link in your email to sign in. You can close this tab.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="text-sm text-muted-foreground hover:text-foreground w-full text-center transition-colors"
                >
                  Use a different email
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
