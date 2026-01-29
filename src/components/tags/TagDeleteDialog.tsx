import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tag = Database["public"]["Tables"]["tags"]["Row"];

interface TagDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag: Tag | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function TagDeleteDialog({
  open,
  onOpenChange,
  tag,
  onConfirm,
  isLoading,
}: TagDeleteDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Tag</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a tag{" "}
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: tag?.color }}
            >
              {tag?.name}
            </span>
            ? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
