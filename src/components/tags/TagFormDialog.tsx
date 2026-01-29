import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database["public"]["Tables"]["tags"]["Row"];

const tagSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(50, "Nome deve ter no máximo 50 caracteres"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
});

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: Tag | null;
  onSubmit: (data: { name: string; color: string }) => Promise<void>;
  isLoading?: boolean;
}

const defaultColors = [
  "#22C55E", "#EF4444", "#F59E0B", "#3B82F6", 
  "#8B5CF6", "#EC4899", "#06B6D4", "#10B981",
];

export function TagFormDialog({ 
  open, 
  onOpenChange, 
  tag, 
  onSubmit, 
  isLoading 
}: TagFormDialogProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [errors, setErrors] = useState<{ name?: string; color?: string }>({});
  useEffect(() => {
    if (tag) {
      setName(tag.name);
      setColor(tag.color);
    } else {
      setName("");
      setColor("#3B82F6");
    }
    setErrors({});
  }, [tag, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = tagSchema.safeParse({ name, color });
    if (!result.success) {
      const fieldErrors: { name?: string; color?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "name") fieldErrors.name = err.message;
        if (err.path[0] === "color") fieldErrors.color = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const validatedData = { name: result.data.name, color: result.data.color };

    await onSubmit(validatedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tag ? "Editar Tag" : "Nova Tag"}</DialogTitle>
          <DialogDescription>
            {tag 
              ? "Edite os dados da tag abaixo." 
              : "Preencha os dados para criar uma nova tag."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Tag</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: VIP, Urgente, Novo"
              maxLength={50}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 flex-wrap">
                {defaultColors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${
                      color === c 
                        ? "ring-2 ring-offset-2 ring-primary scale-110" 
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 p-0 border-0 cursor-pointer"
              />
            </div>
            {errors.color && (
              <p className="text-sm text-destructive">{errors.color}</p>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-sm text-muted-foreground">Prévia:</span>
            <span
              className="px-3 py-1 text-sm font-medium rounded-full text-white"
              style={{ backgroundColor: color }}
            >
              {name || "Tag"}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tag ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
