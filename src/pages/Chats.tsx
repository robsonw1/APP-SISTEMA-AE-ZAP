import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTickets, TicketWithRelations } from "@/hooks/useTickets";
import { useMessages } from "@/hooks/useMessages";
import { useContacts } from "@/hooks/useContacts";
import { useAuth } from "@/contexts/AuthContext";
import { TicketList } from "@/components/chat/TicketList";
import { ChatArea } from "@/components/chat/ChatArea";
import { ContactSidebar } from "@/components/chat/ContactSidebar";
import { useWhatsAppConnections } from "@/hooks/useWhatsAppConnections";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Chats() {
  const [searchParams] = useSearchParams();
  const { member } = useAuth();
  const { toast } = useToast();
  const { 
    tickets, 
    columns, 
    isLoading: ticketsLoading, 
    createTicket,
    updateTicket,
    deleteTicket 
  } = useTickets();
  const { updateContact } = useContacts();
  const { connections, sendMessage: sendWhatsAppMessage } = useWhatsAppConnections();
  
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showContactSidebar, setShowContactSidebar] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const { 
    messages, 
    isLoading: messagesLoading, 
    sendMessage, 
    markAsRead 
  } = useMessages(selectedTicketId);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId);

  // Handle URL params to select ticket
  useEffect(() => {
    const ticketId = searchParams.get("ticket");
    if (ticketId && tickets.find((t) => t.id === ticketId)) {
      setSelectedTicketId(ticketId);
    }
  }, [searchParams, tickets]);

  // Mark messages as read when ticket is selected
  useEffect(() => {
    if (selectedTicketId && selectedTicket?.unread_count && selectedTicket.unread_count > 0) {
      markAsRead.mutate();
    }
  }, [selectedTicketId, selectedTicket?.unread_count]);

  const handleCreateTicket = async () => {
    const firstColumn = columns[0];
    await createTicket.mutateAsync({
      title: "Novo atendimento",
      column_id: firstColumn?.id,
      status: "open",
    });
  };

  const handleSendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!selectedTicketId || !selectedTicket) return;
    
    setIsSending(true);
    try {
      // Save message to database
      await sendMessage.mutateAsync({ 
        content, 
        senderType: "user" 
      });

      // Send via WhatsApp if we have a connection
      const connectionId = selectedTicket.whatsapp_connection_id;
      const phone = selectedTicket.contact?.phone;
      
      if (connectionId && phone) {
        try {
          await sendWhatsAppMessage(connectionId, phone, content, mediaUrl, mediaType);
        } catch (error) {
          console.error("Failed to send via WhatsApp:", error);
          toast({
            title: "Mensagem salva, mas falha no WhatsApp",
            description: "A mensagem foi salva mas não foi enviada pelo WhatsApp",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleAcceptTicket = async () => {
    if (!selectedTicketId || !member?.id) return;
    
    await updateTicket.mutateAsync({
      id: selectedTicketId,
      status: "in_progress",
      assigned_to: member.id,
    });
    
    toast({ title: "Ticket aceito!" });
  };

  const handleCloseTicket = async () => {
    if (!selectedTicketId) return;
    
    await updateTicket.mutateAsync({
      id: selectedTicketId,
      status: "waiting",
    });
  };

  const handleFinishTicket = async () => {
    if (!selectedTicketId) return;
    
    await updateTicket.mutateAsync({
      id: selectedTicketId,
      status: "closed",
    });
    
    setSelectedTicketId(null);
    toast({ title: "Ticket finalizado!" });
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicketId) return;
    
    await deleteTicket.mutateAsync(selectedTicketId);
    setSelectedTicketId(null);
  };

  const handleTransferTicket = () => {
    // TODO: Open transfer dialog
    toast({ title: "Transferência", description: "Em breve..." });
  };

  const handleScheduleTicket = () => {
    // TODO: Open schedule dialog
    toast({ title: "Agendamento", description: "Em breve..." });
  };

  const handleUpdateContact = async (updates: Record<string, unknown>) => {
    if (!selectedTicket?.contact?.id) return;
    
    await updateContact.mutateAsync({
      id: selectedTicket.contact.id,
      ...updates,
    });
  };

  const handleAddTag = async (tagId: string) => {
    if (!selectedTicketId) return;
    
    await supabase
      .from("ticket_tags")
      .insert({ ticket_id: selectedTicketId, tag_id: tagId });
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedTicketId) return;
    
    await supabase
      .from("ticket_tags")
      .delete()
      .eq("ticket_id", selectedTicketId)
      .eq("tag_id", tagId);
  };

  if (ticketsLoading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex bg-background rounded-lg border overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-8 w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex bg-background rounded-lg border overflow-hidden animate-fade-in">
      {/* Ticket List */}
      <TicketList
        tickets={tickets}
        selectedTicketId={selectedTicketId}
        onSelectTicket={setSelectedTicketId}
        onCreateTicket={handleCreateTicket}
        isLoading={ticketsLoading}
      />

      {/* Chat Area */}
      {selectedTicket ? (
        <>
          <ChatArea
            ticket={selectedTicket}
            messages={messages}
            isLoading={messagesLoading}
            onSendMessage={handleSendMessage}
            onAccept={handleAcceptTicket}
            onClose={handleCloseTicket}
            onTransfer={handleTransferTicket}
            onFinish={handleFinishTicket}
            onDelete={handleDeleteTicket}
            onSchedule={handleScheduleTicket}
            showContactSidebar={showContactSidebar}
            onToggleContactSidebar={() => setShowContactSidebar(!showContactSidebar)}
            currentUserId={member?.id}
            isSending={isSending}
          />

          {/* Contact Sidebar */}
          {showContactSidebar && (
            <ContactSidebar
              ticket={selectedTicket}
              onUpdateContact={handleUpdateContact}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Selecione uma conversa para começar</p>
          </div>
        </div>
      )}
    </div>
  );
}