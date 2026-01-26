-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create sender_mail_ids table
CREATE TABLE public.sender_mail_ids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, email)
);

-- Enable RLS on sender_mail_ids
ALTER TABLE public.sender_mail_ids ENABLE ROW LEVEL SECURITY;

-- RLS policies for sender_mail_ids
CREATE POLICY "Users can view their own sender mail IDs" 
ON public.sender_mail_ids 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sender mail IDs" 
ON public.sender_mail_ids 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sender mail IDs" 
ON public.sender_mail_ids 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sender mail IDs" 
ON public.sender_mail_ids 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create connected_accounts table for OAuth tokens
CREATE TABLE public.connected_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS on connected_accounts
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;

-- RLS policies for connected_accounts
CREATE POLICY "Users can view their own connected accounts" 
ON public.connected_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connected accounts" 
ON public.connected_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts" 
ON public.connected_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts" 
ON public.connected_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create emails table
CREATE TABLE public.emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sender_mail_id UUID NOT NULL REFERENCES public.sender_mail_ids(id) ON DELETE CASCADE,
  sender_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, external_id)
);

-- Enable RLS on emails
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- RLS policies for emails
CREATE POLICY "Users can view their own emails" 
ON public.emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" 
ON public.emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" 
ON public.emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for emails
ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sender_mail_ids_updated_at
BEFORE UPDATE ON public.sender_mail_ids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_connected_accounts_updated_at
BEFORE UPDATE ON public.connected_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();