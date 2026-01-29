import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppConnection {
  id: string;
  organization_id: string;
  instance_name: string;
  display_name: string;
  phone_number: string | null;
  status: "connected" | "disconnected" | "qr_code" | "connecting";
  is_default: boolean;
  auto_close_tickets: boolean;
  qr_code: string | null;
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppConnections() {
  const { organization, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectionsQuery = useQuery({
    queryKey: ["whatsapp_connections", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("whatsapp_connections" as never)
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as WhatsAppConnection[];
    },
    enabled: !!organization?.id,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
  });

  const callEvolutionAPI = async (action: string, body: Record<string, unknown>) => {
    const response = await supabase.functions.invoke("evolution-api", {
      body: { action, ...body },
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || "Erro ao conectar com a API");
    }

    return response.data;
  };

  const createConnection = useMutation({
    mutationFn: async (displayName: string) => {
      if (!organization?.id) throw new Error("No organization");

      const instanceName = `${organization.id.slice(0, 8)}_${Date.now()}`;
      
      return callEvolutionAPI("create-instance", {
        instanceName,
        organizationId: organization.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Conexão criada! Escaneie o QR Code." });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar conexão", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const getQRCode = useMutation({
    mutationFn: async (connection: WhatsAppConnection) => {
      return callEvolutionAPI("get-qrcode", {
        instanceName: connection.instance_name,
        connectionId: connection.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao obter QR Code", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const checkStatus = useMutation({
    mutationFn: async (connection: WhatsAppConnection) => {
      return callEvolutionAPI("check-status", {
        instanceName: connection.instance_name,
        connectionId: connection.id,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      if (data.status === "connected") {
        toast({ title: "WhatsApp conectado com sucesso!" });
      }
    },
  });

  const disconnect = useMutation({
    mutationFn: async (connection: WhatsAppConnection) => {
      return callEvolutionAPI("disconnect", {
        instanceName: connection.instance_name,
        connectionId: connection.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Desconectado com sucesso" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao desconectar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (connection: WhatsAppConnection) => {
      return callEvolutionAPI("delete-instance", {
        instanceName: connection.instance_name,
        connectionId: connection.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Conexão excluída" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateConnection = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhatsAppConnection> & { id: string }) => {
      const { data, error } = await supabase
        .from("whatsapp_connections" as never)
        .update(updates as never)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as WhatsAppConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Conexão atualizada" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const setDefault = useMutation({
    mutationFn: async (connectionId: string) => {
      if (!organization?.id) throw new Error("No organization");

      // Remove default from all
      await supabase
        .from("whatsapp_connections" as never)
        .update({ is_default: false } as never)
        .eq("organization_id", organization.id);

      // Set new default
      const { error } = await supabase
        .from("whatsapp_connections" as never)
        .update({ is_default: true } as never)
        .eq("id", connectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Conexão padrão atualizada" });
    },
  });

  const restartAll = useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization");
      return callEvolutionAPI("restart-all", { organizationId: organization.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp_connections"] });
      toast({ title: "Reiniciando conexões..." });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao reiniciar", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const sendMessage = async (
    connectionId: string, 
    phone: string, 
    message: string,
    mediaUrl?: string,
    mediaType?: string
  ) => {
    const connection = connectionsQuery.data?.find(c => c.id === connectionId);
    if (!connection) throw new Error("Connection not found");

    return callEvolutionAPI("send-message", {
      instanceName: connection.instance_name,
      phone,
      message,
      mediaUrl,
      mediaType,
    });
  };

  return {
    connections: connectionsQuery.data ?? [],
    isLoading: connectionsQuery.isLoading,
    createConnection,
    getQRCode,
    checkStatus,
    disconnect,
    deleteConnection,
    updateConnection,
    setDefault,
    restartAll,
    sendMessage,
  };
}