import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardMetrics {
  attending: number;
  waiting: number;
  closed: number;
  closedToday: number;
  totalContacts: number;
  messagesReceived: number;
  messagesSent: number;
  teamOnline: number;
}

export function useDashboardMetrics() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["dashboard_metrics", organization?.id],
    queryFn: async (): Promise<DashboardMetrics> => {
      if (!organization?.id) {
        return {
          attending: 0,
          waiting: 0,
          closed: 0,
          closedToday: 0,
          totalContacts: 0,
          messagesReceived: 0,
          messagesSent: 0,
          teamOnline: 0,
        };
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch tickets by status
      const { data: tickets } = await supabase
        .from("tickets")
        .select("status, updated_at")
        .eq("organization_id", organization.id);

      const attending = tickets?.filter((t) => t.status === "in_progress").length ?? 0;
      const waiting = tickets?.filter((t) => t.status === "waiting" || t.status === "open").length ?? 0;
      const closed = tickets?.filter((t) => t.status === "closed").length ?? 0;
      const closedToday = tickets?.filter((t) => {
        if (t.status !== "closed") return false;
        const updatedAt = new Date(t.updated_at);
        return updatedAt >= today;
      }).length ?? 0;

      // Fetch contacts count
      const { count: contactsCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      // Fetch messages
      const { data: messages } = await supabase
        .from("messages")
        .select("sender_type, ticket_id")
        .in("ticket_id", (
          await supabase
            .from("tickets")
            .select("id")
            .eq("organization_id", organization.id)
        ).data?.map((t) => t.id) ?? []);

      const messagesReceived = messages?.filter((m) => m.sender_type === "contact").length ?? 0;
      const messagesSent = messages?.filter((m) => m.sender_type === "user").length ?? 0;

      // Fetch team members
      const { count: teamCount } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      return {
        attending,
        waiting,
        closed,
        closedToday,
        totalContacts: contactsCount ?? 0,
        messagesReceived,
        messagesSent,
        teamOnline: teamCount ?? 0,
      };
    },
    enabled: !!organization?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export interface RecentTicket {
  id: string;
  contact_name: string;
  department: string;
  status: string;
  time: string;
}

export function useRecentTickets() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["recent_tickets", organization?.id],
    queryFn: async (): Promise<RecentTicket[]> => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          status,
          updated_at,
          contact:contacts(name),
          department:departments(name)
        `)
        .eq("organization_id", organization.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      return data.map((ticket) => {
        const updatedAt = new Date(ticket.updated_at);
        const now = new Date();
        const diffMs = now.getTime() - updatedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        let time: string;
        if (diffMins < 60) {
          time = `${diffMins} min`;
        } else {
          const hours = Math.floor(diffMins / 60);
          time = `${hours}h ${diffMins % 60}min`;
        }

        const statusMap: Record<string, string> = {
          open: "Aguardando",
          in_progress: "Em Atendimento",
          waiting: "Aguardando",
          closed: "Concluído",
        };

        return {
          id: ticket.id.slice(0, 8),
          contact_name: (ticket.contact as any)?.name ?? "Desconhecido",
          department: (ticket.department as any)?.name ?? "Geral",
          status: statusMap[ticket.status] ?? ticket.status,
          time,
        };
      });
    },
    enabled: !!organization?.id,
  });
}

export interface TeamMemberPerformance {
  name: string;
  avatar: string;
  tickets: number;
  avgTime: string;
}

export function useTeamPerformance() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["team_performance", organization?.id],
    queryFn: async (): Promise<TeamMemberPerformance[]> => {
      if (!organization?.id) return [];

      const { data: members } = await supabase
        .from("organization_members")
        .select(`
          id,
          profiles(name)
        `)
        .eq("organization_id", organization.id);

      if (!members) return [];

      const performance = await Promise.all(
        members.map(async (member) => {
          const { count } = await supabase
            .from("tickets")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", member.id);

          const name = (member.profiles as any)?.name ?? "Sem nome";
          const initials = name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return {
            name,
            avatar: initials,
            tickets: count ?? 0,
            avgTime: `${Math.floor(Math.random() * 10) + 3}min`, // Placeholder for now
          };
        })
      );

      return performance.sort((a, b) => b.tickets - a.tickets).slice(0, 4);
    },
    enabled: !!organization?.id,
  });
}
