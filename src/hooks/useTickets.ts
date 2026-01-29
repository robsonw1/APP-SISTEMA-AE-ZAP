import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type TicketInsert = Database["public"]["Tables"]["tickets"]["Insert"];
type TicketColumn = Database["public"]["Tables"]["ticket_columns"]["Row"];

export interface TicketWithRelations extends Ticket {
  contact: Database["public"]["Tables"]["contacts"]["Row"] | null;
  assigned_member: Database["public"]["Tables"]["organization_members"]["Row"] | null;
  tags: Array<{ tag: Database["public"]["Tables"]["tags"]["Row"] }>;
}

export function useTickets() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["tickets", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          contact:contacts(*),
          assigned_member:organization_members!tickets_assigned_to_fkey(*),
          tags:ticket_tags(tag:tags(*))
        `)
        .eq("organization_id", organization.id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as TicketWithRelations[];
    },
    enabled: !!organization?.id,
  });

  const columnsQuery = useQuery({
    queryKey: ["ticket_columns", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("ticket_columns")
        .select("*")
        .eq("organization_id", organization.id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as TicketColumn[];
    },
    enabled: !!organization?.id,
  });

  const createTicket = useMutation({
    mutationFn: async (ticket: Omit<TicketInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("No organization");

      const { data, error } = await supabase
        .from("tickets")
        .insert({ ...ticket, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Ticket criado!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar ticket", description: error.message, variant: "destructive" });
    },
  });

  const updateTicket = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Ticket> & { id: string }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const moveTicket = useMutation({
    mutationFn: async ({ ticketId, columnId, position }: { ticketId: string; columnId: string; position: number }) => {
      const { error } = await supabase
        .from("tickets")
        .update({ column_id: columnId, position })
        .eq("id", ticketId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tickets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      toast({ title: "Ticket excluído!" });
    },
  });

  return {
    tickets: ticketsQuery.data ?? [],
    columns: columnsQuery.data ?? [],
    isLoading: ticketsQuery.isLoading || columnsQuery.isLoading,
    createTicket,
    updateTicket,
    moveTicket,
    deleteTicket,
  };
}
