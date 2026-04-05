'use client';

import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { matricesApi, clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2, Upload, FileCode } from 'lucide-react';

export function MatrixModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: clients } = useQuery({ queryKey: ['clients-select'], queryFn: () => clientsApi.list({ limit: 100 }).then(r => r.data) });
  const { register, handleSubmit, watch } = useForm();
  const file = watch('file');

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const form = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (k !== 'file' && v) form.append(k, v as string); });
      if (data.file?.[0]) form.append('file', data.file[0]);
      return matricesApi.create(form);
    },
    onSuccess: () => { toast.success('Matriz cadastrada!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao cadastrar.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Nova Matriz</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input {...register('name', { required: true })} placeholder="Ex: Logo Empresa ABC" className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
            <select {...register('clientId')} className="input">
              <option value="">Nenhum</option>
              {clients?.data?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo (.DST, .PES, .JEF...)</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors">
              {file?.[0] ? (
                <div className="flex items-center gap-2 text-violet-600">
                  <FileCode size={20} />
                  <span className="text-sm font-medium">{file[0].name}</span>
                </div>
              ) : (
                <>
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">Clique para enviar o arquivo</span>
                </>
              )}
              <input {...register('file')} type="file" accept=".dst,.pes,.jef,.exp,.vp3,.xxx,.hus" className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pontos estimados</label>
              <input {...register('estimatedPoints')} type="number" placeholder="Ex: 15000" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nº de cores</label>
              <input {...register('colors')} type="number" placeholder="Ex: 3" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Largura (cm)</label>
              <input {...register('widthCm')} type="number" step="0.1" placeholder="Ex: 8.5" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
              <input {...register('heightCm')} type="number" step="0.1" placeholder="Ex: 6.0" className="input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 bg-violet-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
