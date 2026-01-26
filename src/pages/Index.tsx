import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Inbox, 
  ArrowRight, 
  Mail, 
  Table2, 
  Shield, 
  Zap,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: Mail,
    title: 'Track Specific Senders',
    description: 'Monitor emails from the addresses that matter most to your business',
  },
  {
    icon: Table2,
    title: 'Live Spreadsheets',
    description: 'Automatically organize emails into sortable, searchable spreadsheets',
  },
  {
    icon: Shield,
    title: 'Privacy First',
    description: 'Read-only access with strict filtering — we only see what you specify',
  },
  {
    icon: Zap,
    title: 'Real-time Sync',
    description: 'Emails appear instantly in your dashboard as they arrive',
  },
];

const steps = [
  'Sign up with OTP verification',
  'Add sender email addresses to track',
  'Connect your Gmail or Outlook account',
  'Watch your spreadsheets populate automatically',
];

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen hero-gradient">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center">
              <Inbox className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">MailFlow</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button className="primary-gradient">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Email to Spreadsheet, Automated
            </div>
            
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight mb-6">
              Turn Important Emails into{' '}
              <span className="text-primary">Live Spreadsheets</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Track emails from specific senders and automatically organize them into real-time, searchable spreadsheets. Export anytime, stay organized always.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="primary-gradient text-lg px-8 py-6">
                  Start Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete solution for managing and organizing your most important email communications
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Get started in minutes with our simple setup process
            </p>
          </div>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step}
                className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-8 h-8 rounded-full primary-gradient flex items-center justify-center flex-shrink-0 text-primary-foreground font-semibold text-sm">
                  {index + 1}
                </div>
                <p className="font-medium">{step}</p>
                <CheckCircle2 className="w-5 h-5 text-success ml-auto" />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="primary-gradient">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded primary-gradient flex items-center justify-center">
              <Inbox className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold">MailFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 MailFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
