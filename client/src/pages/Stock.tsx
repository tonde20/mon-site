import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, History, Loader2, X, Search } from 'lucide-react';
import { ingredientsApi } from '../api/client';
import type { Ingredient, StockMovement } from '../types';

const UNITS = ['kg', 'g', 'L', 'mL', 'unité', 'sachet', 'boîte'];
const CATEGORIES = ['Farines', 'Sucres', 'Matières grasses', 'Produits laitiers', 'Levures', 'Chocolat', 'Fruits', 'Arômes', 'Condiments', 'Boissons', 'Général'];

const emptyForm = { name: '', category: 'Général', quantity: 0, unit: 'kg', min_quantity: 0, price_per_unit: 0, supplier: '' };

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

export default function Stock() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Tous');
  const [modal, setModal] = useState<'add' | 'edit' | 'move' | 'history' | null>(null);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [moveForm, setMoveForm] = useState({ type: 'in' as 'in' | 'out', quantity: 0, reason: '' });
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => ingredientsApi.getAll().then(setIngredients).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = ingredients.filter(i => {
    const matchCat = catFilter === 'Tous' || i.category === catFilter;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.supplier.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['Tous', ...Array.from(new Set(ingredients.map(i => i.category)))];

  const openAdd = () => { setForm(emptyForm); setModal('add'); };
  const openEdit = (i: Ingredient) => { setSelected(i); setForm({ name: i.name, category: i.category, quantity: i.quantity, unit: i.unit, min_quantity: i.min_quantity, price_per_unit: i.price_per_unit, supplier: i.supplier }); setModal('edit'); };
  const openMove = (i: Ingredient) => { setSelected(i); setMoveForm({ type: 'in', quantity: 0, reason: '' }); setModal('move'); };
  const openHistory = async (i: Ingredient) => {
    setSelected(i);
    setModal('history');
    const data = await ingredientsApi.getMovements(i.id);
    setMovements(data);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'add') await ingredientsApi.create(form);
      else if (modal === 'edit' && selected) await ingredientsApi.update(selected.id, form);
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleMove = async () => {
    if (!selected || moveForm.quantity <= 0) return;
    setSaving(true);
    try {
      await ingredientsApi.addMovement(selected.id, moveForm);
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet ingrédient ?')) return;
    await ingredientsApi.delete(id);
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const btnPrimary = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50';
  const btnSecondary = 'border border-stone-300 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  const totalValue = ingredients.reduce((s, i) => s + i.quantity * i.price_per_unit, 0);
  const lowCount = ingredients.filter(i => i.quantity <= i.min_quantity).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Gestion des Stocks</h1>
          <p className="text-stone-500 text-sm">{ingredients.length} ingrédients · {lowCount} alertes</p>
        </div>
        <button onClick={openAdd} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Nouvel ingrédient
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-stone-500 text-xs">Total articles</p>
          <p className="text-xl font-bold text-stone-800">{ingredients.length}</p>
        </div>
        <div className={`rounded-xl border p-4 ${lowCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-stone-100'}`}>
          <p className="text-stone-500 text-xs">Stock faible</p>
          <p className={`text-xl font-bold ${lowCount > 0 ? 'text-red-600' : 'text-stone-800'}`}>{lowCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-100 p-4">
          <p className="text-stone-500 text-xs">Valeur totale</p>
          <p className="text-xl font-bold text-stone-800">{totalValue.toFixed(0)} F CFA</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full border border-stone-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Ingrédient</th>
                  <th className="px-4 py-3 text-left">Catégorie</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right">Min.</th>
                  <th className="px-4 py-3 text-right">Prix/unité</th>
                  <th className="px-4 py-3 text-left">Fournisseur</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-stone-400 py-10">Aucun ingrédient trouvé</td></tr>
                ) : filtered.map(ing => {
                  const low = ing.quantity <= ing.min_quantity;
                  return (
                    <tr key={ing.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 font-medium text-stone-800">{ing.name}</td>
                      <td className="px-4 py-3 text-stone-500">{ing.category}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${low ? 'text-red-600' : 'text-green-600'}`}>
                        {ing.quantity} {ing.unit}
                        {low && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">faible</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-500">{ing.min_quantity} {ing.unit}</td>
                      <td className="px-4 py-3 text-right text-stone-500">{ing.price_per_unit} F CFA</td>
                      <td className="px-4 py-3 text-stone-500">{ing.supplier || '–'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openMove(ing)} title="Entrée stock" className="p-1.5 rounded-lg hover:bg-green-100 text-green-600"><TrendingUp className="w-4 h-4" /></button>
                          <button onClick={() => openMove(ing)} title="Sortie stock" className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><TrendingDown className="w-4 h-4" /></button>
                          <button onClick={() => openHistory(ing)} title="Historique" className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-500"><History className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(ing)} className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(ing.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
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

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Nouvel ingrédient' : 'Modifier ingrédient'} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-stone-600 block mb-1">Nom</label>
                <input className={inp} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Catégorie</label>
                <select className={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Unité</label>
                <select className={inp} value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {modal === 'add' && (
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1">Quantité initiale</label>
                  <input type="number" min="0" step="0.1" className={inp} value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Quantité min.</label>
                <input type="number" min="0" step="0.1" className={inp} value={form.min_quantity} onChange={e => setForm(p => ({ ...p, min_quantity: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Prix / unité (DA)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.price_per_unit} onChange={e => setForm(p => ({ ...p, price_per_unit: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-stone-600 block mb-1">Fournisseur</label>
                <input className={inp} value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} />
              </div>
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

      {modal === 'move' && selected && (
        <Modal title={`Mouvement de stock – ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setMoveForm(p => ({ ...p, type: 'in' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${moveForm.type === 'in' ? 'bg-green-600 text-white border-green-600' : 'border-stone-300 text-stone-600'}`}>
                + Entrée
              </button>
              <button onClick={() => setMoveForm(p => ({ ...p, type: 'out' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${moveForm.type === 'out' ? 'bg-red-500 text-white border-red-500' : 'border-stone-300 text-stone-600'}`}>
                – Sortie
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Quantité ({selected.unit})</label>
              <input type="number" min="0.01" step="0.1" className={inp} value={moveForm.quantity || ''} onChange={e => setMoveForm(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} />
              <p className="text-xs text-stone-400 mt-1">Stock actuel : {selected.quantity} {selected.unit}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Motif (optionnel)</label>
              <input className={inp} placeholder="Ex: Livraison, Utilisation recette…" value={moveForm.reason} onChange={e => setMoveForm(p => ({ ...p, reason: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(null)} className={btnSecondary}>Annuler</button>
              <button onClick={handleMove} disabled={saving || moveForm.quantity <= 0} className={`flex-1 ${btnPrimary}`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Confirmer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {modal === 'history' && selected && (
        <Modal title={`Historique – ${selected.name}`} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center text-stone-400 py-8">Aucun mouvement enregistré</p>
            ) : movements.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                <div>
                  <p className="text-sm text-stone-800">{m.reason || (m.type === 'in' ? 'Entrée' : 'Sortie')}</p>
                  <p className="text-xs text-stone-400">{new Date(m.date).toLocaleString('fr-FR')}</p>
                </div>
                <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                  {m.type === 'in' ? '+' : '–'}{m.quantity} {selected.unit}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
