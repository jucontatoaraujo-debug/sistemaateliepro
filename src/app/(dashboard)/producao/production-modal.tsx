'use client';

import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productionApi, ordersApi, machinesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';

export function ProductionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: orders } = useQuery({ queryKey: ['orders-select'], queryFn: () => ordersApi.list({ limit: 100, status: 'ARTE_APROVADA' }).then(r => r.data) });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => machinesApi.list().then(r => r.data) });
  const { register, handleSubmit } = useForm();

  const mutation = useMutation({
    mutationFn: productionApi.create,
    onSuccess: () => { toast.success('Adicionado à fila!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Adicionar à Fila de Produção</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido *</label>
            <select {...register('orderId', { required: true })} className="input">
              <option value="">Selecionar pedido...</option>
              {orders?.data?.map((o: any) => <option key={o.id} value={o.id}>{o.code} - {o.client?.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máquina</label>
            <select {...register('machineId')} className="input">
              <option value="">Selecionar...</option>
              {(machines || []).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select {...register('priority')} className="input">
                <option value="NORMAL">Normal</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tempo estimado (min)</label>
              <input {...register('estimatedTime')} type="number" placeholder="60" className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data agendada</label>
            <input {...register('scheduledAt')} type="datetime-local" className="input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Adicionando...</> : 'Adicionar à Fila'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
