'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi, machinesApi } from '@/lib/api';
import { PRODUCTION_STATUS_LABELS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate, cn } from '@/lib/utils';
import { Plus, Factory, Play, Pause, CheckCircle2, Clock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProductionModal } from './production-modal';

const STATUS_COLORS: Record<string, string> = {
  AGUARDANDO_ARTE: 'bg-yellow-100 text-yellow-700',
  AGUARDANDO_MATERIAL: 'bg-orange-100 text-orange-700',
  APROVADO: 'bg-blue-100 text-blue-700',
  EM_PRODUCAO: 'bg-purple-100 text-purple-700',
  PAUSADO: 'bg-gray-100 text-gray-600',
  FINALIZADO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-red-100 text-red-700',
};

export default function ProducaoPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['production-queue'],
    queryFn: () => productionApi.queue().then(r => r.data),
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => productionApi.updateStatus(id, status),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['production-queue'] }); toast.success('Status atualizado!'); },
  });

  const items = (data || []).filter((p: any) => !filter || p.status === filter);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Produção</h1>
          <p className="text-gray-500 text-sm">Fila de produção e controle de máquinas</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Adicionar à Fila
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'APROVADO', 'EM_PRODUCAO', 'AGUARDANDO_ARTE', 'AGUARDANDO_MATERIAL', 'PAUSADO', 'FINALIZADO'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors', filter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 hover:bg-gray-50')}>
            {s ? PRODUCTION_STATUS_LABELS[s] : 'Todos'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Factory size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Fila de produção vazia</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((prod: any) => (
            <div key={prod.id} className="bg-white border rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{prod.order?.code}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[prod.status])}>
                      {PRODUCTION_STATUS_LABELS[prod.status]}
                    </span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border', PRIORITY_COLORS[prod.priority])}>
                      {PRIORITY_LABELS[prod.priority]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{prod.order?.client?.name}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    {prod.machine && <span className="flex items-center gap-1"><Factory size={12} /> {prod.machine.name}</span>}
                    {prod.operator && <span className="flex items-center gap-1"><User size={12} /> {prod.operator.name}</span>}
                    {prod.scheduledAt && <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(prod.scheduledAt)}</span>}
                    {prod.estimatedTime && <span>{prod.estimatedTime}min estimados</span>}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0 ml-4">
                  {prod.status === 'APROVADO' && (
                    <button onClick={() => updateStatus.mutate({ id: prod.id, status: 'EM_PRODUCAO' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-700 transition-colors">
                      <Play size={12} /> Iniciar
                    </button>
                  )}
                  {prod.status === 'EM_PRODUCAO' && (
                    <>
                      <button onClick={() => updateStatus.mutate({ id: prod.id, status: 'PAUSADO' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg font-medium hover:bg-yellow-600">
                        <Pause size={12} /> Pausar
                      </button>
                      <button onClick={() => updateStatus.mutate({ id: prod.id, status: 'FINALIZADO' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg font-medium hover:bg-emerald-700">
                        <CheckCircle2 size={12} /> Finalizar
                      </button>
                    </>
                  )}
                  {prod.status === 'PAUSADO' && (
                    <button onClick={() => updateStatus.mutate({ id: prod.id, status: 'EM_PRODUCAO' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg font-medium hover:bg-purple-700">
                      <Play size={12} /> Retomar
                    </button>
                  )}
                  {prod.status === 'AGUARDANDO_ARTE' && (
                    <button onClick={() => updateStatus.mutate({ id: prod.id, status: 'APROVADO' })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700">
                      <CheckCircle2 size={12} /> Aprovar
                    </button>
                  )}
                </div>
              </div>

              {/* Steps */}
              {prod.steps?.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    {prod.steps.map((step: any) => (
                      <div key={step.id} className={cn('flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition-colors',
                        step.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-700' :
                        step.status === 'EM_ANDAMENTO' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-500'
                      )}>
                        {step.step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ProductionModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['production-queue'] }); }} />
      )}
    </div>
  );
}
