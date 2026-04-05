'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matricesApi } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Plus, Search, Cpu, Download, Trash2, FileCode } from 'lucide-react';
import toast from 'react-hot-toast';
import { MatrixModal } from './matrix-modal';

export default function MatrizesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['matrices', search],
    queryFn: () => matricesApi.list({ search, limit: 50 }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: matricesApi.remove,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['matrices'] }); toast.success('Matriz removida.'); },
  });

  const matrices = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Matrizes</h1>
          <p className="text-gray-500 text-sm">Arquivos .DST, .PES e outros formatos de bordado</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nova Matriz
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar matrizes..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : matrices.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Cpu size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhuma matriz cadastrada</p>
          <p className="text-sm mt-1">Cadastre arquivos DST, PES e outros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matrices.map((matrix: any) => (
            <div key={matrix.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                    <FileCode size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{matrix.name}</h3>
                    {matrix.client && <p className="text-xs text-gray-500">{matrix.client.name}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  {matrix.fileUrl && (
                    <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${matrix.fileUrl}`} download={matrix.fileName} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Download size={14} />
                    </a>
                  )}
                  <button onClick={() => { if (confirm('Remover matriz?')) deleteMutation.mutate(matrix.id); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {matrix.fileFormat && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-400 block">Formato</span>
                    <span className="font-semibold text-gray-700">.{matrix.fileFormat}</span>
                  </div>
                )}
                {matrix.estimatedPoints && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-400 block">Pontos</span>
                    <span className="font-semibold text-gray-700">{matrix.estimatedPoints.toLocaleString()}</span>
                  </div>
                )}
                {matrix.widthCm && matrix.heightCm && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-400 block">Tamanho</span>
                    <span className="font-semibold text-gray-700">{matrix.widthCm}x{matrix.heightCm}cm</span>
                  </div>
                )}
                {matrix.colors && (
                  <div className="bg-gray-50 rounded-lg p-2">
                    <span className="text-gray-400 block">Cores</span>
                    <span className="font-semibold text-gray-700">{matrix.colors}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-3">{formatDate(matrix.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <MatrixModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['matrices'] }); }} />
      )}
    </div>
  );
}
