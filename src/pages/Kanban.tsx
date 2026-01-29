import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Eye, Plus, GripVertical } from "lucide-react";
import { useTickets, TicketWithRelations } from "@/hooks/useTickets";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate } from "react-router-dom";

interface KanbanCardProps {
  ticket: TicketWithRelations;
  color: string;
  isDragging?: boolean;
}

function KanbanCard({ ticket, color, isDragging }: KanbanCardProps) {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: color,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleViewTicket = () => {
    navigate(`/chats?ticket=${ticket.id}`);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-card-hover transition-shadow border-l-4 bg-card"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-foreground">
          {ticket.contact?.name || "Sem contato"}
        </span>
        <span className="text-xs text-muted-foreground">#{ticket.id.slice(0, 6)}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {ticket.title}
      </p>
      {ticket.tags && ticket.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {ticket.tags.slice(0, 2).map(({ tag }) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs"
              style={{ backgroundColor: tag.color + "20", color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}
      <Button
        className="w-full bg-success hover:bg-success/90 text-success-foreground"
        size="sm"
        onClick={handleViewTicket}
      >
        <Eye className="h-4 w-4 mr-2" />
        Ver Ticket
      </Button>
    </Card>
  );
}

function DragOverlayCard({ ticket, color }: { ticket: TicketWithRelations; color: string }) {
  return (
    <Card
      className="p-4 shadow-xl border-l-4 bg-card rotate-3"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-foreground">
          {ticket.contact?.name || "Sem contato"}
        </span>
        <span className="text-xs text-muted-foreground">#{ticket.id.slice(0, 6)}</span>
      </div>
      <p className="text-sm text-muted-foreground">{ticket.title}</p>
    </Card>
  );
}

export default function Kanban() {
  const navigate = useNavigate();
  const { tickets, columns, isLoading, moveTicket } = useTickets();
  const [activeTicket, setActiveTicket] = useState<TicketWithRelations | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = tickets.find((t) => t.id === event.active.id);
    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (!ticket) return;

    // Check if dropped on a column
    const targetColumn = columns.find((c) => c.id === over.id);
    if (targetColumn && ticket.column_id !== targetColumn.id) {
      moveTicket.mutate({
        ticketId,
        columnId: targetColumn.id,
        position: 0,
      });
      return;
    }

    // Check if dropped on another ticket
    const targetTicket = tickets.find((t) => t.id === over.id);
    if (targetTicket && targetTicket.column_id) {
      const columnTickets = tickets.filter((t) => t.column_id === targetTicket.column_id);
      const targetIndex = columnTickets.findIndex((t) => t.id === targetTicket.id);
      
      moveTicket.mutate({
        ticketId,
        columnId: targetTicket.column_id,
        position: targetIndex,
      });
    }
  };

  const getColumnColor = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    return column?.color || "#3B82F6";
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-4 h-full">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-80 flex-shrink-0 bg-muted/50 rounded-lg p-4">
              <Skeleton className="h-12 w-full mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kanban - Pipeline de Vendas</h1>
          <p className="text-muted-foreground">Arraste os tickets entre as colunas para atualizar o status</p>
        </div>
        <Button onClick={() => navigate("/chats")}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Ticket
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => {
              const columnTickets = tickets.filter((t) => t.column_id === column.id);

              return (
                <div
                  key={column.id}
                  className="w-80 flex-shrink-0 bg-muted/50 rounded-lg p-4 flex flex-col"
                >
                  {/* Column Header */}
                  <div
                    className="flex items-center justify-between mb-4 p-3 rounded-lg"
                    style={{ backgroundColor: column.color }}
                  >
                    <span className="font-semibold text-white">{column.name}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm text-white font-medium">
                      {columnTickets.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <SortableContext
                    items={columnTickets.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 space-y-3 overflow-y-auto min-h-[100px]">
                      {columnTickets.length > 0 ? (
                        columnTickets.map((ticket) => (
                          <KanbanCard
                            key={ticket.id}
                            ticket={ticket}
                            color={column.color || "#3B82F6"}
                            isDragging={activeTicket?.id === ticket.id}
                          />
                        ))
                      ) : (
                        <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg">
                          <p className="text-sm text-muted-foreground">Nenhum ticket</p>
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTicket && (
            <DragOverlayCard
              ticket={activeTicket}
              color={getColumnColor(activeTicket.column_id || "")}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
