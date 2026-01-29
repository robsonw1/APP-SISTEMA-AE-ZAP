import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Edit2,
  Save,
  X,
  Plus,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  User,
  Tag,
  Bot,
} from "lucide-react";
import { TicketWithRelations } from "@/hooks/useTickets";
import { useTags } from "@/hooks/useTags";

interface ContactSidebarProps {
  ticket: TicketWithRelations;
  onUpdateContact?: (updates: Record<string, unknown>) => Promise<void>;
  onAddTag?: (tagId: string) => void;
  onRemoveTag?: (tagId: string) => void;
}

export function ContactSidebar({
  ticket,
  onUpdateContact,
  onAddTag,
  onRemoveTag,
}: ContactSidebarProps) {
  const contact = ticket.contact;
  const { tags: availableTags } = useTags();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    info: true,
    extra: false,
    tags: true,
  });

  const [formData, setFormData] = useState({
    name: contact?.name || "",
    phone: contact?.phone || "",
    email: contact?.email || "",
    document: contact?.document || "",
    state: contact?.state || "",
    city: contact?.city || "",
    notes: contact?.notes || "",
  });

  const initials = contact?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "??";

  const handleSave = async () => {
    if (!onUpdateContact) return;
    setIsSaving(true);
    try {
      await onUpdateContact(formData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const ticketTags = ticket.tags?.map((t) => t.tag) || [];
  const unassignedTags = availableTags.filter(
    (tag) => !ticketTags.some((t) => t.id === tag.id)
  );

  return (
    <div className="w-80 border-l bg-card flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Dados do contato</h3>
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Avatar & Name */}
          <div className="text-center mb-6">
            <Avatar className="h-24 w-24 mx-auto mb-3">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-center font-semibold"
              />
            ) : (
              <h2 className="font-semibold text-xl">{contact?.name || "Sem nome"}</h2>
            )}
            <p className="text-muted-foreground text-sm">{contact?.phone || "Sem telefone"}</p>
          </div>

          <Separator className="mb-4" />

          {/* Basic Info */}
          <Collapsible open={expandedSections.info} onOpenChange={() => toggleSection("info")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações Básicas
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.info ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm">{contact?.phone || "—"}</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" /> E-mail
                </Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm">{contact?.email || "—"}</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> CPF/CNPJ
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.document}
                    onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm">{contact?.document || "—"}</p>
                )}
              </div>

              <div>
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Localização
                </Label>
                {isEditing ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Cidade"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                    <Input
                      placeholder="UF"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-20"
                    />
                  </div>
                ) : (
                  <p className="text-sm">
                    {contact?.city && contact?.state
                      ? `${contact.city}/${contact.state}`
                      : "—"}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Tags */}
          <Collapsible open={expandedSections.tags} onOpenChange={() => toggleSection("tags")}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Tags
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.tags ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="flex flex-wrap gap-1.5 mb-3">
                {ticketTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                    {onRemoveTag && (
                      <button
                        onClick={() => onRemoveTag(tag.id)}
                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {onAddTag && unassignedTags.length > 0 && (
                <Select onValueChange={onAddTag}>
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="+ Adicionar tag" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator className="my-4" />

          {/* Notes */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Observações</Label>
            {isEditing ? (
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Adicione observações sobre o contato..."
              />
            ) : (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 min-h-[80px]">
                {contact?.notes || "Nenhuma observação"}
              </p>
            )}
          </div>

          <Separator className="my-4" />

          {/* Chatbot toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="disable-chatbot" className="text-sm">
                Desabilitar chatbot
              </Label>
            </div>
            <Switch id="disable-chatbot" />
          </div>
        </div>
      </ScrollArea>

      {/* Save button when editing */}
      {isEditing && (
        <div className="p-4 border-t">
          <Button className="w-full" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            SALVAR
          </Button>
        </div>
      )}
    </div>
  );
}