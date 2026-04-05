'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import {
  ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
  formatDate, formatCurrency, isOverdue, cn
} from '@/lib/utils';
import { Plus, Search, LayoutGrid, List, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { OrderModal } from './order-modal';

const KANBAN_COLUMNS = [
  { key: 'NOVO', label: 'Novo' },
  { key: 'AGUARDANDO_ARTE', label: 'Aguardando Arte' },
  { key: 'ARTE_EM_CRIACAO', label: 'Arte em Criação' },
  { key: 'AGUARDANDO_APROVACAO', label: 'Aguard. Aprovação' },
  { key: 'ARTE_APROVADA', label: 'Arte Aprovada' },
  { key: 'EM_PRODUCAO', label: 'Em Produção' },
  { key: 'FINALIZADO', label: 'Finalizado' },
];

export default function PedidosPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: kanbanData, isLoading } = useQuery({
    queryKey: ['orders-kanban'],
    queryFn: () => ordersApi.kanban().then(r => r.data),
    enabled: view === 'kanban',
  });

  const { data: listData } = useQuery({
    queryKey: ['orders-list', search],
    queryFn: () => ordersApi.list({ search, limit: 50 }).then(r => r.data),
    enabled: view === 'list',
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders-kanban'] });
      toast.success('Status atualizado!');
    },
  });

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Pedidos</h1>
          <p className="text-gray-500 text-sm">Gestão completa de pedidos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button onClick={() => setView('kanban')} className={cn('p-1.5 rounded-md transition-colors', view === 'kanban' ? 'bg-white shadow-sm' : 'text-gray-500')}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md transition-colors', view === 'list' ? 'bg-white shadow-sm' : 'text-gray-500')}>
              <List size={16} />
            </button>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: `${KANBAN_COLUMNS.length * 290}px` }}>
            {KANBAN_COLUMNS.map(col => {
              const orders = kanbanData?.[col.key] || [];
              return (
                <div key={col.key} className="kanban-column">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{orders.length}</span>
                  </div>
                  <div className="space-y-2">
                    {orders.map((order: any) => (
                      <KanbanCard key={order.id} order={order} />
                    ))}
                    {orders.length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-6">Vazio</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedidos..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
          </div>
          <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cliente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Prazo</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(listData?.data || []).map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/pedidos/${order.id}`} className="font-medium text-violet-600 hover:underline text-sm">
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{order.client?.name}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status])}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {order.deadline ? (
                        <span className={cn('flex items-center gap-1', isOverdue(order.deadline) && order.status !== 'ENTREGUE' ? 'text-red-600' : 'text-gray-500')}>
                          {isOverdue(order.deadline) && order.status !== 'ENTREGUE' && <AlertTriangle size={12} />}
                          {formatDate(order.deadline)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <OrderModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            setModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['orders-kanban'] });
            queryClient.invalidateQueries({ queryKey: ['orders-list'] });
          }}
        />
      )}
    </div>
  );
}

function KanbanCard({ order }: { order: any }) {
  const overdue = order.deadline && isOverdue(order.deadline);

  return (
    <Link href={`/pedidos/${order.id}`}>
      <div className="kanban-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-violet-600">{order.code}</span>
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium border', PRIORITY_COLORS[order.priority])}>
            {PRIORITY_LABELS[order.priority]}
          </span>
        </div>
        <p className="text-sm font-medium text-gray-800 truncate">{order.client?.name}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{order._count?.items || 0} itens</span>
          {order.deadline && (
            <span className={cn('flex items-center gap-1', overdue ? 'text-red-500' : '')}>
              {overdue && <AlertTriangle size={10} />}
              <Clock size={10} />
              {formatDate(order.deadline)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
