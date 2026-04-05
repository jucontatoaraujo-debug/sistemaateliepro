'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { X, Loader2 } from 'lucide-react';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email().optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  isCompany: z.boolean().optional(),
  companyName: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ClientModal({ client, onClose, onSuccess }: { client?: any; onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: client || { isCompany: false },
  });

  const isCompany = watch('isCompany');

  const mutation = useMutation({
    mutationFn: (data: FormData) => client ? clientsApi.update(client.id, data) : clientsApi.create(data),
    onSuccess: () => {
      toast.success(client ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      onSuccess();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro ao salvar cliente.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">{client ? 'Editar Cliente' : 'Novo Cliente'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-6 space-y-4">
          <Field label="Nome *" error={errors.name?.message}>
            <input {...register('name')} placeholder="Nome completo" className="input" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <input {...register('email')} type="email" placeholder="email@exemplo.com" className="input" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="WhatsApp">
              <input {...register('whatsapp')} placeholder="(11) 99999-0000" className="input" />
            </Field>
            <Field label="Instagram">
              <input {...register('instagram')} placeholder="@usuario" className="input" />
            </Field>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('isCompany')} type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
            <span className="text-sm text-gray-700">É empresa</span>
          </label>

          {isCompany && (
            <Field label="Razão Social">
              <input {...register('companyName')} placeholder="Nome da empresa" className="input" />
            </Field>
          )}

          <Field label="Observações">
            <textarea {...register('notes')} placeholder="Preferências, observações..." rows={2} className="input resize-none" />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Salvando...</> : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
