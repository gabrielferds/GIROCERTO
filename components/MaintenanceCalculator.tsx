
import React, { useState } from 'react';
import { MaintenanceItem } from '../types';
import { Plus, Trash2, Info, Wrench, ShieldCheck, Check, Sparkles, Edit3, X } from 'lucide-react';

const COMMON_ITEMS = [
  { name: 'Troca de Óleo', qty: 12, price: 45 },
  { name: 'Pneu Traseiro', qty: 1, price: 350 },
  { name: 'Kit Relação', qty: 2, price: 180 },
  { name: 'Pastilha Freio', qty: 3, price: 40 },
];

interface MaintenanceCalculatorProps {
  items: MaintenanceItem[];
  onUpdate: (items: MaintenanceItem[]) => void | boolean | Promise<void | boolean>;
  workDaysCount: number;
  plannedWorkDays: number;
  onUpdateWorkDays: (val: number) => void;
}

const MaintenanceCalculator: React.FC<MaintenanceCalculatorProps> = ({ items, onUpdate, plannedWorkDays, onUpdateWorkDays }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<MaintenanceItem, 'id'>>({ name: '', qtyPerYear: 1, unitValue: 0 });

  const totalAnnual = items.reduce((acc, curr) => acc + (curr.qtyPerYear * curr.unitValue), 0);
  const dailyReserve = (totalAnnual / 12) / Math.max(1, plannedWorkDays);

  const handleSave = async () => {
    if (!formData.name) return;

    if (editingId) {
      // Update existing item
      const updatedItems = items.map(item => 
        item.id === editingId ? { ...formData, id: editingId } : item
      );
      if (await onUpdate(updatedItems) === false) return;
    } else {
      // Add new item
      const newItem: MaintenanceItem = { ...formData, id: crypto.randomUUID() };
      if (await onUpdate([...items, newItem]) === false) return;
    }
    
    closeForm();
  };

  const openEdit = (item: MaintenanceItem) => {
    setFormData({ name: item.name, qtyPerYear: item.qtyPerYear, unitValue: item.unitValue });
    setEditingId(item.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({ name: '', qtyPerYear: 1, unitValue: 0 });
  };

  const handleQuickAdd = async (ci: { name: string, qty: number, price: number }) => {
    const newItem: MaintenanceItem = { 
      name: ci.name, 
      qtyPerYear: ci.qty, 
      unitValue: ci.price, 
      id: crypto.randomUUID() 
    };
    if (await onUpdate([...items, newItem]) === false) return;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Resumo de Reserva */}
      <div className="bg-emerald-600 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
        <Sparkles size={100} className="absolute -right-4 -top-4 opacity-10" />
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Reserva de Segurança</span>
        </div>
        <p className="text-4xl font-black mb-1">R$ {dailyReserve.toFixed(2)}</p>
        <p className="text-[10px] font-black uppercase text-emerald-200">Guardar por dia de corre</p>
        
        <div className="mt-6 flex items-center justify-between bg-black/10 rounded-2xl p-3">
          <span className="text-[10px] font-black uppercase">Ritmo: {plannedWorkDays} dias/mês</span>
          <input 
            type="range" min="1" max="31" value={plannedWorkDays} 
            onChange={(e) => onUpdateWorkDays(parseInt(e.target.value))}
            className="w-24 accent-white"
          />
        </div>
      </div>

      {/* Lista de Peças */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos Anuais</h3>
          <button 
            onClick={() => isFormOpen ? closeForm() : setIsFormOpen(true)} 
            className={`${isFormOpen ? 'bg-slate-100 text-slate-400' : 'bg-orange-500 text-white'} p-2 rounded-xl transition-colors`}
          >
            {isFormOpen ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isFormOpen && (
          <div className="p-4 bg-slate-50 rounded-2xl space-y-3 animate-in zoom-in-95 border border-slate-200">
             <div className="flex justify-between items-center px-1">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 {editingId ? 'Editando Gasto' : 'Novo Gasto Anual'}
               </span>
             </div>
             <input 
              placeholder="Nome da peça" 
              className="w-full p-3 rounded-xl border-none text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
             />
             <div className="grid grid-cols-2 gap-2">
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Vezes/ano</label>
                 <input 
                  type="number" placeholder="Ex: 12" 
                  className="w-full p-3 rounded-xl border-none text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.qtyPerYear || ''}
                  onChange={e => setFormData({...formData, qtyPerYear: parseInt(e.target.value) || 1})}
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[9px] font-bold text-slate-400 ml-2 uppercase">Preço Unitário</label>
                 <input 
                  type="number" placeholder="Ex: 45" 
                  className="w-full p-3 rounded-xl border-none text-sm font-bold bg-white focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.unitValue || ''}
                  onChange={e => setFormData({...formData, unitValue: parseFloat(e.target.value) || 0})}
                 />
               </div>
             </div>
             <div className="flex gap-2">
                {editingId && (
                  <button 
                    onClick={closeForm}
                    className="flex-1 py-3 bg-white text-slate-400 font-black rounded-xl text-xs uppercase border border-slate-200"
                  >
                    Cancelar
                  </button>
                )}
                <button 
                  onClick={handleSave}
                  className="flex-[2] py-3 bg-slate-900 text-white font-black rounded-xl text-xs uppercase shadow-lg active:scale-95 transition-all"
                >
                  {editingId ? 'Salvar Alterações' : 'Adicionar Item'}
                </button>
             </div>
             
             {!editingId && (
               <div className="pt-2">
                 <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Sugestões Rápidas</p>
                 <div className="flex flex-wrap gap-2">
                   {COMMON_ITEMS.map(ci => (
                     <button 
                      key={ci.name}
                      onClick={() => handleQuickAdd(ci)}
                      className="text-[9px] font-bold px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 active:bg-slate-100"
                     >
                       + {ci.name}
                     </button>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}

        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-[1.5rem] border border-transparent hover:border-slate-200 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm">
                  <Wrench size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{item.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{item.qtyPerYear}x no ano • R$ {item.unitValue} un.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <p className="text-sm font-black text-slate-700">R$ {(item.qtyPerYear * item.unitValue).toFixed(0)}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Anual</p>
                </div>
                <button 
                  onClick={() => openEdit(item)} 
                  className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={() => onUpdate(items.filter(i => i.id !== item.id))} 
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
              <Wrench size={32} className="mx-auto text-slate-200 mb-3" />
              <p className="text-xs font-bold text-slate-400">Nenhum gasto de manutenção<br/>cadastrado ainda.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCalculator;
