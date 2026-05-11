import { useState, useEffect } from 'react';
import { Plus, Eye, Trash2, Loader2, X, Minus, ChevronDown } from 'lucide-react';
import { ordersApi, productsApi } from '../api/client';
import type { Order, OrderItem, Product, OrderStatus } from '../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; cls: string; next?: OrderStatus }> = {
  pending:     { label: 'En attente',     cls: 'bg-yellow-100 text-yellow-700', next: 'in_progress' },
  in_progress: { label: 'En préparation', cls: 'bg-blue-100 text-blue-700',    next: 'ready' },
  ready:       { label: 'Prêt',           cls: 'bg-green-100 text-green-700',  next: 'delivered' },
  delivered:   { label: 'Livré',          cls: 'bg-stone-100 text-stone-600' },
  cancelled:   { label: 'Annulé',         cls: 'bg-red-100 text-red-600' },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'in_progress', 'ready', 'delivered', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'virement', 'chèque', 'mobile'];
const PAY_LABEL: Record<string, string> = { cash: 'Espèces', virement: 'Virement', chèque: 'Chèque', mobile: 'Mobile' };

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F CFA';

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 flex-shrink-0">
          <h3 className="font-semibold text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  'Viennoiseries': 'bg-amber-50 border-amber-200',
  'Cakes':         'bg-pink-50 border-pink-200',
  'Gâteaux':       'bg-purple-50 border-purple-200',
  'Boissons':      'bg-blue-50 border-blue-200',
  'Autres':        'bg-stone-50 border-stone-200',
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modal, setModal] = useState<'new' | 'view' | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  const [newOrder, setNewOrder] = useState({ customer_name: '', customer_phone: '', payment_method: 'cash', notes: '', delivery_date: '' });
  const [cart, setCart] = useState<OrderItem[]>([]);

  const load = () => ordersApi.getAll().then(setOrders).finally(() => setLoading(false));
  useEffect(() => {
    load();
    productsApi.getAll().then((p: Product[]) => setProducts(p.filter(x => x.active)));
  }, []);

  const filtered = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  const counts = ALL_STATUSES.reduce((acc, s) => { acc[s] = orders.filter(o => o.status === s).length; return acc; }, {} as Record<string, number>);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === p.id);
      if (existing) return prev.map(i => i.product_id === p.id ? { ...i, quantity: i.quantity + 1, total_price: (i.quantity + 1) * i.unit_price } : i);
      return [...prev, { product_id: p.id, product_name: p.name, quantity: 1, unit_price: p.price, total_price: p.price }];
    });
  };

  const removeFromCart = (pid: number | undefined) => setCart(prev => prev.filter(i => i.product_id !== pid));
  const updateQty = (pid: number | undefined, qty: number) => {
    if (qty <= 0) { removeFromCart(pid); return; }
    setCart(prev => prev.map(i => i.product_id === pid ? { ...i, quantity: qty, total_price: qty * i.unit_price } : i));
  };

  const total = cart.reduce((s, i) => s + i.total_price, 0);

  const handleCreate = async () => {
    if (!newOrder.customer_name || cart.length === 0) return;
    setSaving(true);
    try {
      await ordersApi.create({ ...newOrder, items: cart });
      await load();
      setModal(null);
      setCart([]);
      setNewOrder({ customer_name: '', customer_phone: '', payment_method: 'cash', notes: '', delivery_date: '' });
    } finally { setSaving(false); }
  };

  const handleStatusUpdate = async (id: number, status: OrderStatus) => {
    await ordersApi.updateStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette commande ?')) return;
    await ordersApi.delete(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setModal(null);
  };

  const openView = async (o: Order) => {
    const detail = await ordersApi.getById(o.id);
    setSelected(detail);
    setModal('view');
  };

  const openNew = () => { setCart([]); setNewOrder({ customer_name: '', customer_phone: '', payment_method: 'cash', notes: '', delivery_date: '' }); setModal('new'); };

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const btnPrimary = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50';
  const btnSecondary = 'border border-stone-300 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  const grouped = products.reduce((acc, p) => { if (!acc[p.category]) acc[p.category] = []; acc[p.category].push(p); return acc; }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Commandes</h1>
          <p className="text-stone-500 text-sm">{orders.length} commandes au total</p>
        </div>
        <button onClick={openNew} className={btnPrimary}><Plus className="w-4 h-4" /> Nouvelle commande</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {ALL_STATUSES.map(s => (
          <div key={s} className={`bg-white rounded-xl border p-3 cursor-pointer transition-all ${statusFilter === s ? 'ring-2 ring-amber-500' : ''}`} onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}>
            <p className="text-xs text-stone-500">{STATUS_CONFIG[s].label}</p>
            <p className="text-xl font-bold text-stone-800">{counts[s]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100 flex gap-2 flex-wrap">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
            Tous ({orders.length})
          </button>
          {ALL_STATUSES.map(s => counts[s] > 0 && (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
              {STATUS_CONFIG[s].label} ({counts[s]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Client</th>
                  <th className="px-4 py-3 text-left">Téléphone</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Paiement</th>
                  <th className="px-4 py-3 text-left">Statut</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Livraison</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-stone-400 py-10">Aucune commande</td></tr>
                ) : filtered.map(o => {
                  const s = STATUS_CONFIG[o.status];
                  return (
                    <tr key={o.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-500">#{o.id}</td>
                      <td className="px-4 py-3 font-medium text-stone-800">{o.customer_name}</td>
                      <td className="px-4 py-3 text-stone-500">{o.customer_phone || '–'}</td>
                      <td className="px-4 py-3 text-right font-semibold text-stone-800">{fmt(o.total_amount)}</td>
                      <td className="px-4 py-3 text-stone-500">{PAY_LABEL[o.payment_method] || o.payment_method}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-stone-500">{o.delivery_date ? new Date(o.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR') : '–'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openView(o)} className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500"><Eye className="w-4 h-4" /></button>
                          {s.next && (
                            <button onClick={() => handleStatusUpdate(o.id, s.next!)} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600 text-xs font-medium">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal === 'new' && (
        <Modal title="Nouvelle commande" onClose={() => setModal(null)} wide>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-stone-700">Informations client</h4>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Nom du client *</label>
                <input className={inp} value={newOrder.customer_name} onChange={e => setNewOrder(p => ({ ...p, customer_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Téléphone</label>
                <input className={inp} value={newOrder.customer_phone} onChange={e => setNewOrder(p => ({ ...p, customer_phone: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Mode de paiement</label>
                <select className={inp} value={newOrder.payment_method} onChange={e => setNewOrder(p => ({ ...p, payment_method: e.target.value }))}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAY_LABEL[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Date de livraison</label>
                <input type="date" className={inp} value={newOrder.delivery_date} onChange={e => setNewOrder(p => ({ ...p, delivery_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Notes / personnalisation</label>
                <textarea className={`${inp} resize-none`} rows={3} value={newOrder.notes} onChange={e => setNewOrder(p => ({ ...p, notes: e.target.value }))} />
              </div>

              <div className="border-t border-stone-100 pt-3">
                <h4 className="font-medium text-stone-700 mb-2">Panier ({cart.length} articles)</h4>
                {cart.length === 0 ? (
                  <p className="text-stone-400 text-sm">Sélectionnez des produits →</p>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.product_id} className="flex items-center gap-2">
                        <span className="text-sm flex-1 truncate">{item.product_name}</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item.product_id ?? undefined, item.quantity - 1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                          <span className="text-sm w-6 text-center">{item.quantity}</span>
                          <button onClick={() => updateQty(item.product_id ?? undefined, item.quantity + 1)} className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                        </div>
                        <span className="text-sm font-medium text-amber-700 w-20 text-right">{fmt(item.total_price)}</span>
                        <button onClick={() => removeFromCart(item.product_id ?? undefined)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-stone-100 font-semibold">
                      <span>Total</span><span className="text-amber-700">{fmt(total)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setModal(null)} className={btnSecondary}>Annuler</button>
                <button onClick={handleCreate} disabled={saving || !newOrder.customer_name || cart.length === 0} className={`flex-1 ${btnPrimary}`}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer ({fmt(total)})
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <h4 className="font-medium text-stone-700 sticky top-0 bg-white pb-1">Catalogue produits</h4>
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{cat}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)} className={`text-left p-2.5 rounded-xl border text-sm transition-all hover:shadow-sm ${CATEGORY_COLORS[p.category] || 'bg-stone-50 border-stone-200'}`}>
                        <p className="font-medium text-stone-800 text-xs leading-tight">{p.name}</p>
                        <p className="text-amber-700 font-semibold text-xs mt-1">{p.price.toLocaleString('fr-FR')} F CFA</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {modal === 'view' && selected && (
        <Modal title={`Commande #${selected.id}`} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-stone-400 text-xs">Client</p><p className="font-medium">{selected.customer_name}</p></div>
              <div><p className="text-stone-400 text-xs">Téléphone</p><p className="font-medium">{selected.customer_phone || '–'}</p></div>
              <div><p className="text-stone-400 text-xs">Paiement</p><p className="font-medium">{PAY_LABEL[selected.payment_method] || selected.payment_method}</p></div>
              <div><p className="text-stone-400 text-xs">Livraison</p><p className="font-medium">{selected.delivery_date ? new Date(selected.delivery_date + 'T00:00:00').toLocaleDateString('fr-FR') : '–'}</p></div>
              {selected.notes && <div className="col-span-2"><p className="text-stone-400 text-xs">Notes</p><p className="font-medium">{selected.notes}</p></div>}
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Articles commandés</p>
              <div className="border border-stone-100 rounded-xl overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-stone-50 text-xs text-stone-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Produit</th>
                      <th className="px-3 py-2 text-center">Qté</th>
                      <th className="px-3 py-2 text-right">Prix unit.</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {(selected.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2">{item.product_name}{item.customization ? <span className="text-stone-400 text-xs ml-1">({item.customization})</span> : ''}</td>
                        <td className="px-3 py-2 text-center">{item.quantity}</td>
                        <td className="px-3 py-2 text-right">{fmt(item.unit_price)}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(item.total_price)}</td>
                      </tr>
                    ))}
                    <tr className="bg-amber-50">
                      <td colSpan={3} className="px-3 py-2 text-right font-semibold">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-amber-700">{fmt(selected.total_amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Changer le statut</p>
              <div className="flex flex-wrap gap-2">
                {ALL_STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusUpdate(selected.id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${selected.status === s ? STATUS_CONFIG[s].cls + ' border-transparent' : 'border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleDelete(selected.id)} className="border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <button onClick={() => setModal(null)} className={`flex-1 ${btnPrimary}`}>Fermer</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
