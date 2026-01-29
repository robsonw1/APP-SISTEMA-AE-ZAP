import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Search,
  Kanban,
  BarChart3,
  Layers,
  Tags,
  Zap,
  CheckSquare,
  Users,
  Calendar,
  MessagesSquare,
  HelpCircle,
  Megaphone,
  ListPlus,
  Settings,
  Star,
  Plug,
  Bot,
  Brain,
  Workflow,
  DollarSign,
  FolderOpen,
  UserCog,
  Link2,
  Webhook,
  Puzzle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Chats", path: "/chats" },
  { icon: Search, label: "Pesquisar", path: "/search" },
  { icon: Kanban, label: "Kanban", path: "/kanban" },
  { icon: BarChart3, label: "Kanban Visão Geral", path: "/kanban/overview" },
  { icon: Layers, label: "Kanban Filas", path: "/kanban/departments" },
  { icon: Tags, label: "Tags", path: "/tags" },
  { icon: Zap, label: "Respostas Rápidas", path: "/quick-responses" },
  { icon: CheckSquare, label: "Tarefas", path: "/tasks" },
  { icon: Users, label: "Contatos", path: "/contacts" },
  { icon: Calendar, label: "Agendamentos", path: "/schedules" },
  { icon: MessagesSquare, label: "Chat Interno", path: "/internal-chat" },
  { icon: HelpCircle, label: "Central de Ajuda", path: "/help" },
  { icon: Megaphone, label: "Campanhas", path: "/campaigns" },
  { icon: ListPlus, label: "Criar Listas", path: "/lists" },
  { icon: Settings, label: "Configurar Campanhas", path: "/campaigns/config" },
  { icon: Star, label: "Avaliações", path: "/ratings" },
  { icon: Plug, label: "Conexões", path: "/connections" },
  { icon: Bot, label: "Filas & Chatbot", path: "/chatbot" },
  { icon: Brain, label: "Lab.AI", path: "/lab-ai", badge: "PRO" },
  { icon: Workflow, label: "FlowBuilder Nativo", path: "/flowbuilder" },
  { icon: DollarSign, label: "Financeiro", path: "/billing" },
  { icon: FolderOpen, label: "Gerenciador de Arquivos", path: "/files" },
  { icon: UserCog, label: "Equipe", path: "/team" },
  { icon: Link2, label: "API", path: "/api" },
  { icon: Webhook, label: "Webhooks | Triggers", path: "/webhooks" },
  { icon: Settings, label: "Configurações", path: "/settings" },
  { icon: Puzzle, label: "Integrações", path: "/integrations" },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "fixed left-0 top-14 bottom-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Content */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-2">
        <ul className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent",
                        isActive && "bg-sidebar-accent border-l-4 border-sidebar-primary ml-0 pl-2",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                      {!collapsed && (
                        <>
                          <span className={cn("text-sm font-medium flex-1", isActive && "text-sidebar-primary")}>
                            {item.label}
                          </span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sidebar-primary text-sidebar-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="font-medium">
                      {item.label}
                      {item.badge && ` (${item.badge})`}
                    </TooltipContent>
                  )}
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-sidebar-border hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
