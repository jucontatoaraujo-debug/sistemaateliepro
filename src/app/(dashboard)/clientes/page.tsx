'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils';
import { Plus, Search, Phone, Instagram, Building2, Star, Edit, Trash2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ClientModal } from './client-modal';

export default function ClientesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list({ search, limit: 50 }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: clientsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente removido.');
    },
    onError: () => toast.error('Erro ao remover cliente.'),
  });

  const clients = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="text-gray-500 text-sm">{data?.total || 0} clientes cadastrados</p>
        </div>
        <button
          onClick={() => { setEditClient(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, email, WhatsApp..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm mt-1">Cadastre seu primeiro cliente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any) => (
            <div key={client.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-sm">
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <Link href={`/clientes/${client.id}`} className="font-semibold text-gray-900 hover:text-violet-600 transition-colors">
                      {client.name}
                    </Link>
                    {client.isCompany && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Building2 size={10} /> {client.companyName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditClient(client); setModalOpen(true); }} className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Remover cliente?')) deleteMutation.mutate(client.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {client.whatsapp && (
                  <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-600 transition-colors">
                    <Phone size={12} /> {client.whatsapp}
                  </a>
                )}
                {client.instagram && (
                  <a href={`https://instagram.com/${client.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-pink-600 transition-colors">
                    <Instagram size={12} /> {client.instagram}
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{client._count?.orders || 0} pedidos</span>
                <div className="flex gap-1 flex-wrap">
                  {client.tags?.slice(0, 3).map((tag: any) => (
                    <span key={tag.id} className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ClientModal
          client={editClient}
          onClose={() => { setModalOpen(false); setEditClient(null); }}
          onSuccess={() => {
            setModalOpen(false);
            setEditClient(null);
            queryClient.invalidateQueries({ queryKey: ['clients'] });
          }}
        />
      )}
    </div>
  );
}
