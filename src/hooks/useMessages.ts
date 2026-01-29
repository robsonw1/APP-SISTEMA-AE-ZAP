import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export function useMessages(ticketId: string | null) {
  const { member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ["messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!ticketId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!ticketId) return;

    const channel = supabase
      .channel(`messages:${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(["messages", ticketId], (old) => {
            if (!old) return [payload.new as Message];
            // Avoid duplicates
            if (old.find((m) => m.id === (payload.new as Message).id)) return old;
            return [...old, payload.new as Message];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ content, senderType }: { content: string; senderType: "user" | "contact" | "bot" }) => {
      if (!ticketId) throw new Error("No ticket selected");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          ticket_id: ticketId,
          content,
          sender_type: senderType,
          sender_id: senderType === "user" ? member?.id : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (error) => {
      toast({ title: "Erro ao enviar mensagem", description: error.message, variant: "destructive" });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!ticketId) return;

      // Mark all unread messages as read
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("ticket_id", ticketId)
        .eq("read", false);

      // Reset unread count on ticket
      await supabase
        .from("tickets")
        .update({ unread_count: 0 })
        .eq("id", ticketId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
    markAsRead,
  };
}
