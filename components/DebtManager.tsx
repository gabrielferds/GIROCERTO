
import React, { useState, useMemo } from 'react';
import { ExpenseDebt } from '../types';
import { 
  Plus, CreditCard, Wallet, Calendar, AlertTriangle, 
  Trash2, Edit3, CheckCircle2, X, ChevronRight, TrendingDown 
} from 'lucide-react';

interface DebtManagerProps {
  debts: ExpenseDebt[];
  onUpdate: (debts: ExpenseDebt[]) => void | boolean | Promise<void | boolean>;
  plannedWorkDays: number;
}

const DebtManager: React.FC<DebtManagerProps> = ({ debts, onUpdate, plannedWorkDays }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialForm: Omit<ExpenseDebt, 'id'> = {
    name: '',
    type: 'fixed',
    paymentMethod: 'pix',
    installmentValue: 0,
    paidInstallments: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDay: 10,
    status: 'active'
  };

  const [formData, setFormData] = useState<Omit<ExpenseDebt, 'id'>>(initialForm);

  const activeDebts = debts.filter(d => d.status === 'active');
  const monthlyTotal = activeDebts.reduce((acc, curr) => acc + curr.installmentValue, 0);
  const dailyImpact = plannedWorkDays > 0 ? monthlyTotal / plannedWorkDays : 0;

  const handleSave = async () => {
    if (!formData.name || formData.installmentValue <= 0) return;

    if (editingId) {
      if (await onUpdate(debts.map(d => d.id === editingId ? { ...formData, id: editingId } : d)) === false) return;
    } else {
      const newDebt: ExpenseDebt = {
        ...formData,
        id: crypto.randomUUID()
      };
      if (await onUpdate([...debts, newDebt]) === false) return;
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const editDebt = (debt: ExpenseDebt) => {
    setFormData({ ...debt });
    setEditingId(debt.id);
    setIsFormOpen(true);
  };

  const removeDebt = (id: string) => {
    onUpdate(debts.filter(d => d.id !== id));
  };

  const togglePaidStatus = (debt: ExpenseDebt) => {
    onUpdate(debts.map(d => d.id === debt.id ? { ...d, status: d.status === 'paid' ? 'active' : 'paid' } : d));
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-500">
      <div className="px-1 space-y-1">
        <h2 className="text-3xl font-black text-slate-800 leading-tight">Dívidas e Gastos</h2>
        <p className="text-slate-400 text-sm font-medium">Controle seus boletos e saiba o peso de cada um no corre.</p>
      </div>

      {/* Impact Summary */}
      <div className="bg-slate-900 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <CreditCard size={120} />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block mb-1">Custo Fixo Mensal</span>
              <p className="text-3xl font-black text-white">R$ {monthlyTotal.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/10 p-3 rounded-2xl text-center min-w-[80px]">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">Peso p/ Dia</p>
              <p className="text-lg font-black text-amber-400">R$ {dailyImpact.toFixed(0)}</p>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-3xl border border-white/10 flex items-start gap-3">
            <TrendingDown size={18} className="text-amber-400 mt-1 flex-shrink-0" />
            <p className="text-[11px] font-medium text-slate-200 leading-relaxed">
              Cada dia que você sai pra rodar, os primeiros <span className="font-bold text-amber-400">R$ {dailyImpact.toFixed(0)}</span> do lucro são pra pagar suas dívidas fixas.
            </p>
          </div>
        </div>
      </div>

      {/* List of Debts */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Seus Compromissos</h3>
          {!isFormOpen && (
            <button 
              onClick={() => setIsFormOpen(true)}
              className="bg-orange-500 text-white p-2.5 rounded-2xl active:scale-90 transition-all shadow-lg shadow-orange-100"
            >
              <Plus size={20} />
            </button>
          )}
        </div>

        {isFormOpen && (
          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-5 border border-slate-200 animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-2">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{editingId ? 'Editando' : 'Novo Gasto'}</h4>
               <button onClick={resetForm} className="text-slate-400"><X size={18} /></button>
             </div>

             <div className="space-y-4">
               <input 
                 placeholder="Nome da Dívida (ex: Aluguel, MEI)"
                 className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                 value={formData.name}
                 onChange={e => setFormData({...formData, name: e.target.value})}
               />

               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Valor Mensal</label>
                   <input 
                     type="number"
                     placeholder="0.00"
                     className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                     value={formData.installmentValue || ''}
                     onChange={e => setFormData({...formData, installmentValue: parseFloat(e.target.value) || 0})}
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-400 ml-2 uppercase">Dia Vencimento</label>
                   <input 
                     type="number"
                     placeholder="10"
                     min="1" max="31"
                     className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                     value={formData.dueDay || ''}
                     onChange={e => setFormData({...formData, dueDay: parseInt(e.target.value) || 1})}
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                 <select 
                   className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value as any})}
                 >
                   <option value="fixed">Gasto Fixo</option>
                   <option value="installment">Parcelado</option>
                   <option value="financing">Financiamento</option>
                   <option value="card">Cartão</option>
                 </select>
                 <select 
                   className="w-full bg-white border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                   value={formData.paymentMethod}
                   onChange={e => setFormData({...formData, paymentMethod: e.target.value as any})}
                 >
                   <option value="pix">PIX</option>
                   <option value="boleto">Boleto</option>
                   <option value="debit">Débito</option>
                   <option value="credit">Crédito</option>
                 </select>
               </div>

               <button 
                 onClick={handleSave}
                 className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl shadow-xl shadow-orange-100 active:scale-95 transition-all"
               >
                 SALVAR GASTO
               </button>
             </div>
          </div>
        )}

        <div className="space-y-4">
          {debts.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-slate-200" />
              </div>
              <p className="text-xs font-bold text-slate-400">Nenhum gasto fixo cadastrado.<br/>Adicione seus boletos para maior controle.</p>
            </div>
          ) : (
            debts.sort((a,b) => a.dueDay - b.dueDay).map(debt => (
              <div key={debt.id} className={`group p-5 rounded-[2rem] border transition-all ${debt.status === 'paid' ? 'bg-slate-50 border-transparent opacity-60' : 'bg-white border-slate-100 hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-2xl ${debt.status === 'paid' ? 'bg-slate-200 text-slate-400' : 'bg-orange-50 text-orange-600'}`}>
                      {debt.type === 'fixed' ? <Wallet size={20} /> : <Calendar size={20} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">{debt.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Vence dia {debt.dueDay} • {debt.paymentMethod}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-base font-black ${debt.status === 'paid' ? 'text-slate-400' : 'text-slate-900'}`}>R$ {debt.installmentValue.toFixed(0)}</p>
                    <span className="text-[9px] font-black uppercase text-slate-300">/mês</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <button 
                    onClick={() => togglePaidStatus(debt)}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${debt.status === 'paid' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {debt.status === 'paid' ? <><CheckCircle2 size={12} /> PAGO</> : 'MARCAR COMO PAGO'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => editDebt(debt)} className="p-2 text-slate-300 hover:text-orange-500 transition-colors"><Edit3 size={16} /></button>
                    <button onClick={() => removeDebt(debt.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DebtManager;
