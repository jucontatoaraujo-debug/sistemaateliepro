'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';
import { formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, isOverdue, cn } from '@/lib/utils';
import { Calendar, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState } from 'react';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data } = useQuery({
    queryKey: ['orders-agenda', currentDate],
    queryFn: () => ordersApi.list({
      startDate: startOfMonth(currentDate).toISOString(),
      endDate: endOfMonth(currentDate).toISOString(),
      limit: 100,
    }).then(r => r.data),
  });

  const orders = data?.data || [];
  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });

  const getOrdersForDay = (day: Date) => orders.filter((o: any) => o.deadline && isSameDay(new Date(o.deadline), day));

  const overdueOrders = orders.filter((o: any) =>
    o.deadline && isOverdue(o.deadline) && !['ENTREGUE', 'CANCELADO', 'FINALIZADO'].includes(o.status)
  );

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Agenda</h1>
          <p className="text-gray-500 text-sm">Prazos e entregas</p>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdueOrders.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-red-500" size={18} />
            <h3 className="font-semibold text-red-800">{overdueOrders.length} pedido(s) atrasado(s)</h3>
          </div>
          <div className="space-y-2">
            {overdueOrders.map((o: any) => (
              <Link key={o.id} href={`/pedidos/${o.id}`} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-red-100 hover:border-red-300 transition-colors">
                <div>
                  <span className="font-medium text-sm text-red-700">{o.code}</span>
                  <span className="text-xs text-gray-500 ml-2">{o.client?.name}</span>
                </div>
                <span className="text-xs text-red-600 font-medium">{formatDate(o.deadline)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">Anterior</button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">Hoje</button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">Próximo</button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="text-center py-2 text-xs font-medium text-gray-500">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for start of month */}
          {Array.from({ length: days[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[80px] border-b border-r bg-gray-50" />
          ))}

          {days.map(day => {
            const dayOrders = getOrdersForDay(day);
            const hasOverdue = dayOrders.some((o: any) => isOverdue(day) && !['ENTREGUE', 'CANCELADO', 'FINALIZADO'].includes(o.status));

            return (
              <div key={day.toISOString()} className={cn('min-h-[80px] border-b border-r p-1.5', isToday(day) && 'bg-violet-50')}>
                <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mb-1',
                  isToday(day) ? 'bg-violet-600 text-white' : hasOverdue ? 'text-red-600 font-bold' : 'text-gray-500'
                )}>
                  {day.getDate()}
                </div>
                {dayOrders.map((o: any) => (
                  <Link key={o.id} href={`/pedidos/${o.id}`}>
                    <div className={cn('text-xs p-1 rounded mb-0.5 truncate font-medium',
                      isOverdue(o.deadline) && !['ENTREGUE', 'CANCELADO', 'FINALIZADO'].includes(o.status)
                        ? 'bg-red-100 text-red-700'
                        : 'bg-violet-100 text-violet-700'
                    )}>
                      {o.code}
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming deadlines list */}
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Próximos Prazos</h3>
        <div className="space-y-2">
          {orders
            .filter((o: any) => o.deadline && !['ENTREGUE', 'CANCELADO'].includes(o.status))
            .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 10)
            .map((o: any) => (
              <Link key={o.id} href={`/pedidos/${o.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isOverdue(o.deadline) ? 'bg-red-500' : 'bg-violet-500')} />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-900">{o.code}</span>
                    <span className="text-sm text-gray-500 ml-2">{o.client?.name}</span>
                  </div>
                  <span className={cn('text-xs font-medium', ORDER_STATUS_COLORS[o.status], 'px-2 py-0.5 rounded-full')}>{ORDER_STATUS_LABELS[o.status]}</span>
                  <span className={cn('text-xs font-medium', isOverdue(o.deadline) ? 'text-red-600' : 'text-gray-500')}>
                    {formatDate(o.deadline)}
                  </span>
                </div>
              </Link>
            ))}
          {orders.filter((o: any) => o.deadline).length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Nenhum prazo cadastrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
