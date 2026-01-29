import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database["public"]["Tables"]["tags"]["Row"];
type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
type TagUpdate = Database["public"]["Tables"]["tags"]["Update"];

export function useTags() {
  const { organization } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tagsQuery = useQuery({
    queryKey: ["tags", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("organization_id", organization.id)
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Tag[];
    },
    enabled: !!organization?.id,
  });

  const createTag = useMutation({
    mutationFn: async (tag: Omit<TagInsert, "organization_id">) => {
      if (!organization?.id) throw new Error("Nenhuma organização encontrada");

      const { data, error } = await supabase
        .from("tags")
        .insert({ ...tag, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag criada com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao criar tag", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ id, ...updates }: TagUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("tags")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar tag", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      toast({ title: "Tag excluída com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao excluir tag", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  return {
    tags: tagsQuery.data ?? [],
    isLoading: tagsQuery.isLoading,
    createTag,
    updateTag,
    deleteTag,
  };
}
