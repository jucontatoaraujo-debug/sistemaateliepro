'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialApi } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FinancialModal } from './financial-modal';

export default function FinanceiroPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'receitas' | 'despesas' | 'pendentes'>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: summary } = useQuery({
    queryKey: ['financial-summary'],
    queryFn: () => financialApi.summary().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['financial', tab],
    queryFn: () => financialApi.list({
      type: tab === 'receitas' ? 'RECEITA' : tab === 'despesas' ? 'DESPESA' : undefined,
      status: tab === 'pendentes' ? 'PENDENTE' : undefined,
      limit: 50,
    }).then(r => r.data),
  });

  const payMutation = useMutation({
    mutationFn: financialApi.markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] });
      toast.success('Marcado como pago!');
    },
  });

  const records = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Financeiro</h1>
          <p className="text-gray-500 text-sm">Controle de receitas e despesas</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Lançamento
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-50 rounded-lg"><TrendingUp size={16} className="text-emerald-600" /></div>
              <span className="text-sm text-gray-500">Receitas</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.receitas)}</p>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-red-50 rounded-lg"><TrendingDown size={16} className="text-red-500" /></div>
              <span className="text-sm text-gray-500">Despesas</span>
            </div>
            <p className="text-xl font-bold text-red-500">{formatCurrency(summary.despesas)}</p>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-violet-50 rounded-lg"><DollarSign size={16} className="text-violet-600" /></div>
              <span className="text-sm text-gray-500">Lucro</span>
            </div>
            <p className={cn('text-xl font-bold', summary.lucro >= 0 ? 'text-violet-600' : 'text-red-500')}>{formatCurrency(summary.lucro)}</p>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-yellow-50 rounded-lg"><AlertCircle size={16} className="text-yellow-600" /></div>
              <span className="text-sm text-gray-500">Pendentes</span>
            </div>
            <p className="text-xl font-bold text-yellow-600">{formatCurrency(summary.pendentes.total)}</p>
            <p className="text-xs text-gray-400">{summary.pendentes.count} lançamentos</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'receitas', label: 'Receitas' },
          { key: 'despesas', label: 'Despesas' },
          { key: 'pendentes', label: 'Pendentes' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.key ? 'bg-violet-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vencimento</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Nenhum lançamento encontrado</td></tr>
            )}
            {records.map((record: any) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{record.description}</p>
                  {record.order && <p className="text-xs text-gray-400">Pedido {record.order.code}</p>}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', record.type === 'RECEITA' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                    {record.type === 'RECEITA' ? 'Receita' : 'Despesa'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatDate(record.dueDate)}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                    record.status === 'PAGO' ? 'bg-emerald-100 text-emerald-700' :
                    record.status === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  )}>
                    {record.status === 'PAGO' ? 'Pago' : record.status === 'VENCIDO' ? 'Vencido' : 'Pendente'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={cn('text-sm font-semibold', record.type === 'RECEITA' ? 'text-emerald-600' : 'text-red-500')}>
                    {record.type === 'RECEITA' ? '+' : '-'}{formatCurrency(record.amount)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {record.status === 'PENDENTE' && (
                    <button onClick={() => payMutation.mutate(record.id)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Marcar como pago">
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <FinancialModal onClose={() => setModalOpen(false)} onSuccess={() => { setModalOpen(false); queryClient.invalidateQueries({ queryKey: ['financial'] }); queryClient.invalidateQueries({ queryKey: ['financial-summary'] }); }} />
      )}
    </div>
  );
}
