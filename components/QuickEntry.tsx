
import React, { useState, useEffect } from 'react';
import { DailyEntry, ExpenseCategory, AppEarning, CategoryExpense } from '../types';
import { format } from 'date-fns';
import { APP_LIST } from '../constants';
import { Save, Plus, X, Trash2, Fuel, Wrench, Wifi, MoreHorizontal, AlertCircle, Clock, Edit3, Check } from 'lucide-react';

interface EntryFormProps {
  initialDate?: Date;
  entries?: DailyEntry[];
  onSave: (entry: DailyEntry) => void;
  onCancel: () => void;
}

const QuickEntry: React.FC<EntryFormProps> = ({ initialDate = new Date(), entries = [], onSave, onCancel }) => {
  const [date, setDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [status, setStatus] = useState<'work' | 'off'>('work');
  const [earnings, setEarnings] = useState<AppEarning[]>([{ app: 'iFood', amount: 0 }]);
  const [expenses, setExpenses] = useState<CategoryExpense[]>([]);
  const [hours, setHours] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [editingEarningIndex, setEditingEarningIndex] = useState<number | null>(null);

  useEffect(() => {
    const entry = entries.find(e => e.date === date);
    setStatus(entry?.status || 'work');
    setEarnings(entry?.earnings.length ? entry.earnings.map(e=>({...e})) : [{app:'iFood',amount:0}]);
    setExpenses(entry?.expenses.map(e=>({...e})) || []);
    setHours(entry?.hoursWorked || 0);
    setFuelCost(entry?.expenses.find(e=>e.category===ExpenseCategory.FUEL)?.amount || 0);
    setNotes(entry?.notes || '');
  }, [date]);

  const addEarning = () => {
    setEarnings([...earnings, { app: 'Novo Ganho', amount: 0 }]);
  };

  const removeEarning = (index: number) => {
    if (earnings.length > 1) {
      setEarnings(earnings.filter((_, i) => i !== index));
    }
  };

  const updateEarning = (index: number, field: keyof AppEarning, value: any) => {
    const newEarnings = [...earnings];
    newEarnings[index] = { ...newEarnings[index], [field]: value };
    setEarnings(newEarnings);
  };

  const handleExpenseChange = (category: ExpenseCategory, amount: number) => {
    const filtered = expenses.filter(e => e.category !== category);
    if (amount > 0) {
      setExpenses([...filtered, { category, amount }]);
    } else {
      setExpenses(filtered);
    }
  };

  const handleSave = () => {
    const entry: DailyEntry = {
      id: crypto.randomUUID(),
      date,
      status,
      earnings: earnings.filter(e => e.amount > 0),
      expenses: expenses.filter(e => e.amount > 0),
      hoursWorked: hours,
      fuelUsed: 0, // Mantido por compatibilidade, mas o foco é o valor em R$ nas despesas
      notes
    };
    onSave(entry);
  };

  const totalEarnings = earnings.reduce((acc, cur) => acc + cur.amount, 0);
  const totalExpenses = expenses.reduce((acc, cur) => acc + cur.amount, 0);
  const dailyNet = totalEarnings - totalExpenses;

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom duration-300 pb-20 max-w-md mx-auto">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-slate-800 leading-tight">Corre de Hoje</h2>
            {status === 'work' && totalEarnings > 0 && (
              <p className={`text-[10px] font-black uppercase tracking-wider ${dailyNet >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                Lucro de Hoje: R$ {dailyNet.toFixed(0)}
              </p>
            )}
          </div>
          <button onClick={onCancel} className="p-2 bg-slate-50 rounded-full text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          {/* Status Selection */}
          <div className="flex bg-slate-100 rounded-3xl p-1.5">
            <button 
              onClick={() => setStatus('work')}
              className={`flex-1 py-3 text-xs font-black rounded-[1.25rem] transition-all flex items-center justify-center gap-2 ${status === 'work' ? 'bg-white shadow-md text-orange-600' : 'text-slate-400'}`}
            >
              <Save size={14} /> TRABALHEI
            </button>
            <button 
              onClick={() => setStatus('off')}
              className={`flex-1 py-3 text-xs font-black rounded-[1.25rem] transition-all flex items-center justify-center gap-2 ${status === 'off' ? 'bg-white shadow-md text-slate-600' : 'text-slate-400'}`}
            >
              <Clock size={14} /> FOLGA
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data do Giro</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {status === 'work' && (
            <>
              {/* Earnings Section */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ganhos do Corre</label>
                  <button onClick={addEarning} className="text-[10px] font-black text-orange-500 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-full active:scale-90 transition-all">
                    <Plus size={12} /> ADD GANHO
                  </button>
                </div>
                
                <div className="space-y-2">
                  {earnings.map((earning, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-3xl animate-in zoom-in-95 duration-200 border border-transparent focus-within:border-orange-100 transition-all">
                      <div className="flex justify-between items-center px-1">
                        {editingEarningIndex === idx ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              autoFocus
                              type="text"
                              value={earning.app}
                              onChange={(e) => updateEarning(idx, 'app', e.target.value)}
                              onBlur={() => setEditingEarningIndex(null)}
                              className="bg-white px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-600 outline-none w-full"
                            />
                            <button onClick={() => setEditingEarningIndex(null)} className="text-emerald-500"><Check size={14}/></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{earning.app}</span>
                            <button onClick={() => setEditingEarningIndex(idx)} className="text-slate-300 hover:text-orange-500 transition-colors">
                              <Edit3 size={10} />
                            </button>
                          </div>
                        )}
                        {earnings.length > 1 && (
                          <button onClick={() => removeEarning(idx)} className="text-slate-300 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                        <input 
                          type="number" 
                          value={earning.amount || ''}
                          onChange={(e) => updateEarning(idx, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full bg-white border-none rounded-2xl p-4 pl-10 text-xl focus:ring-2 focus:ring-orange-500 outline-none font-black text-slate-800"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hours & Fuel Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Horas On</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={hours || ''}
                      onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Gasolina (R$)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">R$</span>
                    <input 
                      type="number"
                      value={fuelCost || ''}
                      onChange={(e) => { const value = parseFloat(e.target.value) || 0; setFuelCost(value); handleExpenseChange(ExpenseCategory.FUEL, value); }}
                      placeholder="0.00"
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 pl-10 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none text-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Other Expenses Grid */}
              <div className="space-y-3 pt-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Outros Gastos Extras</label>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { cat: ExpenseCategory.MAINTENANCE, icon: Wrench, color: 'text-amber-500', bg: 'bg-amber-50' },
                      { cat: ExpenseCategory.INTERNET, icon: Wifi, color: 'text-purple-500', bg: 'bg-purple-50' },
                      { cat: ExpenseCategory.UNFORESEEN, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
                      { cat: ExpenseCategory.OTHERS, icon: MoreHorizontal, color: 'text-slate-500', bg: 'bg-slate-50' }
                    ].map(({ cat, icon: Icon, color, bg }) => {
                      const currentVal = expenses.find(e => e.category === cat)?.amount || 0;
                      return (
                        <div key={cat} className={`${bg} rounded-3xl p-4 flex flex-col gap-1 focus-within:ring-2 focus-within:ring-orange-200 transition-all border border-transparent ${currentVal > 0 ? 'border-slate-200' : ''}`}>
                          <div className="flex items-center gap-2">
                            <Icon size={14} className={color} />
                            <span className="text-[9px] font-black text-slate-500 uppercase">{cat}</span>
                          </div>
                          <div className="relative">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold">R$</span>
                            <input 
                              type="number"
                              value={currentVal || ''}
                              placeholder="0.00"
                              onChange={(e) => handleExpenseChange(cat, parseFloat(e.target.value) || 0)}
                              className="w-full bg-transparent border-none p-1 pl-5 text-sm outline-none font-black text-slate-800"
                            />
                          </div>
                        </div>
                      );
                    })}
                 </div>
                 {totalExpenses > 0 && (
                   <div className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 animate-in shake duration-500">
                     <AlertCircle size={14} className="text-red-500" />
                     <p className="text-[10px] font-bold text-red-700">Atenção: Esses R$ {totalExpenses.toFixed(0)} reduzem seu lucro hoje!</p>
                   </div>
                 )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Observações</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Dia de chuva, bati a meta!"
              rows={2}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none resize-none"
            />
          </div>
        </div>
      </div>

      <div className="px-4">
        <button 
          onClick={handleSave}
          className="w-full py-5 bg-orange-500 text-white font-black rounded-[1.5rem] shadow-xl shadow-orange-200 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
        >
          <Save size={24} /> SALVAR E SEGUIR
        </button>
      </div>
    </div>
  );
};

export default QuickEntry;
