-- Create table for user inquiries/notifications
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES public.company_admins(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for admin notifications
CREATE POLICY "Admins can view their notifications"
ON public.admin_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.company_admins ca
    WHERE ca.user_id = auth.uid() AND ca.id = admin_notifications.admin_id
  )
);

CREATE POLICY "Anyone can insert notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update their notifications"
ON public.admin_notifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.company_admins ca
    WHERE ca.user_id = auth.uid() AND ca.id = admin_notifications.admin_id
  )
);

CREATE POLICY "Admins can delete their notifications"
ON public.admin_notifications
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.company_admins ca
    WHERE ca.user_id = auth.uid() AND ca.id = admin_notifications.admin_id
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;