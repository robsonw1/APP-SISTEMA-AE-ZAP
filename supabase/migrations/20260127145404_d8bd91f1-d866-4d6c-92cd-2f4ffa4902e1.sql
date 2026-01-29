-- Create whatsapp_connections table
CREATE TABLE public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instance_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  phone_number TEXT,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'qr_code', 'connecting')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  auto_close_tickets BOOLEAN NOT NULL DEFAULT false,
  qr_code TEXT,
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add index for organization lookups
CREATE INDEX idx_whatsapp_connections_org ON public.whatsapp_connections(organization_id);

-- Add unique constraint for instance name per organization
CREATE UNIQUE INDEX idx_whatsapp_connections_instance ON public.whatsapp_connections(organization_id, instance_name);

-- Enable RLS
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Members can view connections"
  ON public.whatsapp_connections FOR SELECT
  USING (is_organization_member(organization_id));

CREATE POLICY "Admins can create connections"
  ON public.whatsapp_connections FOR INSERT
  WITH CHECK (is_organization_admin(organization_id));

CREATE POLICY "Admins can update connections"
  ON public.whatsapp_connections FOR UPDATE
  USING (is_organization_admin(organization_id));

CREATE POLICY "Admins can delete connections"
  ON public.whatsapp_connections FOR DELETE
  USING (is_organization_admin(organization_id));

-- Add whatsapp_connection_id to tickets
ALTER TABLE public.tickets 
ADD COLUMN whatsapp_connection_id UUID REFERENCES public.whatsapp_connections(id) ON DELETE SET NULL;

-- Add media_url to messages for attachments
ALTER TABLE public.messages 
ADD COLUMN media_url TEXT,
ADD COLUMN media_type TEXT;

-- Add trigger for updated_at
CREATE TRIGGER update_whatsapp_connections_updated_at
  BEFORE UPDATE ON public.whatsapp_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;