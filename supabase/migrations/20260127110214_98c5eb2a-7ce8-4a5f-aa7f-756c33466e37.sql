-- =============================================
-- CRM SYSTEM COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. CREATE ENUMS
CREATE TYPE public.member_role AS ENUM ('admin', 'member');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting', 'closed');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.message_sender_type AS ENUM ('user', 'contact', 'bot');

-- 2. CREATE BASE TABLES

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization members table (links users to organizations)
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tags table
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.organization_members(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  city TEXT,
  state TEXT,
  document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contact tags junction table
CREATE TABLE public.contact_tags (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

-- Ticket columns (Kanban)
CREATE TABLE public.ticket_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.organization_members(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  column_id UUID REFERENCES public.ticket_columns(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status NOT NULL DEFAULT 'open',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  position INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ticket tags junction table
CREATE TABLE public.ticket_tags (
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tag_id)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  sender_type message_sender_type NOT NULL,
  sender_id UUID REFERENCES public.organization_members(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CREATE INDEXES
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_org_id ON public.profiles(organization_id);
CREATE INDEX idx_contacts_org_id ON public.contacts(organization_id);
CREATE INDEX idx_tickets_org_id ON public.tickets(organization_id);
CREATE INDEX idx_tickets_contact_id ON public.tickets(contact_id);
CREATE INDEX idx_tickets_column_id ON public.tickets(column_id);
CREATE INDEX idx_tickets_assigned_to ON public.tickets(assigned_to);
CREATE INDEX idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_tags_org_id ON public.tags(organization_id);
CREATE INDEX idx_departments_org_id ON public.departments(organization_id);

-- 4. CREATE SECURITY DEFINER FUNCTIONS

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_organization_member(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  )
$$;

-- Check if user is admin of organization
CREATE OR REPLACE FUNCTION public.is_organization_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1
$$;

-- Get user's organization member ID
CREATE OR REPLACE FUNCTION public.get_user_member_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM organization_members WHERE user_id = auth.uid() LIMIT 1
$$;

-- 5. ENABLE RLS ON ALL TABLES
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- Organizations policies
CREATE POLICY "Users can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_organization_member(id));

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  USING (public.is_organization_admin(id));

CREATE POLICY "Anyone can create an organization"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- Organization members policies
CREATE POLICY "Users can view members of their organization"
  ON public.organization_members FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Users can join an organization"
  ON public.organization_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update organization members"
  ON public.organization_members FOR UPDATE
  USING (public.is_organization_admin(organization_id));

CREATE POLICY "Admins can delete organization members"
  ON public.organization_members FOR DELETE
  USING (public.is_organization_admin(organization_id));

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization"
  ON public.profiles FOR SELECT
  USING (
    user_id = auth.uid() OR 
    public.is_organization_member(organization_id)
  );

CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Departments policies
CREATE POLICY "Users can view departments in their organization"
  ON public.departments FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create departments"
  ON public.departments FOR INSERT
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can update departments"
  ON public.departments FOR UPDATE
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Admins can delete departments"
  ON public.departments FOR DELETE
  USING (public.is_organization_admin(organization_id));

-- Tags policies
CREATE POLICY "Users can view tags in their organization"
  ON public.tags FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create tags"
  ON public.tags FOR INSERT
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can update tags"
  ON public.tags FOR UPDATE
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Admins can delete tags"
  ON public.tags FOR DELETE
  USING (public.is_organization_admin(organization_id));

-- Contacts policies
CREATE POLICY "Users can view contacts in their organization"
  ON public.contacts FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can update contacts"
  ON public.contacts FOR UPDATE
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can delete contacts"
  ON public.contacts FOR DELETE
  USING (public.is_organization_member(organization_id));

-- Contact tags policies
CREATE POLICY "Users can view contact tags"
  ON public.contact_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.id = contact_id AND public.is_organization_member(c.organization_id)
    )
  );

CREATE POLICY "Members can manage contact tags"
  ON public.contact_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.id = contact_id AND public.is_organization_member(c.organization_id)
    )
  );

CREATE POLICY "Members can delete contact tags"
  ON public.contact_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM contacts c 
      WHERE c.id = contact_id AND public.is_organization_member(c.organization_id)
    )
  );

-- Ticket columns policies
CREATE POLICY "Users can view columns in their organization"
  ON public.ticket_columns FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create columns"
  ON public.ticket_columns FOR INSERT
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can update columns"
  ON public.ticket_columns FOR UPDATE
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Admins can delete columns"
  ON public.ticket_columns FOR DELETE
  USING (public.is_organization_admin(organization_id));

-- Tickets policies
CREATE POLICY "Users can view tickets in their organization"
  ON public.tickets FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Members can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (public.is_organization_member(organization_id));

CREATE POLICY "Members can update tickets"
  ON public.tickets FOR UPDATE
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Admins can delete tickets"
  ON public.tickets FOR DELETE
  USING (public.is_organization_admin(organization_id));

-- Ticket tags policies
CREATE POLICY "Users can view ticket tags"
  ON public.ticket_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

CREATE POLICY "Members can manage ticket tags"
  ON public.ticket_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

CREATE POLICY "Members can delete ticket tags"
  ON public.ticket_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

-- Messages policies
CREATE POLICY "Users can view messages in their organization"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

CREATE POLICY "Members can create messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

CREATE POLICY "Members can update messages"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tickets t 
      WHERE t.id = ticket_id AND public.is_organization_member(t.organization_id)
    )
  );

-- 7. CREATE TRIGGERS

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update timestamp triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_organization_members_updated_at
  BEFORE UPDATE ON public.organization_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_ticket_columns_updated_at
  BEFORE UPDATE ON public.ticket_columns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Update ticket last_message_at when message is created
CREATE OR REPLACE FUNCTION public.update_ticket_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets 
  SET last_message_at = NEW.created_at,
      unread_count = CASE 
        WHEN NEW.sender_type = 'contact' THEN unread_count + 1 
        ELSE unread_count 
      END
  WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_ticket_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_last_message();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. ENABLE REALTIME FOR MESSAGES AND TICKETS
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;