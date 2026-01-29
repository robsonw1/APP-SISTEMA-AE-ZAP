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

  const organizationId = crypto.randomUUID();

  // 4. Create the organization (avoid SELECT; user isn't a member yet)
  const { error: orgError } = await supabase
    .from("organizations")
    .insert({ id: organizationId, name: organizationName });

  if (orgError) throw orgError;

  // 4. Add user as admin of the organization
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: authData.user.id,
      role: "admin",
    });

  if (memberError) throw memberError;

  // 5. Update (or create) profile with organization
  const { data: updatedProfile, error: profileUpdateError } = await supabase
    .from("profiles")
    .update({ organization_id: organizationId, name })
    .eq("user_id", authData.user.id)
    .select("user_id")
    .maybeSingle();

  if (profileUpdateError) throw profileUpdateError;

  if (!updatedProfile) {
    const { error: profileInsertError } = await supabase.from("profiles").insert({
      user_id: authData.user.id,
      name,
      email: email ?? null,
      organization_id: organizationId,
    });

    if (profileInsertError) throw profileInsertError;
  }

  // 6. Create default ticket columns
  const defaultColumns = [
    { name: "Em Atendimento", color: "#EC4899", position: 0, organization_id: organizationId },
    { name: "Proposta Enviada", color: "#06B6D4", position: 1, organization_id: organizationId },
    { name: "Follow Up", color: "#F97316", position: 2, organization_id: organizationId },
    { name: "Implantação", color: "#3B82F6", position: 3, organization_id: organizationId },
    { name: "Concluído", color: "#22C55E", position: 4, organization_id: organizationId },
  ];

  await supabase.from("ticket_columns").insert(defaultColumns);

  // 7. Create default departments
  const defaultDepartments = [
    { name: "Comercial", color: "#3B82F6", organization_id: organizationId },
    { name: "Suporte", color: "#8B5CF6", organization_id: organizationId },
    { name: "Financeiro", color: "#22C55E", organization_id: organizationId },
  ];

  await supabase.from("departments").insert(defaultDepartments);

  // 8. Create default tags
  const defaultTags = [
    { name: "Novo Cliente", color: "#22C55E", organization_id: organizationId },
    { name: "Prioridade Alta", color: "#EF4444", organization_id: organizationId },
    { name: "VIP", color: "#F59E0B", organization_id: organizationId },
  ];

  await supabase.from("tags").insert(defaultTags);

  // 9. Fetch organization now that membership exists (SELECT policy should pass)
  const { data: org, error: orgFetchError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgFetchError) throw orgFetchError;

  return { user: authData.user, organization: org ?? { id: organizationId, name: organizationName } };
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
