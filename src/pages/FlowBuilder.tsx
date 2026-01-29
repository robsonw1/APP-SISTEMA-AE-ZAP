import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Workflow, MoreVertical, Play, Pause, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatbotFlow {
  id: string;
  name: string;
  icon: string;
  segment: string;
  status: "active" | "inactive";
  triggersCount: number;
}

const mockFlows: ChatbotFlow[] = [
  { id: "1", icon: "🦷", name: "Clínica Odonto", segment: "Saúde", status: "active", triggersCount: 156 },
  { id: "2", icon: "🍔", name: "Hamburgueria", segment: "Alimentação", status: "active", triggersCount: 89 },
  { id: "3", icon: "💎", name: "Vendas Oi Fibra", segment: "Telecom", status: "inactive", triggersCount: 0 },
  { id: "4", icon: "🍕", name: "Pizzaria Express", segment: "Alimentação", status: "active", triggersCount: 234 },
  { id: "5", icon: "✈️", name: "Agência de Viagens", segment: "Turismo", status: "inactive", triggersCount: 12 },
  { id: "6", icon: "💅", name: "Clínica de Estética", segment: "Beleza", status: "active", triggersCount: 67 },
];

export default function FlowBuilder() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">FlowBuilder</h1>
          <p className="text-muted-foreground">Crie e gerencie seus chatbots automatizados</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          ADICIONAR FLUXO
        </Button>
      </div>

      {/* Info Banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
              <Workflow className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Editor Visual de Fluxos
              </p>
              <p className="text-sm text-muted-foreground">
                Arraste e solte blocos para criar conversas automatizadas poderosas
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flows Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Meus Fluxos</CardTitle>
          <CardDescription>
            {mockFlows.filter((f) => f.status === "active").length} fluxos ativos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Segmento</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ativações</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {mockFlows.map((flow) => (
                  <tr key={flow.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{flow.icon}</span>
                        <span className="font-medium text-foreground">{flow.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{flow.segment}</td>
                    <td className="p-4">
                      <Badge
                        className={cn(
                          flow.status === "active"
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {flow.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{flow.triggersCount}</td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          {flow.status === "active" ? (
                            <Pause className="h-4 w-4 text-warning" />
                          ) : (
                            <Play className="h-4 w-4 text-success" />
                          )}
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
