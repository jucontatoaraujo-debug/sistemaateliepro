'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { formatCurrency, formatDate, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, isOverdue } from '@/lib/utils';
import {
  Users, ShoppingBag, DollarSign, Factory, AlertTriangle,
  TrendingUp, TrendingDown, Clock, CheckCircle2, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_COLORS_CHART = [
  '#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'
];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (!data) return null;

  const { kpis, ordersByStatus, artsByStatus, recentOrders, topClients, revenueChart } = data;

  const chartData = (revenueChart as any[]).map((r: any) => ({
    month: format(new Date(r.month), 'MMM', { locale: ptBR }),
    receita: parseFloat(r.total),
  }));

  const statusPieData = Object.entries(ordersByStatus)
    .filter(([_, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: ORDER_STATUS_LABELS[k] || k, value: v }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral do seu ateliê</p>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      {/* Alerts */}
      {kpis.overdueOrders > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={20} />
          <p className="text-red-700 text-sm">
            <strong>{kpis.overdueOrders} pedido(s) atrasado(s).</strong>{' '}
            <Link href="/pedidos?priority=URGENTE" className="underline">Ver pedidos</Link>
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Clientes"
          value={kpis.totalClients.toLocaleString()}
          icon={<Users size={20} className="text-violet-600" />}
          color="violet"
          href="/clientes"
        />
        <KpiCard
          title="Pedidos este mês"
          value={kpis.ordersThisMonth.toLocaleString()}
          icon={<ShoppingBag size={20} className="text-blue-600" />}
          color="blue"
          growth={kpis.ordersGrowth}
          href="/pedidos"
        />
        <KpiCard
          title="Receita este mês"
          value={formatCurrency(kpis.revenueThisMonth)}
          icon={<DollarSign size={20} className="text-emerald-600" />}
          color="emerald"
          growth={kpis.revenueGrowth}
          href="/financeiro"
        />
        <KpiCard
          title="Em produção"
          value={kpis.productionQueue.toLocaleString()}
          icon={<Factory size={20} className="text-orange-600" />}
          color="orange"
          href="/producao"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Receita (últimos 6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => formatCurrency(v)} />
              <Area type="monotone" dataKey="receita" stroke="#7c3aed" strokeWidth={2} fill="url(#colorReceita)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Pedidos por Status</h3>
          {statusPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={statusPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                    {statusPieData.map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS_CHART[i % STATUS_COLORS_CHART.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusPieData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS_CHART[i] }} />
                    <span className="text-gray-600 flex-1 truncate">{item.name}</span>
                    <span className="font-medium text-gray-900">{item.value as number}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400 py-8 text-sm">Nenhum pedido ainda</div>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Pedidos Recentes</h3>
            <Link href="/pedidos" className="text-violet-600 text-sm hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum pedido ainda</p>
            )}
            {recentOrders.map((order: any) => (
              <Link key={order.id} href={`/pedidos/${order.id}`}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">{order.code}</span>
                      {order.deadline && isOverdue(order.deadline) && order.status !== 'ENTREGUE' && (
                        <AlertTriangle size={12} className="text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{order.client?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ORDER_STATUS_COLORS[order.status])}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Clients */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Top Clientes</h3>
            <Link href="/clientes" className="text-violet-600 text-sm hover:underline flex items-center gap-1">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {topClients.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">Nenhum cliente ainda</p>
            )}
            {topClients.map((client: any, i: number) => (
              <Link key={client.id} href={`/clientes/${client.id}`}>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.totalOrders} pedidos</p>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(client.totalSpent)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon, color, growth, href }: any) {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-50',
    blue: 'bg-blue-50',
    emerald: 'bg-emerald-50',
    orange: 'bg-orange-50',
  };

  return (
    <Link href={href}>
      <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <div className={cn('p-2 rounded-lg', colorMap[color])}>{icon}</div>
          {growth !== undefined && (
            <span className={cn('text-xs font-medium flex items-center gap-0.5', growth >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {growth >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(growth)}%
            </span>
          )}
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
