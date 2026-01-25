
import React, { useState, useMemo } from 'react';
import { BikeInfo, ReplacementGoal, MaintenanceItem } from '../types';
import MaintenanceCalculator from './MaintenanceCalculator';
import { Wrench, Bike, RefreshCcw, Search, ArrowRight, X, CheckCircle, Edit3, DollarSign, Target, Calendar, CreditCard, Wallet } from 'lucide-react';

const BIKE_SUGGESTIONS = [
  { model: 'Honda CG 160 Titan', price: 18500 },
  { model: 'Honda CG 160 Fan', price: 16800 },
  { model: 'Yamaha Fazer FZ15', price: 19200 },
  { model: 'Yamaha Factor 150', price: 15800 },
  { model: 'Honda Biz 125', price: 15500 },
];

interface BikeManagerProps {
  bike: BikeInfo | null;
  onUpdateBike: (bike: BikeInfo) => void;
  replacementGoal: ReplacementGoal | null;
  onUpdateGoal: (goal: ReplacementGoal) => void;
  maintenanceItems: MaintenanceItem[];
  onUpdateMaintenance: (items: MaintenanceItem[]) => void;
  workDaysCount: number;
  plannedWorkDays: number;
  onUpdateWorkDays: (val: number) => void;
}

const BikeManager: React.FC<BikeManagerProps> = ({ 
  bike, onUpdateBike, replacementGoal, onUpdateGoal, maintenanceItems, onUpdateMaintenance, workDaysCount, plannedWorkDays, onUpdateWorkDays 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'maintenance'>('info');
  const [isEditingBike, setIsEditingBike] = useState(!bike);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGoalSuccess, setShowGoalSuccess] = useState(false);

  // Temporary Goal Form State
  const [goalForm, setGoalForm] = useState<ReplacementGoal>({
    targetModel: replacementGoal?.targetModel || '',
    targetYear: replacementGoal?.targetYear || new Date().getFullYear(),
    targetPrice: replacementGoal?.targetPrice || 0,
    monthsToGoal: replacementGoal?.monthsToGoal || 12,
    paymentMethod: replacementGoal?.paymentMethod || 'cash',
    downPayment: replacementGoal?.downPayment || 0,
    installmentValue: replacementGoal?.installmentValue || 0,
  });

  const estimatedValue = bike?.manualValue || bike?.fipeValue || 0;

  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    return BIKE_SUGGESTIONS.filter(b => b.model.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const handleSetInitialGoal = (model: string, price: number) => {
    const newGoal: ReplacementGoal = {
      targetModel: model,
      targetYear: new Date().getFullYear(),
      targetPrice: price,
      monthsToGoal: 12,
      paymentMethod: 'cash',
      downPayment: 0,
      installmentValue: 0
    };
    onUpdateGoal(newGoal);
    setGoalForm(newGoal);
    setSearchTerm('');
    setShowGoalSuccess(true);
    setTimeout(() => setShowGoalSuccess(false), 2000);
  };

  const handleSaveGoal = () => {
    onUpdateGoal(goalForm);
    setIsEditingGoal(false);
  };

  const dailyGoalAmount = useMemo(() => {
    if (!replacementGoal) return 0;
    
    let amountToSave = 0;
    if (replacementGoal.paymentMethod === 'cash') {
      // Se for à vista, o valor necessário é o preço da moto alvo menos o valor da moto atual
      amountToSave = Math.max(0, replacementGoal.targetPrice - estimatedValue);
    } else {
      // Para financiamento/consórcio, guardamos o valor da entrada planejada
      amountToSave = Math.max(0, (replacementGoal.downPayment || 0));
    }

    // Calculamos: (Total / Meses) / Dias de trabalho por mês
    const months = replacementGoal.monthsToGoal || 1;
    const workDays = plannedWorkDays || 22;
    
    return (amountToSave / months) / workDays;
  }, [replacementGoal, estimatedValue, plannedWorkDays]);

  return (
    <div className="space-y-6 pb-24">
      {/* Abas Simplificadas */}
      <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'info' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
        >
          <Bike size={14} /> MINHA MOTO
        </button>
        <button 
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'maintenance' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}
        >
          <Wrench size={14} /> MANUTENÇÃO
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Card da Moto Atual */}
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Nave Atual</h3>
              {!isEditingBike && (
                <button onClick={() => setIsEditingBike(true)} className="text-orange-500 p-1">
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {isEditingBike ? (
              <div className="space-y-4">
                <input 
                  placeholder="Modelo (ex: CG 160 Titan)"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                  value={bike?.model || ''}
                  onChange={e => onUpdateBike({ ...(bike || { brand: '', model: '', year: 2024, mileage: 0, condition: 'good', usage: 'work' }), model: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="number" placeholder="Ano"
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    value={bike?.year || ''}
                    onChange={e => onUpdateBike({ ...(bike || { brand: '', model: '', year: 2024, mileage: 0, condition: 'good', usage: 'work' }), year: parseInt(e.target.value) })}
                  />
                  <input 
                    type="number" placeholder="Valor (R$)"
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-orange-500"
                    value={bike?.manualValue || ''}
                    onChange={e => onUpdateBike({ ...(bike || { brand: '', model: '', year: 2024, mileage: 0, condition: 'good', usage: 'work' }), manualValue: parseFloat(e.target.value) })}
                  />
                </div>
                <button 
                  onClick={() => setIsEditingBike(false)}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-xs uppercase"
                >
                  Salvar Moto
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-2xl font-black text-slate-800">{bike?.model || 'Não cadastrada'}</p>
                  <p className="text-xs font-bold text-slate-400">Ano {bike?.year}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600">R$ {estimatedValue.toLocaleString('pt-BR')}</p>
                  <p className="text-[10px] font-black text-slate-300 uppercase">Valor de Mercado</p>
                </div>
              </div>
            )}
          </div>

          {/* Meta de Troca */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
             <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <Target size={18} className="text-orange-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meta de Troca</h3>
               </div>
               {replacementGoal && !isEditingGoal && (
                 <button onClick={() => setIsEditingGoal(true)} className="text-orange-500 p-1">
                   <Edit3 size={16} />
                 </button>
               )}
             </div>

             {isEditingGoal ? (
               <div className="space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Modelo Desejado</label>
                    <input 
                      placeholder="Modelo da moto"
                      className="w-full bg-white/10 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500"
                      value={goalForm.targetModel}
                      onChange={e => setGoalForm({...goalForm, targetModel: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Valor da Moto</label>
                      <input 
                        type="number"
                        placeholder="Ex: 18000"
                        className="w-full bg-white/10 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500"
                        value={goalForm.targetPrice || ''}
                        onChange={e => setGoalForm({...goalForm, targetPrice: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Tempo (Meses)</label>
                      <input 
                        type="number"
                        placeholder="Meses"
                        className="w-full bg-white/10 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500"
                        value={goalForm.monthsToGoal || ''}
                        onChange={e => setGoalForm({...goalForm, monthsToGoal: parseInt(e.target.value) || 12})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Forma de Pagamento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'cash', label: 'À Vista', icon: Wallet },
                        { id: 'financing', label: 'Financ.', icon: CreditCard },
                        { id: 'consortium', label: 'Consórcio', icon: RefreshCcw }
                      ].map(method => (
                        <button 
                          key={method.id}
                          onClick={() => setGoalForm({...goalForm, paymentMethod: method.id as any})}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${goalForm.paymentMethod === method.id ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                        >
                          <method.icon size={14} />
                          <span className="text-[9px] font-bold">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {goalForm.paymentMethod !== 'cash' && (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Valor da Entrada</label>
                        <input 
                          type="number"
                          placeholder="R$ 5.000"
                          className="w-full bg-white/10 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500"
                          value={goalForm.downPayment || ''}
                          onChange={e => setGoalForm({...goalForm, downPayment: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-slate-500 ml-1">Valor da Parcela</label>
                        <input 
                          type="number"
                          placeholder="R$ 450"
                          className="w-full bg-white/10 border-none rounded-xl p-3 text-sm font-bold text-white focus:ring-2 focus:ring-orange-500"
                          value={goalForm.installmentValue || ''}
                          onChange={e => setGoalForm({...goalForm, installmentValue: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setIsEditingGoal(false)} className="flex-1 py-3 bg-white/5 text-white font-bold rounded-xl text-xs uppercase">Cancelar</button>
                    <button onClick={handleSaveGoal} className="flex-1 py-3 bg-orange-500 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-orange-500/20">Salvar Meta</button>
                  </div>
               </div>
             ) : replacementGoal ? (
               <div className="space-y-4">
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="text-lg font-black">{replacementGoal.targetModel}</p>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase text-orange-500">
                         {replacementGoal.paymentMethod === 'cash' ? 'À Vista' : replacementGoal.paymentMethod === 'financing' ? 'Financiamento' : 'Consórcio'}
                       </span>
                       <div className="w-1 h-1 bg-slate-600 rounded-full" />
                       <span className="text-[10px] font-bold text-slate-400">{replacementGoal.monthsToGoal} meses</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-orange-500 font-black">R$ {replacementGoal.targetPrice.toLocaleString('pt-BR')}</p>
                     <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Valor Total</p>
                   </div>
                 </div>

                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                   <p className="text-[10px] text-slate-400 uppercase font-black mb-1">
                     {replacementGoal.paymentMethod === 'cash' 
                        ? `Para comprar à vista em ${replacementGoal.monthsToGoal} meses, guarde:` 
                        : `Para dar a entrada em ${replacementGoal.monthsToGoal} meses, guarde:`}
                   </p>
                   <div className="flex items-baseline gap-2">
                     <p className="text-2xl font-black text-white">R$ {dailyGoalAmount.toFixed(2)}</p>
                     <span className="text-xs text-slate-500 font-bold uppercase">/dia de corre</span>
                   </div>
                 </div>

                 {replacementGoal.paymentMethod !== 'cash' && replacementGoal.installmentValue && (
                   <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                      <CreditCard size={12} className="text-slate-500" />
                      <p className="text-[10px] font-bold text-slate-300">
                        Custo futuro estimado: <span className="text-white font-black">R$ {replacementGoal.installmentValue.toFixed(0)}/mês</span>
                      </p>
                   </div>
                 )}

                 <button onClick={() => onUpdateGoal(null as any)} className="text-[10px] font-black text-red-400 uppercase opacity-50 hover:opacity-100 transition-opacity">Remover Meta</button>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="relative">
                   <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                   <input 
                     placeholder="Qual moto você quer?"
                     className="w-full bg-white/10 border-none rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-orange-500 text-white"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                 </div>
                 {filteredSuggestions.length > 0 && (
                   <div className="bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                     {filteredSuggestions.map(s => (
                       <button 
                        key={s.model}
                        onClick={() => handleSetInitialGoal(s.model, s.price)}
                        className="w-full p-4 text-left hover:bg-white/10 flex justify-between items-center border-b border-white/5 last:border-0"
                       >
                         <span className="text-sm font-bold">{s.model}</span>
                         <ArrowRight size={14} className="text-orange-500" />
                       </button>
                     ))}
                   </div>
                 )}
               </div>
             )}
             {showGoalSuccess && (
               <div className="absolute inset-0 bg-emerald-600 flex items-center justify-center animate-in fade-in zoom-in">
                 <div className="text-center">
                   <CheckCircle size={40} className="mx-auto mb-2" />
                   <p className="font-black text-sm uppercase">Meta Definida!</p>
                 </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        <MaintenanceCalculator 
          items={maintenanceItems} 
          onUpdate={onUpdateMaintenance} 
          workDaysCount={workDaysCount}
          plannedWorkDays={plannedWorkDays}
          onUpdateWorkDays={onUpdateWorkDays}
        />
      )}
    </div>
  );
};

export default BikeManager;
