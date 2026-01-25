
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { DailyEntry, ExpenseCategory, MaintenanceItem, BikeInfo, ReplacementGoal, ExpenseDebt } from '../types';
import { COLORS } from '../constants';
import { format, isSameMonth, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { TrendingUp, Fuel, Calendar, Zap, DollarSign, Wrench, RefreshCcw, CreditCard, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  entries: DailyEntry[];
  maintenanceItems: MaintenanceItem[];
  bikeInfo: BikeInfo | null;
  replacementGoal: ReplacementGoal | null;
  plannedWorkDays: number;
  debts: ExpenseDebt[];
}

const DashboardCharts: React.FC<DashboardProps> = ({ entries, maintenanceItems, bikeInfo, replacementGoal, plannedWorkDays, debts }) => {
  const [lineFilter, setLineFilter] = useState<'week' | 'month' | 'last10'>('week');

  const estimatedBikeValue = useMemo(() => {
    if (!bikeInfo) return 0;
    const basePrice = 15000;
    const age = new Date().getFullYear() - bikeInfo.year;
    let value = basePrice - (age * 800);
    if (bikeInfo.condition === 'excellent') value *= 1.05;
    if (bikeInfo.condition === 'regular') value *= 0.85;
    if (bikeInfo.condition === 'bad') value *= 0.70;
    if (bikeInfo.usage === 'work') value *= 0.90;
    return Math.max(value, 3000);
  }, [bikeInfo]);

  const monthlyMaintReserve = useMemo(() => {
    return maintenanceItems.reduce((acc, curr) => acc + (curr.qtyPerYear * curr.unitValue), 0) / 12;
  }, [maintenanceItems]);

  const monthlyReplacementReserve = useMemo(() => {
    if (!replacementGoal || !bikeInfo) return 0;
    const gap = replacementGoal.targetPrice - (bikeInfo.manualValue || estimatedBikeValue);
    return gap > 0 ? gap / replacementGoal.monthsToGoal : 0;
  }, [replacementGoal, bikeInfo, estimatedBikeValue]);

  const monthlyDebtPayment = useMemo(() => {
    return debts.filter(d => d.status === 'active').reduce((acc, curr) => acc + curr.installmentValue, 0);
  }, [debts]);

  const dailyMaintCost = useMemo(() => plannedWorkDays > 0 ? monthlyMaintReserve / plannedWorkDays : 0, [monthlyMaintReserve, plannedWorkDays]);
  const dailyReplacementCost = useMemo(() => plannedWorkDays > 0 ? monthlyReplacementReserve / plannedWorkDays : 0, [monthlyReplacementReserve, plannedWorkDays]);
  const dailyDebtCost = useMemo(() => plannedWorkDays > 0 ? monthlyDebtPayment / plannedWorkDays : 0, [monthlyDebtPayment, plannedWorkDays]);

  const stats = useMemo(() => {
    const workDays = entries.filter(e => e.status === 'work').length;
    
    const totals = entries.reduce((acc, entry) => {
      const dayEarnings = entry.earnings.reduce((sum, e) => sum + e.amount, 0);
      const dayExpenses = entry.expenses.reduce((sum, ex) => sum + ex.amount, 0);
      const appFees = entry.expenses
        .filter(ex => ex.category === ExpenseCategory.APP_FEES)
        .reduce((sum, ex) => sum + ex.amount, 0);
      return {
        totalEarnings: acc.totalEarnings + dayEarnings,
        totalExpenses: acc.totalExpenses + dayExpenses,
        appFees: acc.appFees + appFees,
      };
    }, { totalEarnings: 0, totalExpenses: 0, appFees: 0 });

    const netProfitApparent = totals.totalEarnings - totals.totalExpenses;
    const netProfitReal = netProfitApparent - (workDays * (dailyMaintCost + dailyReplacementCost + dailyDebtCost));
    const committedPercentage = totals.totalEarnings > 0 ? ((monthlyDebtPayment + monthlyMaintReserve) / totals.totalEarnings) * 100 : 0;

    return {
      totals,
      netProfitReal,
      workDays,
      committedPercentage,
      monthlyDebtPayment
    };
  }, [entries, dailyMaintCost, dailyReplacementCost, dailyDebtCost, monthlyDebtPayment, monthlyMaintReserve]);

  const donutData = [
    { name: 'Lucro Real', value: Math.max(0, stats.netProfitReal), color: COLORS.success },
    { name: 'Gastos Diretos', value: Math.max(0, stats.totals.totalExpenses - stats.totals.appFees), color: COLORS.danger },
    { name: 'Dívidas/Fixos', value: stats.workDays * dailyDebtCost, color: '#f59e0b' },
    { name: 'Reservas Moto', value: stats.workDays * (dailyMaintCost + dailyReplacementCost), color: '#3b82f6' },
  ];

  const filteredLineData = useMemo(() => {
    let data = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const now = new Date();
    
    if (lineFilter === 'week') {
      const start = startOfWeek(now);
      const end = endOfWeek(now);
      data = data.filter(e => {
        const d = parseISO(e.date);
        return d >= start && d <= end;
      });
    } else if (lineFilter === 'month') {
      data = data.filter(e => isSameMonth(parseISO(e.date), now));
    } else {
      data = data.slice(-10);
    }

    return data.map(entry => {
      const ganhos = entry.earnings.reduce((sum, e) => sum + e.amount, 0);
      const gastos = entry.expenses.reduce((sum, e) => sum + e.amount, 0);
      const lucroReal = entry.status === 'work' ? ganhos - gastos - dailyMaintCost - dailyReplacementCost - dailyDebtCost : 0;
      return {
        date: entry.date.split('-').slice(2).join('/'),
        ganhos,
        lucroReal
      };
    });
  }, [entries, lineFilter, dailyMaintCost, dailyReplacementCost, dailyDebtCost]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* Lucro Real Chart */}
      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="text-slate-800 font-black mb-4 flex items-center gap-2">
          <Zap size={18} className="text-orange-500 fill-orange-500" />
          Seu Lucro Real
        </h3>
        
        <div className="flex flex-col items-center">
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} cornerRadius={10} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-tight block">LÍQUIDO</span>
              <p className="text-2xl font-black text-slate-900 leading-none">
                R$ {stats.netProfitReal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Commitment Indicator */}
        <div className="mt-2 px-1">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lucro Comprometido</span>
            <span className={`text-xs font-black ${stats.committedPercentage > 40 ? 'text-red-500' : 'text-emerald-500'}`}>
              {stats.committedPercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${stats.committedPercentage > 40 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, stats.committedPercentage)}%` }}
            />
          </div>
          {stats.committedPercentage > 40 && (
            <div className="flex items-center gap-1 mt-2 text-red-500">
              <AlertTriangle size={12} />
              <p className="text-[9px] font-bold uppercase">Atenção: Suas dívidas estão pesando!</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard size={14} className="text-amber-600" />
              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Dívidas/Fixo</span>
            </div>
            <p className="text-lg font-black text-amber-900">R$ {(stats.workDays * dailyDebtCost).toFixed(0)}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Wrench size={14} className="text-blue-600" />
              <span className="text-[9px] font-black text-blue-700 uppercase tracking-wider">Reservas Moto</span>
            </div>
            <p className="text-lg font-black text-blue-900">R$ {(stats.workDays * (dailyMaintCost + dailyReplacementCost)).toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Evolução */}
      <div className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-slate-800 font-black flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Lucro Real na Pista
          </h3>
          <div className="flex bg-slate-50 p-1 rounded-xl">
            {(['week', 'month'] as const).map(f => (
              <button
                key={f}
                onClick={() => setLineFilter(f)}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${lineFilter === f ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
              >
                {f === 'week' ? 'SEMANA' : 'MÊS'}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-64 w-full">
          {filteredLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{fontSize: 9, fontWeight: 700}} stroke="#cbd5e1" axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{fontSize: 9, fontWeight: 700}} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Line type="monotone" name="Ganhos" dataKey="ganhos" stroke={COLORS.primary} strokeWidth={4} dot={false} />
                <Line type="monotone" name="Lucro Real" dataKey="lucroReal" stroke={COLORS.success} strokeWidth={4} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-300 text-xs font-medium">
              Sem dados para este período
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
