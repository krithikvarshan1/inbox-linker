import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, ArrowRight, Loader2, CheckCircle2, Inbox } from 'lucide-react';
import { toast } from 'sonner';

const emailSchema = z.string().email('Please enter a valid email address');

type AuthStep = 'email' | 'otp' | 'success';

export default function Auth() {
  const { user, signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
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
      toast.error(error.message || 'Failed to send OTP');
      return;
    }

    toast.success('OTP sent to your email!');
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    const { error } = await verifyOtp(email, otp);
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Invalid OTP. Please try again.');
      setOtp('');
      return;
    }

    setStep('success');
    setTimeout(() => navigate('/dashboard'), 1500);
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
              {step === 'email' && 'Welcome to MailFlow'}
              {step === 'otp' && 'Enter Verification Code'}
              {step === 'success' && 'Welcome Back!'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'email' && 'Sign in or create an account with your email'}
              {step === 'otp' && `We sent a 6-digit code to ${email}`}
              {step === 'success' && 'Redirecting you to your dashboard...'}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleVerifyOtp}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  className="w-full primary-gradient"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground w-full text-center transition-colors"
                >
                  Use a different email
                </button>
              </div>
            )}

            {step === 'success' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center animate-scale-in">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <p className="text-muted-foreground">Authentication successful!</p>
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
