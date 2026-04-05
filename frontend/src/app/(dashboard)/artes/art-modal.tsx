'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { artsApi, clientsApi, ordersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  clientId: z.string().min(1, 'Cliente obrigatório'),
  orderId: z.string().optional(),
  title: z.string().min(2, 'Título obrigatório'),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

export function ArtModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.list({ limit: 100 }).then(r => r.data) });
  const { data: orders } = useQuery({ queryKey: ['orders-select'], queryFn: () => ordersApi.list({ limit: 100 }).then(r => r.data) });

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: any) => artsApi.create(data),
    onSuccess: () => { toast.success('Arte criada!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao criar arte.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nova Arte</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select {...register('clientId')} className="input">
              <option value="">Selecionar...</option>
              {clients?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.clientId && <p className="text-red-500 text-xs mt-1">{errors.clientId.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Vinculado</label>
            <select {...register('orderId')} className="input">
              <option value="">Nenhum</option>
              {orders?.data?.map((o: any) => <option key={o.id} value={o.id}>{o.code} - {o.client?.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input {...register('title')} placeholder="Ex: Logo empresa no peito" className="input" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message as string}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea {...register('description')} rows={2} className="input resize-none" placeholder="Referências, observações..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
            <input {...register('deadline')} type="date" className="input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Criando...</> : 'Criar Arte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
