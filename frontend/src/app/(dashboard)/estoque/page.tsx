'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Plus, Search, Package, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_LABELS: Record<string, string> = {
  CAMISETA: 'Camiseta', BONE: 'Boné', UNIFORME: 'Uniforme', TOALHA: 'Toalha',
  MOCHILA: 'Mochila', BOLSA: 'Bolsa', LINHA: 'Linha', MATERIAL: 'Material', OUTRO: 'Outro',
};

export default function EstoquePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockModal, setStockModal] = useState<any>(null);
  const [productModal, setProductModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, category],
    queryFn: () => productsApi.list({ search, category: category || undefined, limit: 50 }).then(r => r.data),
  });

  const adjustStock = useMutation({
    mutationFn: ({ id, type, quantity, reason }: any) => productsApi.adjustStock(id, { type, quantity: parseInt(quantity), reason }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); toast.success('Estoque atualizado!'); setStockModal(null); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro.'),
  });

  const products = data?.data || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1>Estoque</h1>
          <p className="text-gray-500 text-sm">Controle de produtos e materiais</p>
        </div>
        <button onClick={() => setProductModal(true)} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produtos..." className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="input w-44">
          <option value="">Todas categorias</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => {
            const isLow = product.stock <= product.minStock;
            return (
              <div key={product.id} className={cn('bg-white border rounded-xl p-5 shadow-sm', isLow && 'border-yellow-300')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                    <span className="text-xs text-gray-400">{CATEGORY_LABELS[product.category]}</span>
                    {product.sku && <span className="text-xs text-gray-400 ml-2">· {product.sku}</span>}
                  </div>
                  {isLow && <AlertTriangle size={16} className="text-yellow-500 flex-shrink-0" />}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className={cn('text-2xl font-bold', isLow ? 'text-yellow-600' : 'text-gray-900')}>{product.stock}</p>
                    <p className="text-xs text-gray-400">{product.unit} · mín: {product.minStock}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStockModal({ product, type: 'IN' })}
                      className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => setStockModal({ product, type: 'OUT' })}
                      className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">
              <Package size={48} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum produto cadastrado</p>
            </div>
          )}
        </div>
      )}

      {/* Stock Modal */}
      {stockModal && (
        <StockModal
          product={stockModal.product}
          type={stockModal.type}
          onClose={() => setStockModal(null)}
          onSubmit={(quantity: number, reason: string) =>
            adjustStock.mutate({ id: stockModal.product.id, type: stockModal.type, quantity, reason })
          }
        />
      )}

      {/* Product Modal */}
      {productModal && (
        <ProductCreateModal
          onClose={() => setProductModal(false)}
          onSuccess={() => { setProductModal(false); queryClient.invalidateQueries({ queryKey: ['products'] }); }}
        />
      )}
    </div>
  );
}

function StockModal({ product, type, onClose, onSubmit }: any) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-semibold text-gray-900 mb-1">{type === 'IN' ? 'Entrada de Estoque' : 'Saída de Estoque'}</h3>
        <p className="text-sm text-gray-500 mb-4">{product.name} · Atual: {product.stock}</p>
        <div className="space-y-3">
          <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantidade" className="input w-full" min="1" />
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo (opcional)" className="input w-full" />
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => onSubmit(parseInt(quantity), reason)}
            disabled={!quantity || parseInt(quantity) <= 0}
            className={cn('flex-1 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50', type === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700')}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCreateModal({ onClose, onSuccess }: any) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', category: 'CAMISETA', sku: '', stock: '0', minStock: '5', unit: 'un' });

  const mutation = useMutation({
    mutationFn: () => productsApi.create({ ...form, stock: parseInt(form.stock), minStock: parseInt(form.minStock) }),
    onSuccess: () => { toast.success('Produto criado!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Erro.'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h3 className="font-semibold text-gray-900 mb-4">Novo Produto</h3>
        <div className="space-y-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome do produto *" className="input w-full" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="input">
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={form.sku} onChange={e => setForm({...form, sku: e.target.value})} placeholder="SKU" className="input" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} placeholder="Estoque" className="input" />
            <input type="number" value={form.minStock} onChange={e => setForm({...form, minStock: e.target.value})} placeholder="Est. mín" className="input" />
            <input value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} placeholder="un/m/kg" className="input" />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending} className="flex-1 bg-violet-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {mutation.isPending ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
