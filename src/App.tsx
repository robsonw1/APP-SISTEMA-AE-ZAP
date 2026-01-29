import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Chats from "./pages/Chats";
import Kanban from "./pages/Kanban";
import Contacts from "./pages/Contacts";
import Connections from "./pages/Connections";
import FlowBuilder from "./pages/FlowBuilder";
import LabAI from "./pages/LabAI";
import Team from "./pages/Team";
import Tags from "./pages/Tags";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Placeholder component for routes not yet implemented
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
      <span className="text-2xl">🚧</span>
    </div>
    <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
    <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected Routes with MainLayout */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/chats" element={<Chats />} />
              <Route path="/search" element={<PlaceholderPage title="Pesquisar" />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/kanban/overview" element={<PlaceholderPage title="Kanban Visão Geral" />} />
              <Route path="/kanban/departments" element={<PlaceholderPage title="Kanban Filas" />} />
              <Route path="/tags" element={<Tags />} />
              <Route path="/quick-responses" element={<PlaceholderPage title="Respostas Rápidas" />} />
              <Route path="/tasks" element={<PlaceholderPage title="Tarefas" />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/schedules" element={<PlaceholderPage title="Agendamentos" />} />
              <Route path="/internal-chat" element={<PlaceholderPage title="Chat Interno" />} />
              <Route path="/help" element={<PlaceholderPage title="Central de Ajuda" />} />
              <Route path="/campaigns" element={<PlaceholderPage title="Campanhas" />} />
              <Route path="/lists" element={<PlaceholderPage title="Criar Listas" />} />
              <Route path="/campaigns/config" element={<PlaceholderPage title="Configurar Campanhas" />} />
              <Route path="/ratings" element={<PlaceholderPage title="Avaliações" />} />
              <Route path="/connections" element={<Connections />} />
              <Route path="/chatbot" element={<PlaceholderPage title="Filas & Chatbot" />} />
              <Route path="/lab-ai" element={<LabAI />} />
              <Route path="/flowbuilder" element={<FlowBuilder />} />
              <Route path="/billing" element={<PlaceholderPage title="Financeiro" />} />
              <Route path="/files" element={<PlaceholderPage title="Gerenciador de Arquivos" />} />
              <Route path="/team" element={<Team />} />
              <Route path="/api" element={<PlaceholderPage title="API" />} />
              <Route path="/webhooks" element={<PlaceholderPage title="Webhooks | Triggers" />} />
              <Route path="/settings" element={<PlaceholderPage title="Configurações" />} />
              <Route path="/integrations" element={<PlaceholderPage title="Integrações" />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
