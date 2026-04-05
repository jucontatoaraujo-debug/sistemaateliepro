'use client';

import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { financialApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';

export function FinancialModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit } = useForm({ defaultValues: { type: 'RECEITA' } });

  const mutation = useMutation({
    mutationFn: financialApi.create,
    onSuccess: () => { toast.success('Lançamento criado!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Novo Lançamento</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-emerald-400 transition-colors">
                <input {...register('type')} type="radio" value="RECEITA" className="text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Receita</span>
              </label>
              <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:border-red-400 transition-colors">
                <input {...register('type')} type="radio" value="DESPESA" className="text-red-500" />
                <span className="text-sm font-medium text-red-500">Despesa</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input {...register('description', { required: true })} placeholder="Ex: Pagamento pedido P2401" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
              <input {...register('amount', { required: true })} type="number" step="0.01" placeholder="0,00" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
              <input {...register('dueDate')} type="date" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select {...register('category')} className="input">
              <option value="">Selecionar...</option>
              <option value="BORDADO">Bordado</option>
              <option value="MATERIAL">Material</option>
              <option value="EQUIPAMENTO">Equipamento</option>
              <option value="MARKETING">Marketing</option>
              <option value="ALUGUEL">Aluguel</option>
              <option value="OUTROS">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea {...register('notes')} rows={2} className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
