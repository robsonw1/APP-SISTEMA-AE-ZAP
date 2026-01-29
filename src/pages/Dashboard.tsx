import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Clock,
  Users,
  CheckCircle,
  UserCheck,
  Inbox,
  Send,
  Timer,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboardMetrics, useRecentTickets, useTeamPerformance } from "@/hooks/useDashboardMetrics";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "cyan";
  isLoading?: boolean;
}

function MetricCard({ title, value, icon: Icon, trend, color = "blue", isLoading }: MetricCardProps) {
  const colorVariants = {
    blue: "bg-blue-500",
    green: "bg-success",
    yellow: "bg-warning",
    red: "bg-destructive",
    purple: "bg-tag-purple",
    cyan: "bg-tag-cyan",
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-1 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive"
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-lg",
            colorVariants[color]
          )}>
            <Icon className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTicketsTable() {
  const { data: tickets, isLoading } = useRecentTickets();

  const statusColors: Record<string, string> = {
    "Em Atendimento": "bg-tag-pink text-primary-foreground",
    "Aguardando": "bg-warning text-warning-foreground",
    "Concluído": "bg-success text-success-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Atendimentos Recentes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contato</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Fila</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 text-sm font-medium text-muted-foreground">Tempo</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3"><Skeleton className="h-5 w-32" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-28" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                  </tr>
                ))
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <span className="font-medium text-foreground">{ticket.contact_name}</span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{ticket.department}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        statusColors[ticket.status] || "bg-muted"
                      )}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{ticket.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Nenhum atendimento recente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamPerformanceCard() {
  const { data: teamMembers, isLoading } = useTeamPerformance();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Desempenho da Equipe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="w-24 h-2 rounded-full" />
            </div>
          ))
        ) : teamMembers && teamMembers.length > 0 ? (
          teamMembers.map((member, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {member.avatar}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-sm text-muted-foreground">
                  {member.tickets} tickets • Média: {member.avgTime}
                </p>
              </div>
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min((member.tickets / 25) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Nenhum membro da equipe
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useDashboardMetrics();

  const metricCards = [
    { title: "Atendendo", value: metrics?.attending ?? 0, icon: MessageSquare, color: "blue" as const },
    { title: "Aguardando", value: metrics?.waiting ?? 0, icon: Clock, color: "yellow" as const },
    { title: "Online", value: metrics?.teamOnline ?? 0, icon: Users, color: "green" as const },
    { title: "Concluídos Hoje", value: metrics?.closedToday ?? 0, icon: CheckCircle, color: "green" as const },
    { title: "Contatos", value: metrics?.totalContacts ?? 0, icon: UserCheck, color: "purple" as const },
    { title: "Recebidas", value: metrics?.messagesReceived ?? 0, icon: Inbox, color: "cyan" as const },
    { title: "Enviadas", value: metrics?.messagesSent ?? 0, icon: Send, color: "blue" as const },
    { title: "Fechados", value: metrics?.closed ?? 0, icon: Timer, color: "green" as const },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do seu atendimento</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.title} {...metric} isLoading={isLoading} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RecentTicketsTable />
        <TeamPerformanceCard />
      </div>
    </div>
  );
}
