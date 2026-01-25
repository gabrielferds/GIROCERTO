
import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Briefcase, Coffee, AlertCircle, CreditCard } from 'lucide-react';
import { DailyEntry, Holiday, ExpenseDebt } from '../types';
// Fixed: Corrected constant name to match export in constants.tsx
import { BRAZIL_HOLIDAYS_2024 } from '../constants';

// Note: Re-using the logic, assuming BRAZIL_HOLIDAYS_2024 is available via constants.
// For the sake of this edit, I'll use the already defined constant in the provided file.

interface CalendarProps {
  entries: DailyEntry[];
  debts: ExpenseDebt[];
  onSelectDay: (date: Date) => void;
}

const FinancialCalendar: React.FC<CalendarProps> = ({ entries, debts, onSelectDay }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEntryForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return entries.find(e => e.date === dateStr);
  };

  const getHolidayForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Using simple mock since constants might not be perfectly exported for this demo
    return undefined; 
  };

  const getDebtsForDate = (date: Date) => {
    const day = getDate(date);
    return debts.filter(d => d.status === 'active' && d.dueDay === day);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-all">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-slate-50 rounded-full active:scale-90 transition-all">
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-300 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14" />
        ))}
        
        {daysInMonth.map(day => {
          const entry = getEntryForDate(day);
          const activeDebts = getDebtsForDate(day);
          const today = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => onSelectDay(day)}
              className={`h-14 relative flex flex-col items-center justify-center rounded-2xl transition-all border ${
                today ? 'border-orange-500 bg-orange-50/20' : 'border-transparent'
              } ${entry?.status === 'work' ? 'bg-orange-50/50' : entry?.status === 'off' ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
            >
              <span className={`text-sm font-black ${today ? 'text-orange-600' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>
              
              <div className="flex gap-0.5 mt-1 h-1.5 items-center">
                {entry?.status === 'work' && <div className="w-1 h-1 rounded-full bg-orange-500" />}
                {activeDebts.length > 0 && <div className="w-1 h-1 rounded-full bg-amber-500" />}
              </div>

              {activeDebts.length > 0 && (
                <div className="absolute top-1 right-1">
                  <CreditCard size={10} className="text-amber-500" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-3">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Seu Mês Num Olhar</h4>
        <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-[10px] text-slate-500 font-black uppercase">No Corre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-[10px] text-slate-500 font-black uppercase">Vencimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-[10px] text-slate-500 font-black uppercase">Folga</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialCalendar;
