'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artsApi } from '@/lib/api';
import { ART_STATUS_LABELS, ART_STATUS_COLORS, formatDate, cn } from '@/lib/utils';
import { Plus, Search, Image, CheckCircle2, RotateCcw, Send, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArtModal } from './art-modal';

const STATUS_TABS = [
  { key: '', label: 'Todas' },
  { key: 'AGUARDANDO_CRIACAO', label: 'Aguardando' },
  { key: 'EM_CRIACAO', label: 'Em Criação' },
  { key: 'ENVIADA_PARA_APROVACAO', label: 'Para Aprovação' },
  { key: 'AJUSTE_SOLICITADO', label: 'Ajuste' },
  { key: 'APROVADA', label: 'Aprovadas' },
];

export default function ArtesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [approveModal, setApproveModal] = useState<any>(null);
  const [adjustModal, setAdjustModal] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['arts', statusFilter],
    queryFn: () => artsApi.list({ status: statusFilter || undefined, limit: 50 }).then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, approvedBy }: { id: string; approvedBy: string }) => artsApi.approve(id, approvedBy),
    onSuccess: () => {
      toast.success('Arte aprovada!');
      queryClient.invalidateQueries({ queryKey: ['arts'] });
      setApproveModal(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) => artsApi.requestAdjustment(id, feedback),
    onSuccess: () => {
      toast.success('Ajuste solicitado!');
      queryClient.invalidateQueries({ queryKey: ['arts'] });
      setAdjustModal(null);
    },
  });

  const arts = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Artes</h1>
          <p className="text-gray-500 text-sm">Gestão de artes e aprovações</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Nova Arte
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={cn('px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', statusFilter === tab.key ? 'bg-violet-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : arts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Image size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma arte encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {arts.map((art: any) => {
            const lastVersion = art.versions?.[0];
            return (
              <div key={art.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Preview */}
                <div className="h-36 bg-gray-100 flex items-center justify-center relative">
                  {lastVersion?.fileUrl ? (
                    <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${lastVersion.fileUrl}`} alt={art.title} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                      <Image size={32} />
                      <span className="text-xs mt-1">Sem arquivo</span>
                    </div>
                  )}
                  <span className={cn('absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium', ART_STATUS_COLORS[art.status])}>
                    {ART_STATUS_LABELS[art.status]}
                  </span>
                </div>

                <div className="p-4">
                  <Link href={`/artes/${art.id}`} className="font-semibold text-gray-900 hover:text-violet-600 transition-colors block truncate">
                    {art.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-0.5">{art.client?.name}</p>
                  <p className="text-xs text-gray-400 mt-1">v{art.currentVersion} · {formatDate(art.updatedAt)}</p>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {art.status === 'ENVIADA_PARA_APROVACAO' && (
                      <>
                        <button
                          onClick={() => setApproveModal(art)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle2 size={12} /> Aprovar
                        </button>
                        <button
                          onClick={() => setAdjustModal(art)}
                          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-100 transition-colors"
                        >
                          <RotateCcw size={12} /> Ajuste
                        </button>
                      </>
                    )}
                    <Link href={`/artes/${art.id}`} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 bg-gray-50 text-gray-600 border rounded-lg font-medium hover:bg-gray-100 transition-colors">
                      <Pencil size={12} /> Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <ArtModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['arts'] }); }} />
      )}

      {approveModal && (
        <SimpleInputModal
          title="Aprovar Arte"
          message="Nome de quem aprovou (cliente):"
          buttonLabel="Confirmar Aprovação"
          buttonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClose={() => setApproveModal(null)}
          onSubmit={(value) => approveMutation.mutate({ id: approveModal.id, approvedBy: value })}
        />
      )}

      {adjustModal && (
        <SimpleInputModal
          title="Solicitar Ajuste"
          message="Descreva o que precisa ser ajustado:"
          buttonLabel="Solicitar Ajuste"
          buttonClass="bg-red-600 hover:bg-red-700 text-white"
          onClose={() => setAdjustModal(null)}
          onSubmit={(value) => adjustMutation.mutate({ id: adjustModal.id, feedback: value })}
          textarea
        />
      )}
    </div>
  );
}

function SimpleInputModal({ title, message, buttonLabel, buttonClass, onClose, onSubmit, textarea }: any) {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-3">{message}</p>
        {textarea ? (
          <textarea value={value} onChange={e => setValue(e.target.value)} rows={3} className="input w-full resize-none mb-4" />
        ) : (
          <input value={value} onChange={e => setValue(e.target.value)} className="input w-full mb-4" placeholder="Digite aqui..." />
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSubmit(value)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${buttonClass}`}>{buttonLabel}</button>
        </div>
      </div>
    </div>
  );
}
