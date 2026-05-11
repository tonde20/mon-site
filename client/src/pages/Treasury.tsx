import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, X, Download, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { treasuryApi } from '../api/client';
import type { Transaction, MonthlySummary } from '../types';

const INCOME_CATEGORIES = ['Ventes', 'Livraisons', 'Prestations', 'Autres recettes'];
const EXPENSE_CATEGORIES = ['Matières premières', 'Charges fixes', 'Salaires', 'Équipements', 'Marketing', 'Taxes', 'Autres dépenses'];
const PAYMENT_METHODS = ['cash', 'virement', 'chèque', 'mobile'];
const PAY_LABEL: Record<string, string> = { cash: 'Espèces', virement: 'Virement', chèque: 'Chèque', mobile: 'Mobile' };

const PIE_COLORS = ['#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#10b981', '#3b82f6', '#8b5cf6'];

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' F CFA';

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

export default function Treasury() {
  const today = new Date();
  const [month, setMonth] = useState(format(today, 'yyyy-MM'));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | null>(null);
  const [form, setForm] = useState({ type: 'income' as 'income' | 'expense', category: 'Ventes', amount: 0, description: '', date: format(today, 'yyyy-MM-dd'), payment_method: 'cash' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'all'>('all');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      treasuryApi.getAll(month),
      treasuryApi.getSummary(month),
    ]).then(([t, s]) => { setTransactions(t); setSummary(s); }).finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const income = transactions.filter(t => t.type === 'income');
  const expense = transactions.filter(t => t.type === 'expense');
  const displayed = activeTab === 'all' ? transactions : transactions.filter(t => t.type === activeTab);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await treasuryApi.create(form);
      await load();
      setModal(null);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette transaction ?')) return;
    await treasuryApi.delete(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    load();
  };

  const generatePDF = () => {
    if (!summary) return;
    const doc = new jsPDF();
    const monthLabel = format(parseISO(month + '-01'), 'MMMM yyyy', { locale: fr });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(120, 53, 15);
    doc.text('Pâtisserie Al-Baraka', 105, 22, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(60, 40, 20);
    doc.text(`Rapport mensuel – ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`, 105, 32, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150, 130, 100);
    doc.text(`Généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm')}`, 105, 40, { align: 'center' });

    doc.setDrawColor(200, 180, 140);
    doc.line(14, 44, 196, 44);

    autoTable(doc, {
      startY: 50,
      head: [['Résumé financier', 'Montant']],
      body: [
        ['Total recettes', `${summary.total_income.toFixed(0)} F CFA`],
        ['Total dépenses', `${summary.total_expense.toFixed(0)} F CFA`],
        ['Bénéfice net', `${summary.net_balance.toFixed(0)} F CFA`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255] },
      bodyStyles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    const afterSummary = (doc as any).lastAutoTable.finalY + 10;

    if (income.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(0, 100, 0);
      doc.text('Recettes', 14, afterSummary);

      autoTable(doc, {
        startY: afterSummary + 5,
        head: [['Date', 'Catégorie', 'Description', 'Mode', 'Montant']],
        body: income.map(t => [t.date, t.category, t.description || '–', PAY_LABEL[t.payment_method] || t.payment_method, `${t.amount.toFixed(0)} F CFA`]),
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 4: { halign: 'right' } },
        foot: [['', '', '', 'Total', `${summary.total_income.toFixed(0)} F CFA`]],
        footStyles: { fontStyle: 'bold', fillColor: [220, 252, 231] },
      });
    }

    const afterIncome = (doc as any).lastAutoTable?.finalY ?? afterSummary;

    if (expense.length > 0) {
      const yPos = afterIncome + 10;
      if (yPos > 260) doc.addPage();
      const y = yPos > 260 ? 20 : yPos;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(180, 0, 0);
      doc.text('Dépenses', 14, y);

      autoTable(doc, {
        startY: y + 5,
        head: [['Date', 'Catégorie', 'Description', 'Mode', 'Montant']],
        body: expense.map(t => [t.date, t.category, t.description || '–', PAY_LABEL[t.payment_method] || t.payment_method, `${t.amount.toFixed(0)} F CFA`]),
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 4: { halign: 'right' } },
        foot: [['', '', '', 'Total', `${summary.total_expense.toFixed(0)} F CFA`]],
        footStyles: { fontStyle: 'bold', fillColor: [254, 226, 226] },
      });
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} / ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`rapport-${month}.pdf`);
  };

  const openAdd = (type?: 'income' | 'expense') => {
    const t = type || 'income';
    setForm({ type: t, category: t === 'income' ? 'Ventes' : 'Matières premières', amount: 0, description: '', date: format(today, 'yyyy-MM-dd'), payment_method: 'cash' });
    setModal('add');
  };

  const inp = 'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
  const btnPrimary = 'bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50';
  const btnSecondary = 'border border-stone-300 hover:bg-stone-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors';

  const fmtDay = (d: string) => format(parseISO(d), 'dd/MM', { locale: fr });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Trésorerie</h1>
          <p className="text-stone-500 text-sm">{transactions.length} transactions ce mois</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          <button onClick={() => openAdd()} className={btnPrimary}><Plus className="w-4 h-4" /> Transaction</button>
          <button onClick={generatePDF} disabled={!summary} className="bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> Rapport PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>
      ) : summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-stone-500 text-sm">Recettes</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{fmt(summary.total_income)}</p>
              <p className="text-xs text-stone-400 mt-1">{income.length} transactions</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <p className="text-stone-500 text-sm">Dépenses</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{fmt(summary.total_expense)}</p>
              <p className="text-xs text-stone-400 mt-1">{expense.length} transactions</p>
            </div>
            <div className={`rounded-xl p-5 border ${summary.net_balance >= 0 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Scale className="w-4 h-4 text-amber-600" />
                <p className="text-stone-500 text-sm">Bénéfice net</p>
              </div>
              <p className={`text-2xl font-bold ${summary.net_balance >= 0 ? 'text-amber-700' : 'text-red-600'}`}>{fmt(summary.net_balance)}</p>
              <p className="text-xs text-stone-400 mt-1">
                {summary.total_income > 0 ? `Marge : ${((summary.net_balance / summary.total_income) * 100).toFixed(1)}%` : '–'}
              </p>
            </div>
          </div>

          {summary.daily_balances.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
              <h2 className="text-base font-semibold text-stone-800 mb-4">Évolution du mois</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={summary.daily_balances} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                  <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={fmtDay} />
                  <Legend />
                  <Line type="monotone" dataKey="income" name="Recettes" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" name="Dépenses" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {(summary.income_by_category.length > 0 || summary.expense_by_category.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {summary.income_by_category.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3">Recettes par catégorie</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={summary.income_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={65} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {summary.income_by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
              {summary.expense_by_category.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-stone-100 p-5">
                  <h3 className="text-sm font-semibold text-stone-700 mb-3">Dépenses par catégorie</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={summary.expense_by_category} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={65} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {summary.expense_by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-100">
        <div className="p-4 border-b border-stone-100 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {(['all', 'income', 'expense'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>
                {tab === 'all' ? 'Tout' : tab === 'income' ? `Recettes (${income.length})` : `Dépenses (${expense.length})`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => openAdd('income')} className="text-xs bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium">+ Recette</button>
            <button onClick={() => openAdd('expense')} className="text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium">+ Dépense</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50 text-xs text-stone-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Catégorie</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Mode</th>
                <th className="px-4 py-3 text-right">Montant</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {displayed.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-stone-400 py-10">Aucune transaction ce mois-ci</td></tr>
              ) : displayed.map(t => (
                <tr key={t.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-500">{format(parseISO(t.date), 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? 'Recette' : 'Dépense'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{t.category}</td>
                  <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">{t.description || '–'}</td>
                  <td className="px-4 py-3 text-stone-500">{PAY_LABEL[t.payment_method] || t.payment_method}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '–'}{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'add' && (
        <Modal title="Nouvelle transaction" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button onClick={() => setForm(p => ({ ...p, type: 'income', category: 'Ventes' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'income' ? 'bg-green-600 text-white border-green-600' : 'border-stone-300 text-stone-600'}`}>
                Recette
              </button>
              <button onClick={() => setForm(p => ({ ...p, type: 'expense', category: 'Matières premières' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === 'expense' ? 'bg-red-500 text-white border-red-500' : 'border-stone-300 text-stone-600'}`}>
                Dépense
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Catégorie</label>
              <select className={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Montant (F CFA)</label>
                <input type="number" min="0" step="0.01" className={inp} value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1">Date</label>
                <input type="date" className={inp} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Mode de paiement</label>
              <select className={inp} value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{PAY_LABEL[m]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-stone-600 block mb-1">Description</label>
              <input className={inp} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setModal(null)} className={btnSecondary}>Annuler</button>
              <button onClick={handleAdd} disabled={saving || form.amount <= 0} className={`flex-1 ${btnPrimary}`}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
