import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  return isAfter(new Date(), new Date(date));
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  AGUARDANDO_ARTE: 'Aguardando Arte',
  ARTE_EM_CRIACAO: 'Arte em Criação',
  AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
  ARTE_APROVADA: 'Arte Aprovada',
  EM_PRODUCAO: 'Em Produção',
  FINALIZADO: 'Finalizado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-slate-100 text-slate-700',
  AGUARDANDO_ARTE: 'bg-yellow-100 text-yellow-700',
  ARTE_EM_CRIACAO: 'bg-blue-100 text-blue-700',
  AGUARDANDO_APROVACAO: 'bg-orange-100 text-orange-700',
  ARTE_APROVADA: 'bg-green-100 text-green-700',
  EM_PRODUCAO: 'bg-purple-100 text-purple-700',
  FINALIZADO: 'bg-teal-100 text-teal-700',
  ENTREGUE: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export const ART_STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CRIACAO: 'Aguardando Criação',
  EM_CRIACAO: 'Em Criação',
  ENVIADA_PARA_APROVACAO: 'Enviada para Aprovação',
  APROVADA: 'Aprovada',
  AJUSTE_SOLICITADO: 'Ajuste Solicitado',
  CANCELADA: 'Cancelada',
};

export const ART_STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_CRIACAO: 'bg-slate-100 text-slate-700',
  EM_CRIACAO: 'bg-blue-100 text-blue-700',
  ENVIADA_PARA_APROVACAO: 'bg-orange-100 text-orange-700',
  APROVADA: 'bg-emerald-100 text-emerald-700',
  AJUSTE_SOLICITADO: 'bg-red-100 text-red-700',
  CANCELADA: 'bg-gray-100 text-gray-500',
};

export const PRODUCTION_STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_ARTE: 'Aguardando Arte',
  AGUARDANDO_MATERIAL: 'Aguardando Material',
  APROVADO: 'Aprovado',
  EM_PRODUCAO: 'Em Produção',
  PAUSADO: 'Pausado',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
};

export const EMBROIDERY_TYPE_LABELS: Record<string, string> = {
  NOME: 'Nome',
  LOGO: 'Logo',
  FRASE: 'Frase',
  PATCH: 'Patch',
  NUMERO: 'Número',
  BRASAO: 'Brasão',
  PERSONALIZADO: 'Personalizado',
};

export const PRIORITY_LABELS: Record<string, string> = {
  URGENTE: 'Urgente',
  ALTA: 'Alta',
  NORMAL: 'Normal',
  BAIXA: 'Baixa',
};

export const PRIORITY_COLORS: Record<string, string> = {
  URGENTE: 'bg-red-100 text-red-700 border-red-200',
  ALTA: 'bg-orange-100 text-orange-700 border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
  BAIXA: 'bg-gray-100 text-gray-600 border-gray-200',
};
