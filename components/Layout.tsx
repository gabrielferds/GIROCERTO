
import React from 'react';
import { LayoutDashboard, Calendar, PlusCircle, History, Sparkles, Wrench, CreditCard } from 'lucide-react';
import { AppView } from '../types';

interface LayoutProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ activeView, setActiveView, children }) => {
  const navItems = [
    { id: 'dashboard', label: 'Resumo', icon: LayoutDashboard },
    { id: 'maintenance', label: 'Moto', icon: Wrench },
    { id: 'add', label: 'Lançar', icon: PlusCircle, primary: true },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'debts', label: 'Dívidas', icon: CreditCard },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-50 relative">
      {/* Header */}
      <header className="bg-orange-500 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold tracking-tight">GiroCerto</h1>
        <div className="bg-orange-600 px-3 py-1 rounded-full text-xs font-medium">
          #NoCorre
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4">
        {children}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 flex justify-around items-center px-2 py-3 shadow-lg z-30">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id as AppView)}
            className={`flex flex-col items-center justify-center transition-all duration-200 ${
              activeView === item.id 
                ? item.primary ? 'text-orange-600 scale-110' : 'text-orange-500 font-bold' 
                : 'text-slate-400'
            }`}
          >
            {item.primary ? (
              <div className="bg-orange-500 p-3 rounded-full text-white -mt-10 shadow-xl ring-4 ring-slate-50">
                <item.icon size={28} />
              </div>
            ) : (
              <item.icon size={24} />
            )}
            <span className={`text-[10px] mt-1 ${item.primary ? 'mt-2' : ''}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
