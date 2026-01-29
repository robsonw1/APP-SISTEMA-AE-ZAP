import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  Trash2,
  MoreVertical,
  Smartphone,
  Loader2,
  Check,
  ArrowRightLeft,
  XCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWhatsAppConnections, WhatsAppConnection } from "@/hooks/useWhatsAppConnections";

function ConnectionCard({ 
  connection, 
  onConnect,
  onDisconnect,
  onDelete,
  onSetDefault,
  onUpdate,
  isPolling,
}: { 
  connection: WhatsAppConnection;
  onConnect: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
  onUpdate: (updates: Partial<WhatsAppConnection>) => void;
  isPolling?: boolean;
}) {
  const statusConfig = {
    connected: {
      label: "Conectado",
      color: "bg-success text-success-foreground",
      icon: Wifi,
    },
    disconnected: {
      label: "Desconectado",
      color: "bg-destructive text-destructive-foreground",
      icon: WifiOff,
    },
    qr_code: {
      label: "Aguardando QR Code",
      color: "bg-warning text-warning-foreground",
      icon: QrCode,
    },
    connecting: {
      label: "Conectando...",
      color: "bg-info text-info-foreground",
      icon: Loader2,
    },
  };

  const status = statusConfig[connection.status] || statusConfig.disconnected;
  const StatusIcon = status.icon;

  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg",
              connection.status === "connected" ? "bg-success/10" : "bg-muted"
            )}>
              <Smartphone className={cn(
                "h-6 w-6",
                connection.status === "connected" ? "text-success" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                {connection.display_name}
                {connection.is_default && (
                  <Badge variant="secondary" className="text-xs">Padrão</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {connection.phone_number || connection.instance_name}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!connection.is_default && (
                <DropdownMenuItem onClick={onSetDefault}>
                  <Check className="h-4 w-4 mr-2" />
                  Definir como padrão
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onUpdate({ auto_close_tickets: !connection.auto_close_tickets })}>
                <Settings className="h-4 w-4 mr-2" />
                {connection.auto_close_tickets ? "Desativar" : "Ativar"} fechamento automático
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <XCircle className="h-4 w-4 mr-2" />
                Fechar todos os tickets
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Migrar tickets
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir conexão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Badge className={cn(status.color, "gap-1")}>
            <StatusIcon className={cn("h-3 w-3", isPolling && "animate-spin")} />
            {status.label}
          </Badge>
          <div className="flex items-center gap-2">
            {connection.status === "disconnected" && (
              <Button variant="outline" size="sm" onClick={onConnect}>
                <QrCode className="h-4 w-4 mr-2" />
                Conectar
              </Button>
            )}
            {connection.status === "qr_code" && (
              <Button variant="outline" size="sm" onClick={onConnect}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Ver QR Code
              </Button>
            )}
            {connection.status === "connected" && (
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                <WifiOff className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </div>
        {connection.last_connected_at && (
          <p className="text-sm text-muted-foreground mt-3">
            Última conexão: {new Date(connection.last_connected_at).toLocaleString("pt-BR")}
          </p>
        )}
        {connection.auto_close_tickets && (
          <p className="text-xs text-muted-foreground mt-1">
            ✓ Fechamento automático de tickets ativado
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function Connections() {
  const {
    connections,
    isLoading,
    createConnection,
    getQRCode,
    checkStatus,
    disconnect,
    deleteConnection,
    updateConnection,
    setDefault,
    restartAll,
  } = useWhatsAppConnections();

  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<WhatsAppConnection | null>(null);
  const [newName, setNewName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const connectedCount = connections.filter((c) => c.status === "connected").length;
  const totalCount = connections.length;

  // Poll for connection status when showing QR code
  useEffect(() => {
    if (!showQRDialog || !selectedConnection) return;

    const interval = setInterval(async () => {
      setIsPolling(true);
      const result = await checkStatus.mutateAsync(selectedConnection);
      setIsPolling(false);
      
      if (result.status === "connected") {
        setShowQRDialog(false);
        setSelectedConnection(null);
        setQrCode(null);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showQRDialog, selectedConnection]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    
    const result = await createConnection.mutateAsync(newName);
    setShowNewDialog(false);
    setNewName("");
    
    // Show QR code dialog
    if (result?.connection) {
      setSelectedConnection(result.connection);
      await handleShowQR(result.connection);
    }
  };

  const handleShowQR = async (connection: WhatsAppConnection) => {
    setSelectedConnection(connection);
    setShowQRDialog(true);
    
    const result = await getQRCode.mutateAsync(connection);
    setQrCode(result?.qrCode || null);
  };

  const handleDisconnect = async (connection: WhatsAppConnection) => {
    await disconnect.mutateAsync(connection);
  };

  const handleDelete = async () => {
    if (!selectedConnection) return;
    
    await deleteConnection.mutateAsync(selectedConnection);
    setShowDeleteDialog(false);
    setSelectedConnection(null);
  };

  const handleUpdate = async (connection: WhatsAppConnection, updates: Partial<WhatsAppConnection>) => {
    await updateConnection.mutateAsync({ id: connection.id, ...updates });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conexões WhatsApp</h1>
          <p className="text-muted-foreground">
            {connectedCount} de {totalCount} conexões ativas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => restartAll.mutate()}>
            <RefreshCw className={cn("h-4 w-4 mr-2", restartAll.isPending && "animate-spin")} />
            Reiniciar Todas
          </Button>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            NOVA CONEXÃO
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                <Wifi className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conectados</p>
                <p className="text-2xl font-bold text-success">{connectedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
                <WifiOff className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Desconectados</p>
                <p className="text-2xl font-bold text-destructive">
                  {connections.filter((c) => c.status === "disconnected").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connections Grid */}
      {connections.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((connection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onConnect={() => handleShowQR(connection)}
              onDisconnect={() => handleDisconnect(connection)}
              onDelete={() => {
                setSelectedConnection(connection);
                setShowDeleteDialog(true);
              }}
              onSetDefault={() => setDefault.mutate(connection.id)}
              onUpdate={(updates) => handleUpdate(connection, updates)}
              isPolling={isPolling && selectedConnection?.id === connection.id}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Smartphone className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma conexão WhatsApp</h3>
          <p className="text-muted-foreground mb-4">
            Adicione seu primeiro número para começar a atender seus clientes
          </p>
          <Button onClick={() => setShowNewDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar WhatsApp
          </Button>
        </Card>
      )}

      {/* New Connection Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            <DialogDescription>
              Digite um nome para identificar esta conexão
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Nome da conexão</Label>
            <Input
              id="name"
              placeholder="Ex: Comercial, Suporte, Financeiro..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || createConnection.isPending}>
              {createConnection.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {qrCode ? (
              <div className="relative">
                <img
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg border"
                />
                {isPolling && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : getQRCode.isPending ? (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                <p className="text-muted-foreground">Erro ao carregar QR Code</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Abra o WhatsApp no seu celular → Configurações → Aparelhos conectados → Conectar
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => selectedConnection && getQRCode.mutate(selectedConnection)}
              disabled={getQRCode.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", getQRCode.isPending && "animate-spin")} />
              Atualizar QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conexão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conexão "{selectedConnection?.display_name}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}