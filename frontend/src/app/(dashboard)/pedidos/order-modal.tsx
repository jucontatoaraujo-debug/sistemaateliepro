'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordersApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';

const schema = z.object({
  clientId: z.string().min(1, 'Cliente obrigatório'),
  priority: z.string().default('NORMAL'),
  deadline: z.string().optional(),
  embroideryLocation: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OrderModal({ order, onClose, onSuccess }: { order?: any; onClose: () => void; onSuccess: () => void }) {
  const { data: clientsData } = useQuery({
    queryKey: ['clients-select'],
    queryFn: () => clientsApi.list({ limit: 100 }).then(r => r.data),
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: order || { priority: 'NORMAL' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => order ? ordersApi.update(order.id, data) : ordersApi.create(data),
    onSuccess: () => {
      toast.success(order ? 'Pedido atualizado!' : 'Pedido criado!');
      onSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao salvar.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{order ? 'Editar Pedido' : 'Novo Pedido'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select {...register('clientId')} className="input">
              <option value="">Selecionar cliente...</option>
              {clientsData?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select {...register('priority')} className="input">
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
                <option value="BAIXA">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
              <input {...register('deadline')} type="date" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Local do Bordado</label>
            <select {...register('embroideryLocation')} className="input">
              <option value="">Selecionar...</option>
              <option value="peito-esquerdo">Peito Esquerdo</option>
              <option value="peito-direito">Peito Direito</option>
              <option value="costas">Costas</option>
              <option value="manga-esquerda">Manga Esquerda</option>
              <option value="manga-direita">Manga Direita</option>
              <option value="frente-centro">Frente Centro</option>
              <option value="bone">Boné</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('notes')} rows={3} placeholder="Detalhes do pedido..." className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Criar Pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
