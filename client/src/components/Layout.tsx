import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, UtensilsCrossed, ShoppingCart, Wallet, ChefHat, Menu } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/stock', icon: Package, label: 'Stocks matières' },
  { path: '/produits', icon: UtensilsCrossed, label: 'Produits & Menu' },
  { path: '/commandes', icon: ShoppingCart, label: 'Commandes' },
  { path: '/tresorerie', icon: Wallet, label: 'Trésorerie' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-stone-900 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
      `}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-700">
          <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="leading-tight">
            <div className="text-white font-bold text-sm">Pâtisserie</div>
            <div className="text-amber-400 font-bold text-sm">Al-Baraka</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  active ? 'bg-amber-600 text-white' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-stone-700">
          <p className="text-stone-500 text-xs text-center">© {new Date().getFullYear()} Al-Baraka</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center px-4 py-3 bg-white border-b border-stone-200 gap-3">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg text-stone-500 hover:bg-stone-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-amber-600" />
            <span className="font-bold text-stone-800">Al-Baraka</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
