import { useState } from "react";
import { useTags } from "@/hooks/useTags";
import { useAuth } from "@/contexts/AuthContext";
import { TagFormDialog } from "@/components/tags/TagFormDialog";
import { TagDeleteDialog } from "@/components/tags/TagDeleteDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Tags as TagsIcon, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database["public"]["Tables"]["tags"]["Row"];

export default function Tags() {
  const { member } = useAuth();
  const { tags, isLoading, createTag, updateTag, deleteTag } = useTags();
  
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const isAdmin = member?.role === "admin";

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedTag(null);
    setFormOpen(true);
  };

  const handleEdit = (tag: Tag) => {
    setSelectedTag(tag);
    setFormOpen(true);
  };

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag);
    setDeleteOpen(true);
  };

  const handleFormSubmit = async (data: { name: string; color: string }) => {
    if (selectedTag) {
      await updateTag.mutateAsync({ id: selectedTag.id, ...data });
    } else {
      await createTag.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTag) {
      await deleteTag.mutateAsync(selectedTag.id);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground">
            Gerencie as tags para organizar seus contatos e tickets
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tag
        </Button>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Lista de Tags</CardTitle>
              <CardDescription>
                {tags.length} tag{tags.length !== 1 ? "s" : ""} cadastrada{tags.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <TagsIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              {search ? (
                <>
                  <p className="text-muted-foreground">Nenhuma tag encontrada para "{search}"</p>
                  <Button variant="link" onClick={() => setSearch("")} className="mt-2">
                    Limpar busca
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-4">
                    Você ainda não tem nenhuma tag cadastrada
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeira tag
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag</TableHead>
                    <TableHead className="hidden sm:table-cell">Cor</TableHead>
                    <TableHead className="hidden md:table-cell">Criada em</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium"
                          style={{ backgroundColor: tag.color }}
                        >
                          {tag.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="text-sm text-muted-foreground font-mono">
                            {tag.color.toUpperCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {new Date(tag.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(tag)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {isAdmin && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(tag)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <TagFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        tag={selectedTag}
        onSubmit={handleFormSubmit}
        isLoading={createTag.isPending || updateTag.isPending}
      />

      <TagDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        tag={selectedTag}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteTag.isPending}
      />
    </div>
  );
}
