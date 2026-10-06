export type Channel = "whatsapp" | "instagram";
export type ConversationStatus = "ia" | "humano" | "aguardando";

export type Conversation = {
  id: string;
  name: string;
  initials: string;
  channel: Channel;
  preview: string;
  time: string;
  status: ConversationStatus;
  unread?: number;
};

export const conversations: Conversation[] = [
  { id: "c-001", name: "Mariana Costa", initials: "MC", channel: "whatsapp", preview: "Queria saber os horários disponíveis para sexta.", time: "há 2 min", status: "ia", unread: 2 },
  { id: "c-002", name: "Lucas Almeida", initials: "LA", channel: "instagram", preview: "Pode me passar o valor do serviço?", time: "há 7 min", status: "humano", unread: 1 },
  { id: "c-003", name: "Fernanda Lima", initials: "FL", channel: "whatsapp", preview: "Obrigada! Vou confirmar e retorno.", time: "há 14 min", status: "aguardando" },
  { id: "c-004", name: "Rafael Santos", initials: "RS", channel: "instagram", preview: "Vocês atendem aos sábados?", time: "há 21 min", status: "ia" },
  { id: "c-005", name: "Camila Rocha", initials: "CR", channel: "whatsapp", preview: "Quero falar com um atendente.", time: "há 32 min", status: "humano" },
];

export const activity = [
  { label: "08h", value: 22 },
  { label: "10h", value: 42 },
  { label: "12h", value: 36 },
  { label: "14h", value: 64 },
  { label: "16h", value: 52 },
  { label: "18h", value: 78 },
  { label: "20h", value: 46 },
];

export const knowledgeItems = [
  { title: "Horários de atendimento", updated: "Atualizado há 2 dias", state: "Publicado" },
  { title: "Tabela de serviços e preços", updated: "Atualizado há 5 dias", state: "Publicado" },
  { title: "Política de cancelamento", updated: "Rascunho", state: "Revisar" },
  { title: "Endereço e como chegar", updated: "Atualizado há 8 dias", state: "Publicado" },
];
