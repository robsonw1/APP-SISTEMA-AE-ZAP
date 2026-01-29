import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, UserCog, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "supervisor" | "user";
  departments: string[];
  status: "online" | "offline" | "away";
  ticketsToday: number;
}

const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Carlos Silva",
    email: "carlos@aezap.com",
    role: "admin",
    departments: ["Comercial", "Suporte"],
    status: "online",
    ticketsToday: 23,
  },
  {
    id: "2",
    name: "Ana Costa",
    email: "ana@aezap.com",
    role: "supervisor",
    departments: ["Comercial"],
    status: "online",
    ticketsToday: 18,
  },
  {
    id: "3",
    name: "João Santos",
    email: "joao@aezap.com",
    role: "user",
    departments: ["Suporte"],
    status: "offline",
    ticketsToday: 15,
  },
  {
    id: "4",
    name: "Maria Lima",
    email: "maria@aezap.com",
    role: "user",
    departments: ["Financeiro"],
    status: "away",
    ticketsToday: 12,
  },
];

const roleConfig = {
  admin: { label: "Admin", color: "bg-primary text-primary-foreground", icon: Shield },
  supervisor: { label: "Supervisor", color: "bg-warning text-warning-foreground", icon: UserCog },
  user: { label: "Atendente", color: "bg-muted text-muted-foreground", icon: Users },
};

const statusConfig = {
  online: { label: "Online", color: "bg-success" },
  offline: { label: "Offline", color: "bg-muted-foreground" },
  away: { label: "Ausente", color: "bg-warning" },
};

export default function Team() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários da sua organização
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          ADICIONAR USUÁRIO
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-foreground">{mockTeam.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-2xl font-bold text-success">
              {mockTeam.filter((m) => m.status === "online").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ausentes</p>
            <p className="text-2xl font-bold text-warning">
              {mockTeam.filter((m) => m.status === "away").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {mockTeam.filter((m) => m.status === "offline").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockTeam.map((member) => {
          const role = roleConfig[member.role];
          const status = statusConfig[member.status];
          const RoleIcon = role.icon;

          return (
            <Card key={member.id} className="hover:shadow-card-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card",
                          status.color
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <Badge className={role.color}>
                    <RoleIcon className="h-3 w-3 mr-1" />
                    {role.label}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Departamentos</p>
                    <div className="flex flex-wrap gap-1">
                      {member.departments.map((dept) => (
                        <Badge key={dept} variant="secondary" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{member.ticketsToday}</span> tickets hoje
                    </p>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
