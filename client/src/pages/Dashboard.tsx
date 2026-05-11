import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, ShoppingCart, Package, AlertTriangle, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { dashboardApi } from '../api/client';
import type { DashboardStats, Order } from '../types';

const STATUS_CONFIG = {
  pending:     { label: 'En attente',     cls: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: 'En préparation', cls: 'bg-blue-100 text-blue-800' },
  ready:       { label: 'Prêt',           cls: 'bg-green-100 text-green-800' },
  delivered:   { label: 'Livré',          cls: 'bg-stone-100 text-stone-600' },
  cancelled:   { label: 'Annulé',         cls: 'bg-red-100 text-red-800' },
};

const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DA';
const fmtDay = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

function StatCard({ title, value, sub, icon: Icon, color }: { title: string; value: string; sub?: string; icon: any; color: string }) {
  const cfg: Record<string, { card: string; icon: string }> = {
    green: { card: 'border-green-100', icon: 'bg-green-100 text-green-600' },
    blue:  { card: 'border-blue-100',  icon: 'bg-blue-100 text-blue-600' },
    amber: { card: 'border-amber-100', icon: 'bg-amber-100 text-amber-600' },
    red:   { card: 'border-red-100',   icon: 'bg-red-100 text-red-600' },
  };
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-5 ${cfg[color].card}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-stone-500 text-sm">{title}</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{value}</p>
          {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg[color].icon}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
    </div>
  );
  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-800">Tableau de bord</h1>
        <p className="text-stone-500 text-sm mt-0.5">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="CA du jour" value={fmt(stats.today_revenue)} icon={TrendingUp} color="green" />
        <StatCard title="CA du mois" value={fmt(stats.monthly_revenue)} sub={`Dépenses : ${fmt(stats.monthly_expense)}`} icon={Calendar} color="blue" />
        <StatCard title="Commandes en cours" value={String(stats.pending_orders)} icon={ShoppingCart} color="amber" />
        <StatCard title="Alertes stock" value={String(stats.low_stock_count)} icon={AlertTriangle} color="red" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3 bg-white rounded-xl shadow-sm border border-stone-100 p-5">
          <h2 className="text-base font-semibold text-stone-800 mb-4">Recettes vs Dépenses – 7 derniers jours</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.daily_revenue} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="date" tickFormatter={fmtDay} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={fmtDay} />
              <Legend />
              <Bar dataKey="income" name="Recettes" fill="#d97706" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-stone-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-stone-800">Commandes récentes</h2>
            <Link to="/commandes" className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1">
              Voir tout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recent_orders.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">Aucune commande</p>
            ) : (
              stats.recent_orders.map((o: Order) => {
                const s = STATUS_CONFIG[o.status];
                return (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">{o.customer_name}</p>
                      <p className="text-xs text-stone-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{fmt(o.total_amount)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {stats.low_stock_count > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-semibold text-stone-800">Stock faible – réapprovisionner</h2>
            </div>
            <Link to="/stock" className="text-amber-600 hover:text-amber-700 text-xs font-medium flex items-center gap-1">
              Gérer le stock <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stats.low_stock_items.map(item => (
              <div key={item.id} className="bg-red-50 border border-red-100 rounded-lg p-3">
                <p className="font-medium text-stone-800 text-sm truncate">{item.name}</p>
                <p className="text-red-600 text-sm font-semibold mt-1">{item.quantity} {item.unit}</p>
                <p className="text-stone-400 text-xs">min : {item.min_quantity}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
