
import React, { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Calendar, Zap, Target, CheckCircle2 } from 'lucide-react';
import { DailyEntry, FinancialGoals } from '../types';
import { getFinancialInsights } from '../services/geminiService';

interface InsightPanelProps {
  entries: DailyEntry[];
  goals: FinancialGoals;
}

const InsightPanel: React.FC<InsightPanelProps> = ({ entries, goals }) => {
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entries.length > 0) {
      setLoading(true);
      getFinancialInsights(entries).then(res => {
        setAiResponse(res);
        setLoading(false);
      });
    }
  }, [entries]);

  // Calculate stats for goals
  const totalEarningsThisMonth = entries.reduce((acc, e) => acc + e.earnings.reduce((s, curr) => s + curr.amount, 0), 0);
  const monthlyProgress = Math.min(100, (totalEarningsThisMonth / (goals.monthly || 3000)) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* AI Message - The "Papo de Brother" Section */}
      <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-orange-500 p-1.5 rounded-lg">
            <Sparkles size={16} className="text-white fill-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Visão do Parceiro</span>
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded-full w-3/4"></div>
            <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
            <div className="h-20 bg-white/5 rounded-3xl w-full mt-4"></div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xl font-bold leading-tight italic">
              "{aiResponse?.message || 'Fala mestre! Seu corre é valioso, foca no objetivo que o resultado é certo.'}"
            </p>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
              <div className="flex items-center gap-3 mb-1">
                <Zap size={18} className="text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-black uppercase text-yellow-400">Dica do Giro</span>
              </div>
              <p className="text-sm font-medium text-slate-200">{aiResponse?.tip || 'Manutenção em dia evita surpresa no meio do corre. Fica ligado!'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Goal Tracking Section */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-slate-800 font-black flex items-center gap-2">
            <Target size={18} className="text-orange-500" />
            Suas Metas
          </h3>
          <span className="text-[10px] font-black text-slate-400 uppercase">MÊS ATUAL</span>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase">Meta Mensal</span>
                <p className="text-lg font-black text-slate-800">R$ {totalEarningsThisMonth.toFixed(0)} <span className="text-slate-300 font-medium">/ R$ {goals.monthly}</span></p>
              </div>
              <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{monthlyProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${monthlyProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ritmo Diário</span>
              <p className="text-sm font-black text-slate-700">R$ {(totalEarningsThisMonth / Math.max(1, entries.length)).toFixed(0)}</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle2 size={12} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-600">Dentro da meta</span>
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Projeção Final</span>
              <p className="text-sm font-black text-slate-700">R$ {aiResponse?.projection || (totalEarningsThisMonth * 1.2).toFixed(0)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={12} className="text-blue-500" />
                <span className="text-[9px] font-bold text-blue-600">Tendência de Alta</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-orange-500 p-6 rounded-[2.5rem] text-center text-white">
        <p className="text-lg font-black mb-1">"O suor de hoje é a conquista de amanhã."</p>
        <p className="text-orange-100 text-xs font-medium opacity-80">Bora pra cima, parceiro!</p>
      </div>
    </div>
  );
};

export default InsightPanel;
