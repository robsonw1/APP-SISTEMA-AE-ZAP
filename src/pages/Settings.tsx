import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User, Shield } from "lucide-react";

export default function Settings() {
  const { user, profile, organization, member, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization creation state
  const [orgName, setOrgName] = useState("");
  
  // Profile edit state
  const [profileName, setProfileName] = useState(profile?.name || "");
  const [profilePhone, setProfilePhone] = useState(profile?.phone || "");

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !orgName.trim()) return;
    
    setIsLoading(true);
    try {
      const organizationId = crypto.randomUUID();

      // 1. Create the organization (avoid SELECT here; user isn't a member yet)
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({ id: organizationId, name: orgName.trim() });

      if (orgError) throw orgError;

      // 2. Add user as admin of the organization
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: user.id,
          role: "admin",
        });

      if (memberError) throw memberError;

      // 3. Update (or create) profile with organization
      const { data: updatedProfile, error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ organization_id: organizationId })
        .eq("user_id", user.id)
        .select("user_id")
        .maybeSingle();

      if (profileUpdateError) throw profileUpdateError;

      if (!updatedProfile) {
        const fallbackName =
          profileName?.trim() ||
          (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
          (user.email ? user.email.split("@")[0] : "Usuário");

        const { error: profileInsertError } = await supabase.from("profiles").insert({
          user_id: user.id,
          name: fallbackName,
          email: user.email ?? null,
          organization_id: organizationId,
        });

        if (profileInsertError) throw profileInsertError;
      }

      // 4. Create default ticket columns
      const defaultColumns = [
        { name: "Em Atendimento", color: "#EC4899", position: 0, organization_id: organizationId },
        { name: "Proposta Enviada", color: "#06B6D4", position: 1, organization_id: organizationId },
        { name: "Follow Up", color: "#F97316", position: 2, organization_id: organizationId },
        { name: "Implantação", color: "#3B82F6", position: 3, organization_id: organizationId },
        { name: "Concluído", color: "#22C55E", position: 4, organization_id: organizationId },
      ];
      await supabase.from("ticket_columns").insert(defaultColumns);

      // 5. Create default departments
      const defaultDepartments = [
        { name: "Comercial", color: "#3B82F6", organization_id: organizationId },
        { name: "Suporte", color: "#8B5CF6", organization_id: organizationId },
        { name: "Financeiro", color: "#22C55E", organization_id: organizationId },
      ];
      await supabase.from("departments").insert(defaultDepartments);

      // 6. Create default tags
      const defaultTags = [
        { name: "Novo Cliente", color: "#22C55E", organization_id: organizationId },
        { name: "Prioridade Alta", color: "#EF4444", organization_id: organizationId },
        { name: "VIP", color: "#F59E0B", organization_id: organizationId },
      ];
      await supabase.from("tags").insert(defaultTags);

      await refreshProfile();
      
      toast({ title: "Organização criada com sucesso!" });
      setOrgName("");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast({
        title: "Erro ao criar organização",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          name: profileName.trim(),
          phone: profilePhone.trim() || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      
      await refreshProfile();
      toast({ title: "Perfil atualizado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas configurações de conta e organização</p>
      </div>

      <Tabs defaultValue={organization ? "profile" : "organization"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="organization" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organização
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Atualize suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Nome</Label>
                    <Input
                      id="profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">E-mail</Label>
                    <Input
                      id="profile-email"
                      value={profile?.email || user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Telefone</Label>
                    <Input
                      id="profile-phone"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization" className="space-y-4">
          {organization ? (
            <Card>
              <CardHeader>
                <CardTitle>Sua Organização</CardTitle>
                <CardDescription>Informações da organização atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome da Organização</Label>
                    <Input value={organization.name} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Seu Papel</Label>
                    <Input 
                      value={member?.role === "admin" ? "Administrador" : "Membro"} 
                      disabled 
                      className="bg-muted" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Criada em</Label>
                    <Input 
                      value={new Date(organization.created_at).toLocaleDateString("pt-BR")} 
                      disabled 
                      className="bg-muted" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Criar Organização</CardTitle>
                <CardDescription>
                  Você ainda não pertence a uma organização. Crie uma nova para começar a usar o sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrganization} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nome da Organização</Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Minha Empresa"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Organização
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>Configurações de segurança da conta</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Funcionalidades de segurança como alteração de senha e autenticação em dois fatores estarão disponíveis em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
