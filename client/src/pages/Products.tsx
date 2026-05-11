import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Loader2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { productsApi } from '../api/client';
import type { Product } from '../types';

const CATEGORIES = ['Viennoiseries', 'Cakes', 'Gâteaux', 'Boissons', 'Autres'];
const emptyForm = { name: '', category: 'Viennoiseries', price: 0, description: '', active: 1 };

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="font-semibold text-stone-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  'Viennoiseries': 'bg-amber-100 text-amber-700',
  'Cakes':         'bg-pink-100 text-pink-700',
  'Gâteaux':       'bg-purple-100 text-purple-700',
  'Boissons':      'bg-blue-100 text-blue-700',
  'Autres':        'bg-stone-100 text-stone-700',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState('Tous');

  const load = () => productsApi.getAll().then(setProducts).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const categories = ['Tous', ...CATEGORIES];
  const filtered = catFilter === 'Tous' ? products : products.filter(p => p.category === catFilter);
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {} as Record<string, Product[]>);

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (p: Product) => { setSelected(p); setForm({ name: p.name, category: p.category, price: p.price, description: p.description, active: p.active }); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await productsApi.create(form);
      else if (modal === 'edit' && selected) await productsApi.update(selected.id, form);
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return;
    await productsApi.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const toggleActive = async (p: Product) => {
    await productsApi.update(p.id, { ...p, active: p.active ? 0 : 1 });
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: x.active ? 0 : 1 } : x));
  };

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const btnPrimary = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50';
  const btnSecondary = 'border border-stone-300 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Produits & Menu</h1>
          <p className="text-stone-500 text-sm">{products.length} produits au total</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Nouveau produit
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${catFilter === c ? 'bg-amber-600 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="bg-white rounded-xl shadow-sm border border-stone-100">
              <div className="px-5 py-3 border-b border-stone-100">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[cat] || 'bg-stone-100 text-stone-700'}`}>{cat}</span>
              </div>
              <div className="divide-y divide-stone-50">
                {items.map(p => (
                  <div key={p.id} className={`flex items-center justify-between px-5 py-3 ${!p.active ? 'opacity-50' : ''}`}>
                    <div className="flex-1">
                      <p className="font-medium text-stone-800">{p.name}</p>
                      {p.description && <p className="text-xs text-stone-400 mt-0.5">{p.description}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-amber-700">{p.price.toFixed(2)} DA</span>
                      <button onClick={() => toggleActive(p)} title={p.active ? 'Désactiver' : 'Activer'} className="text-stone-400 hover:text-amber-600">
                        {p.active ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center text-stone-400 py-12">Aucun produit trouvé</div>
          )}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Nouveau produit' : 'Modifier produit'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Nom du produit</label>
              <input className={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Catégorie</label>
                <select className={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Prix (DA)</label>
                <input type="number" min="0" step="0.5" className={inp} value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Description</label>
              <input className={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className={btnSecondary}>Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.name} className={`flex-1 ${btnPrimary}`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
