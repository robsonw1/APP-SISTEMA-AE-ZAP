import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Clock,
  Search,
  Plus,
  Users,
  Eye,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TicketWithRelations } from "@/hooks/useTickets";

interface TicketListProps {
  tickets: TicketWithRelations[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  onCreateTicket: () => void;
  isLoading?: boolean;
}

function TicketListItem({
  ticket,
  isActive,
  onClick,
}: {
  ticket: TicketWithRelations;
  isActive: boolean;
  onClick: () => void;
}) {
  const contactName = ticket.contact?.name || "Sem contato";
  const initials = contactName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const phone = ticket.contact?.phone || "";

  // Format time
  const getTimeDisplay = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffMins < 1440) return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3 border-b cursor-pointer transition-all duration-200",
        "hover:bg-muted/50",
        isActive && "bg-primary/5 border-l-4 border-l-primary"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {ticket.status === "in_progress" && (
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {ticket.status === "in_progress" && (
                <Eye className="h-4 w-4 text-primary flex-shrink-0" />
              )}
              <span className="font-medium text-foreground truncate">{contactName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-muted-foreground">
                {getTimeDisplay(ticket.last_message_at)}
              </span>
              {ticket.unread_count > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-success text-success-foreground text-xs font-bold">
                  {ticket.unread_count > 99 ? "99+" : ticket.unread_count}
                </span>
              )}
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {phone && <span className="opacity-70">{phone} · </span>}
            {ticket.description || ticket.title}
          </p>
          
          {ticket.tags && ticket.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {ticket.tags.slice(0, 3).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: tag.color + "20", color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {ticket.tags.length > 3 && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                  +{ticket.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TicketList({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onCreateTicket,
  isLoading,
}: TicketListProps) {
  const [activeTab, setActiveTab] = useState<"attending" | "waiting">("attending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllTickets, setShowAllTickets] = useState(true);

  const attendingTickets = tickets.filter((t) => t.status === "in_progress");
  const waitingTickets = tickets.filter((t) => t.status === "open" || t.status === "waiting");

  const currentTickets = activeTab === "attending" ? attendingTickets : waitingTickets;

  const filteredTickets = currentTickets.filter((ticket) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      ticket.contact?.name?.toLowerCase().includes(query) ||
      ticket.contact?.phone?.toLowerCase().includes(query) ||
      ticket.title.toLowerCase().includes(query) ||
      ticket.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-80 flex-shrink-0 border-r flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 border-b space-y-3">
        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "attending" ? "default" : "secondary"}
            size="sm"
            className="flex-1 h-9"
            onClick={() => setActiveTab("attending")}
          >
            <MessageCircle className="h-4 w-4 mr-1.5" />
            ATENDENDO
            <Badge className="ml-1.5 h-5 min-w-5 px-1 bg-success/20 text-success hover:bg-success/20">
              {attendingTickets.length}
            </Badge>
          </Button>
          <Button
            variant={activeTab === "waiting" ? "default" : "secondary"}
            size="sm"
            className="flex-1 h-9"
            onClick={() => setActiveTab("waiting")}
          >
            <Clock className="h-4 w-4 mr-1.5" />
            AGUARDANDO
            <Badge className="ml-1.5 h-5 min-w-5 px-1 bg-warning/20 text-warning hover:bg-warning/20">
              {waitingTickets.length}
            </Badge>
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" className="h-8" onClick={onCreateTicket}>
            <Plus className="h-4 w-4 mr-1" />
            NOVO
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <Switch
              id="show-all"
              checked={showAllTickets}
              onCheckedChange={setShowAllTickets}
              className="scale-75"
            />
            <Label htmlFor="show-all" className="text-xs text-muted-foreground cursor-pointer">
              Todos
            </Label>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            className="pl-9 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Ticket List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTickets.length > 0 ? (
          filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              isActive={selectedTicketId === ticket.id}
              onClick={() => onSelectTicket(ticket.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Users className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">
              {searchQuery ? "Nenhuma conversa encontrada" : "Nenhum atendimento"}
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}