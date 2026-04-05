'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi, machinesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import { Settings, Users, Factory, Save, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ConfiguracoesPage() {
  const [tab, setTab] = useState('atelie');
  const queryClient = useQueryClient();

  const { data: tenant } = useQuery({ queryKey: ['tenant'], queryFn: () => tenantApi.me().then(r => r.data) });
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: () => tenantApi.getUsers().then(r => r.data) });
  const { data: machines } = useQuery({ queryKey: ['machines'], queryFn: () => machinesApi.list().then(r => r.data) });

  return (
    <div className="space-y-6">
      <div>
        <h1>Configurações</h1>
        <p className="text-gray-500 text-sm">Gerencie seu ateliê e usuários</p>
      </div>

      <div className="flex gap-1">
        {[
          { key: 'atelie', label: 'Ateliê', icon: Settings },
          { key: 'usuarios', label: 'Usuários', icon: Users },
          { key: 'maquinas', label: 'Máquinas', icon: Factory },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border', tab === t.key ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-600 hover:bg-gray-50')}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'atelie' && tenant && <TenantSettings tenant={tenant} />}
      {tab === 'usuarios' && <UsersSettings users={users || []} />}
      {tab === 'maquinas' && <MachinesSettings machines={machines || []} />}
    </div>
  );
}

function TenantSettings({ tenant }: { tenant: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: tenant.name, phone: tenant.phone || '', address: tenant.address || '' });

  const mutation = useMutation({
    mutationFn: () => tenantApi.update(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tenant'] }); toast.success('Configurações salvas!'); },
    onError: () => toast.error('Erro ao salvar.'),
  });

  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm max-w-lg space-y-4">
      <h3 className="font-semibold text-gray-900">Dados do Ateliê</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
        <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input w-full" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
        <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input w-full" placeholder="(11) 99999-0000" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
        <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input w-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 py-2 bg-gray-50 rounded-lg px-3">
        <div><p className="text-xs text-gray-500">Plano</p><p className="font-semibold text-sm">{tenant.plan}</p></div>
        <div><p className="text-xs text-gray-500">Slug</p><p className="font-semibold text-sm">{tenant.slug}</p></div>
        <div><p className="text-xs text-gray-500">Clientes</p><p className="font-semibold text-sm">{tenant._count?.clients || 0}</p></div>
        <div><p className="text-xs text-gray-500">Pedidos</p><p className="font-semibold text-sm">{tenant._count?.orders || 0}</p></div>
      </div>
      <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
        {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Salvar
      </button>
    </div>
  );
}

function UsersSettings({ users }: { users: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OPERATOR' });

  const mutation = useMutation({
    mutationFn: () => tenantApi.createUser(form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('Usuário criado!'); setForm({ name: '', email: '', password: '', role: 'OPERATOR' }); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro.'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: any) => tenantApi.updateUser(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const ROLE_LABELS: Record<string, string> = { OWNER: 'Proprietário', ADMIN: 'Admin', DESIGNER: 'Designer', OPERATOR: 'Operador', FINANCIAL: 'Financeiro' };

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Usuários ({users.length})</h3>
        <div className="space-y-2">
          {users.map(user => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-8 h-8 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center text-sm font-bold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email} · {ROLE_LABELS[user.role]}</p>
              </div>
              <button
                onClick={() => toggleActive.mutate({ id: user.id, isActive: !user.isActive })}
                className={cn('text-xs px-2 py-1 rounded-lg font-medium', user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}
              >
                {user.isActive ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Adicionar Usuário</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome" className="input" />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email" className="input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Senha" className="input" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="input">
              <option value="OPERATOR">Operador</option>
              <option value="DESIGNER">Designer</option>
              <option value="FINANCIAL">Financeiro</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name || !form.email || !form.password} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

function MachinesSettings({ machines }: { machines: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', model: '', heads: '1' });

  const mutation = useMutation({
    mutationFn: () => machinesApi.create({ ...form, heads: parseInt(form.heads) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['machines'] }); toast.success('Máquina cadastrada!'); setForm({ name: '', model: '', heads: '1' }); },
  });

  return (
    <div className="space-y-5 max-w-lg">
      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Máquinas ({machines.length})</h3>
        <div className="space-y-2">
          {machines.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Factory size={16} className="text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{m.name}</p>
                {m.model && <p className="text-xs text-gray-500">{m.model} · {m.heads} cabeças</p>}
              </div>
            </div>
          ))}
          {machines.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Nenhuma máquina cadastrada</p>}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Adicionar Máquina</h3>
        <div className="space-y-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome da máquina *" className="input w-full" />
          <div className="grid grid-cols-2 gap-3">
            <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Modelo" className="input" />
            <input value={form.heads} onChange={e => setForm({...form, heads: e.target.value})} type="number" placeholder="Cabeças" className="input" min="1" />
          </div>
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.name} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            <Plus size={14} /> Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}
