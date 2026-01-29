import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Star,
  X,
  ArrowLeft,
  RefreshCw,
  Calendar,
  Check,
  Flag,
  Trash2,
  Smile,
  Mic,
  Image,
  FileText,
  Film,
  Music,
  PanelRightClose,
  PanelRightOpen,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketWithRelations } from "@/hooks/useTickets";
import type { Database } from "@/integrations/supabase/types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

interface ChatAreaProps {
  ticket: TicketWithRelations;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  onAccept?: () => void;
  onClose?: () => void;
  onTransfer?: () => void;
  onFinish?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
  onSchedule?: () => void;
  showContactSidebar: boolean;
  onToggleContactSidebar: () => void;
  currentUserId?: string;
  isSending?: boolean;
}

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const isContact = message.sender_type === "contact";
  const isBot = message.sender_type === "bot";

  return (
    <div className={cn("flex mb-3", isContact ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3 shadow-sm",
          isContact && "bg-card border",
          isBot && "bg-warning/10 border border-warning/30",
          !isContact && !isBot && "bg-success/20"
        )}
      >
        {isBot && (
          <div className="flex items-center gap-1.5 mb-2 text-xs font-medium text-warning">
            <Bot className="h-3.5 w-3.5" />
            Bot Automático
          </div>
        )}
        
        {/* Media preview */}
        {message.media_url && (
          <div className="mb-2">
            {message.media_type?.startsWith("image") ? (
              <img
                src={message.media_url}
                alt="Anexo"
                className="rounded-md max-w-full max-h-64 object-cover"
              />
            ) : message.media_type?.startsWith("audio") ? (
              <audio controls className="max-w-full">
                <source src={message.media_url} />
              </audio>
            ) : message.media_type?.startsWith("video") ? (
              <video controls className="rounded-md max-w-full max-h-64">
                <source src={message.media_url} />
              </video>
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <FileText className="h-4 w-4" />
                Ver documento
              </a>
            )}
          </div>
        )}
        
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">
          {message.content}
        </p>
        
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-xs text-muted-foreground">
            {new Date(message.created_at).toLocaleTimeString("pt-BR", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </span>
          {!isContact && !isBot && (
            <span className={cn("text-xs", message.read ? "text-primary" : "text-muted-foreground")}>
              ✓✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChatArea({
  ticket,
  messages,
  isLoading,
  onSendMessage,
  onAccept,
  onClose,
  onTransfer,
  onFinish,
  onDelete,
  onBack,
  onSchedule,
  showContactSidebar,
  onToggleContactSidebar,
  currentUserId,
  isSending,
}: ChatAreaProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contactName = ticket.contact?.name || "Sem contato";
  const initials = contactName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isWaiting = ticket.status === "open" || ticket.status === "waiting";
  const isAssignedToMe = ticket.assigned_to === currentUserId;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    const content = messageInput.trim();
    setMessageInput("");
    await onSendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // For now, just show a toast - implement actual upload later
    console.log("File selected:", file);
    // TODO: Upload file and send message with media
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground truncate">{contactName}</h3>
              <span className="text-xs text-muted-foreground">#{ticket.id.slice(0, 6)}</span>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {ticket.assigned_member ? `Atribuído à: ${ticket.assigned_member.id.slice(0, 8)}` : "Não atribuído"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {isWaiting && onAccept && (
            <Button variant="default" size="sm" onClick={onAccept} className="gap-1.5">
              <Check className="h-4 w-4" />
              Aceitar
            </Button>
          )}
          
          {!isWaiting && (
            <>
              <Button variant="ghost" size="icon" onClick={onClose} title="Fechar">
                <X className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onTransfer} title="Transferir">
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onSchedule} title="Agendar">
                <Calendar className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onFinish} title="Finalizar">
                <Flag className="h-5 w-5 text-success" />
              </Button>
            </>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                Favoritar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={onToggleContactSidebar} title="Dados do contato">
            {showContactSidebar ? (
              <PanelRightClose className="h-5 w-5" />
            ) : (
              <PanelRightOpen className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 whatsapp-bg">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                <Skeleton className="h-16 w-64 rounded-lg" />
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Nenhuma mensagem ainda. Comece a conversa!</p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-3 border-t bg-card">
        <div className="flex items-center gap-2">
          {/* Attachment menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <Paperclip className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Image className="h-4 w-4 mr-2" />
                Imagem
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Film className="h-4 w-4 mr-2" />
                Vídeo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <FileText className="h-4 w-4 mr-2" />
                Documento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Music className="h-4 w-4 mr-2" />
                Áudio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          />

          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Smile className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Input
            placeholder="Digite uma mensagem"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isSending}
          />

          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Mic className="h-5 w-5 text-muted-foreground" />
          </Button>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!messageInput.trim() || isSending}
            className="flex-shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}