import { supabase } from "@/integrations/supabase/client";

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export async function signUp({ email, password, name, organizationName }: SignUpData) {
  // 1. Create the user with auto-confirm enabled
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: { name },
    },
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Falha ao criar usuário");

  // 2. With auto-confirm, the session should be available immediately
  let session = authData.session;
  
  if (!session) {
    // If no session returned, user needs to confirm email
    throw new Error("Por favor, confirme seu email antes de continuar. Verifique sua caixa de entrada.");
  }

  // 3. Set the session in the client to use the new token for subsequent requests
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  // 4. Now create the organization with the authenticated session
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: organizationName })
    .select()
    .single();

  if (orgError) throw orgError;

  // 4. Add user as admin of the organization
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: authData.user.id,
      role: "admin",
    });

  if (memberError) throw memberError;

  // 5. Update profile with organization
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: org.id, name })
    .eq("user_id", authData.user.id);

  if (profileError) throw profileError;

  // 6. Create default ticket columns
  const defaultColumns = [
    { name: "Em Atendimento", color: "#EC4899", position: 0, organization_id: org.id },
    { name: "Proposta Enviada", color: "#06B6D4", position: 1, organization_id: org.id },
    { name: "Follow Up", color: "#F97316", position: 2, organization_id: org.id },
    { name: "Implantação", color: "#3B82F6", position: 3, organization_id: org.id },
    { name: "Concluído", color: "#22C55E", position: 4, organization_id: org.id },
  ];

  await supabase.from("ticket_columns").insert(defaultColumns);

  // 7. Create default departments
  const defaultDepartments = [
    { name: "Comercial", color: "#3B82F6", organization_id: org.id },
    { name: "Suporte", color: "#8B5CF6", organization_id: org.id },
    { name: "Financeiro", color: "#22C55E", organization_id: org.id },
  ];

  await supabase.from("departments").insert(defaultDepartments);

  // 8. Create default tags
  const defaultTags = [
    { name: "Novo Cliente", color: "#22C55E", organization_id: org.id },
    { name: "Prioridade Alta", color: "#EF4444", organization_id: org.id },
    { name: "VIP", color: "#F59E0B", organization_id: org.id },
  ];

  await supabase.from("tags").insert(defaultTags);

  return { user: authData.user, organization: org };
}

export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
