import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Brain, Search, Bot, Sparkles, Zap } from "lucide-react";

export default function LabAI() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              Lab.AI
              <Badge className="bg-primary text-primary-foreground">PRO</Badge>
            </h1>
            <p className="text-muted-foreground">Crie agentes de IA personalizados</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Agente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquise por nome, descrição ou id do agente"
          className="pl-9"
        />
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary mb-4">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Atendimento Inteligente</h3>
            <p className="text-sm text-muted-foreground">
              Seus agentes respondem 24/7 com base no contexto do seu negócio
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-success mb-4">
              <Sparkles className="h-6 w-6 text-success-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Treinamento Personalizado</h3>
            <p className="text-sm text-muted-foreground">
              Ensine seu agente com FAQs, documentos e URLs do seu negócio
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-warning mb-4">
              <Zap className="h-6 w-6 text-warning-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Ações Automatizadas</h3>
            <p className="text-sm text-muted-foreground">
              Transfira para humanos ou execute fluxos automaticamente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted mx-auto mb-6">
              <Bot className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum agente criado até o momento!
            </h3>
            <p className="text-muted-foreground mb-6">
              Crie seu primeiro agente de IA e comece a automatizar seus atendimentos com inteligência artificial
            </p>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Agente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
