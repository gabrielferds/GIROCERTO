
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, DailyEntry, FinancialGoals, MaintenanceItem, BikeInfo, ReplacementGoal, UserProfile, ExpenseCategory, ExpenseDebt, PlanStatus } from './types';
import Layout from './components/Layout';
import DashboardCharts from './components/DashboardCharts';
import FinancialCalendar from './components/FinancialCalendar';
import QuickEntry from './components/QuickEntry';
import InsightPanel from './components/InsightPanel';
import BikeManager from './components/BikeManager';
import DebtManager from './components/DebtManager';
import NotificationOverlay from './components/NotificationOverlay';
import InitialFlow from './components/InitialFlow';
import PaymentScreen from './components/PaymentScreen';
import { supabase } from './services/supabase';
import { format, startOfMonth, endOfMonth, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2, AlertCircle, Target, Plus, Sparkles, RefreshCcw, Info, CheckCircle2, X, LogOut, Wallet } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>('dashboard');
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [goals, setGoals] = useState<FinancialGoals>({ daily: 150, weekly: 1000, monthly: 4000 });
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [bikeInfo, setBikeInfo] = useState<BikeInfo | null>(null);
  const [replacementGoal, setReplacementGoal] = useState<ReplacementGoal | null>(null);
  const [plannedWorkDays, setPlannedWorkDays] = useState(22);
  const [debts, setDebts] = useState<ExpenseDebt[]>([]);
  const [isAuthComplete, setIsAuthComplete] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('trial');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: 'open_girocerto_view',
        title: 'Abrir uma tela do GiroCerto',
        description: 'Abre uma tela para o usuário autenticado. Não salva nem exclui registros.',
        inputSchema: { type: 'object', properties: { view: { type: 'string', enum: ['dashboard','calendar','history','add','goals','maintenance','debts','insights'] } }, required: ['view'], additionalProperties: false },
        annotations: { readOnlyHint: false },
        execute: async (input: any) => {
          const views = ['dashboard','calendar','history','add','goals','maintenance','debts','insights'];
          if (!input || !views.includes(input.view)) throw new Error('Tela inválida.');
          if (!isAuthComplete) throw new Error('Entre na sua conta primeiro.');
          setActiveView(input.view);
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return { view: input.view };
        }
      }, { signal: lifecycle.signal })).catch(console.error);
    } catch (error) { console.error(error); }
    return () => lifecycle.abort();
  }, [isAuthComplete]);

  // Auth Session Management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        setIsAuthComplete(true);
        setTimeout(() => { void fetchUserData(session.user.id); }, 0);
      } else {
        setUserId(null);
        setIsAuthComplete(false);
        setIsExpired(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (uid: string) => {
    // 1. Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (profile) {
      setUserName(profile.name || 'Motoboy');
      setPlannedWorkDays(profile.planned_work_days);
      setPlanStatus(profile.plan_status || 'trial');
      
      const now = new Date();
      if (profile.plan_status === 'active') {
        if (profile.plano_fim) {
          const expiresAt = parseISO(profile.plano_fim);
          if (isBefore(expiresAt, now)) {
            setIsExpired(true);
            setPlanStatus('expired');
          }
        }
      } else if (profile.trial_expires_at) {
        const trialExpiresAt = parseISO(profile.trial_expires_at);
        if (isBefore(trialExpiresAt, now)) {
          setIsExpired(true);
          setPlanStatus('expired');
        }
      }
    }

    // 2. Entries
    const { data: entriesData } = await supabase.from('entries').select('*').eq('user_id', uid).order('date', { ascending: false });
    if (entriesData) setEntries(entriesData);

    // 3. Maintenance
    const { data: maintData } = await supabase.from('maintenance').select('*').eq('user_id', uid);
    if (maintData) setMaintenanceItems(maintData);

    // 4. Bike
    const { data: bikeData } = await supabase.from('bike_info').select('*').eq('user_id', uid).single();
    if (bikeData) setBikeInfo(bikeData);

    // 5. Replacement Goal
    const { data: replGoalData } = await supabase.from('replacement_goals').select('*').eq('user_id', uid).single();
    if (replGoalData) setReplacementGoal(replGoalData);

    // 6. Debts
    const { data: debtsData } = await supabase.from('debts').select('*').eq('user_id', uid);
    if (debtsData) setDebts(debtsData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handlePaymentSuccess = () => {
    setPlanStatus('active');
    setIsExpired(false);
    setActiveView('dashboard');
    if (userId) fetchUserData(userId);
  };

  const handleUpdatePlannedWorkDays = async (val: number) => {
    if (isExpired) return;
    setPlannedWorkDays(val);
    if (userId) {
      await supabase.from('profiles').update({ planned_work_days: val }).eq('id', userId);
    }
  };

  const handleUpdateMaintenanceItems = async (items: MaintenanceItem[]) => {
    if (isExpired) return;
    setMaintenanceItems(items);
    if (userId) {
      await supabase.from('maintenance').delete().eq('user_id', userId);
      await supabase.from('maintenance').insert(items.map(i => ({ ...i, user_id: userId })));
    }
  };

  const handleUpdateBikeInfo = async (info: BikeInfo) => {
    if (isExpired) return;
    setBikeInfo(info);
    if (userId) {
      await supabase.from('bike_info').upsert({ ...info, user_id: userId });
    }
  };

  const handleUpdateReplacementGoal = async (goal: ReplacementGoal | null) => {
    if (isExpired) return;
    setReplacementGoal(goal);
    if (userId) {
      if (!goal) {
        await supabase.from('replacement_goals').delete().eq('user_id', userId);
      } else {
        await supabase.from('replacement_goals').upsert({ ...goal, user_id: userId });
      }
    }
  };

  const handleUpdateDebts = async (newDebts: ExpenseDebt[]) => {
    if (isExpired) return;
    setDebts(newDebts);
    if (userId) {
      await supabase.from('debts').delete().eq('user_id', userId);
      await supabase.from('debts').insert(newDebts.map(d => ({ ...d, user_id: userId })));
    }
  };

  const handleSaveEntry = async (newEntry: DailyEntry) => {
    if (isExpired) {
      setActiveView('payment');
      return;
    }

    const updatedEntries = [...entries];
    const existingIndex = updatedEntries.findIndex(e => e.date === newEntry.date);
    
    if (existingIndex !== -1) {
      updatedEntries[existingIndex] = newEntry;
    } else {
      updatedEntries.unshift(newEntry);
    }
    
    setEntries(updatedEntries);
    if (userId) {
      await supabase.from('entries').upsert({ ...newEntry, user_id: userId });
    }
    setActiveView('dashboard');
  };

  const deleteEntry = async (id: string) => {
    if (isExpired) return;
    setEntries(entries.filter(e => e.id !== id));
    if (userId) {
      await supabase.from('entries').delete().eq('id', id);
    }
  };

  const suggestedGoals = useMemo(() => {
    const workedEntries = entries.filter(e => e.status === 'work');
    if (workedEntries.length === 0) return { daily: 150, weekly: 900, monthly: 4000 };

    const monthlyMaint = maintenanceItems.reduce((acc, curr) => acc + (curr.qtyPerYear * curr.unitValue), 0) / 12;
    const bikeVal = bikeInfo ? (bikeInfo.manualValue || bikeInfo.fipeValue || 15000) : 15000;
    const monthlyRepl = replacementGoal ? Math.max(0, replacementGoal.targetPrice - bikeVal) / replacementGoal.monthsToGoal : 0;
    const monthlyDebts = debts.filter(d => d.status === 'active').reduce((acc, curr) => acc + curr.installmentValue, 0);
    
    const dailyMaintCost = plannedWorkDays > 0 ? monthlyMaint / plannedWorkDays : 0;
    const dailyReplCost = plannedWorkDays > 0 ? monthlyRepl / plannedWorkDays : 0;
    const dailyDebtCost = plannedWorkDays > 0 ? monthlyDebts / plannedWorkDays : 0;

    const last30Days = workedEntries.filter(e => isAfter(parseISO(e.date), subDays(new Date(), 30)));
    const targetSet = last30Days.length > 0 ? last30Days : workedEntries.slice(0, 10);

    const totalNetProfit = targetSet.reduce((acc, entry) => {
      const dayEarnings = entry.earnings.reduce((s, e) => s + e.amount, 0);
      const dayExpenses = entry.expenses.reduce((sum, ex) => sum + ex.amount, 0);
      return acc + (dayEarnings - dayExpenses - dailyMaintCost - dailyReplCost - dailyDebtCost);
    }, 0);

    const totalGross = targetSet.reduce((acc, entry) => acc + entry.earnings.reduce((sum, e) => sum + e.amount, 0), 0);

    const avgNetDaily = totalNetProfit / targetSet.length;
    const avgGrossDaily = totalGross / targetSet.length;

    return {
      daily: Math.round(avgNetDaily > 0 ? avgNetDaily : 150),
      weekly: Math.round((avgNetDaily > 0 ? avgNetDaily : 150) * (plannedWorkDays / 4.33)),
      monthly: Math.round((avgGrossDaily > 0 ? avgGrossDaily : 180) * plannedWorkDays)
    };
  }, [entries, maintenanceItems, bikeInfo, replacementGoal, plannedWorkDays, debts]);

  if (isAuthComplete === null) return <div className="min-h-screen flex items-center justify-center text-slate-600" role="status">Carregando seu Giro…</div>;
  if (!isAuthComplete) return <InitialFlow onComplete={() => { void supabase.auth.getSession().then(({ data }) => setIsAuthComplete(Boolean(data.session))); }} />;
  
  if (isExpired && userId && activeView === 'add') {
    return <PaymentScreen userId={userId} userName={userName} userEmail={userEmail} onPaymentSuccess={handlePaymentSuccess} />;
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            {isExpired && (
              <div className="bg-red-50 p-4 rounded-3xl border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-xl text-white shadow-sm">
                    <AlertCircle size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-red-900 leading-tight">Plano Expirado</p>
                    <p className="text-[10px] font-medium text-red-600">Renove para lançar novos ganhos.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveView('payment')}
                  className="bg-red-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-sm shadow-red-200"
                >
                  RENOVAR
                </button>
              </div>
            )}
            <div className="flex justify-between items-end mb-2 px-1">
              <div className="flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Salve, {userName.split(' ')[0]}!</span>
                <h2 className="text-3xl font-black text-slate-800 leading-none">Seu Giro</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveView('insights')}
                  className="bg-orange-50 p-2.5 rounded-2xl text-orange-500 active:scale-90 transition-all border border-orange-100"
                >
                  <Sparkles size={20} />
                </button>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 p-2.5 rounded-2xl text-slate-500 active:scale-90 transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            {entries.length === 0 ? (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="text-slate-300" size={32} />
                </div>
                <h3 className="text-slate-800 font-black text-xl mb-2">Bora começar o giro?</h3>
                <p className="text-slate-400 font-medium text-sm mb-6">Registre seu primeiro corre para ver como estão suas finanças.</p>
                <button onClick={() => setActiveView('add')} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-orange-100">REGISTRAR AGORA</button>
              </div>
            ) : (
              <DashboardCharts 
                entries={entries} 
                maintenanceItems={maintenanceItems} 
                replacementGoal={replacementGoal}
                bikeInfo={bikeInfo}
                plannedWorkDays={plannedWorkDays}
                debts={debts}
              />
            )}
          </div>
        );
      case 'maintenance':
        return (
          <BikeManager 
            bike={bikeInfo}
            onUpdateBike={handleUpdateBikeInfo}
            replacementGoal={replacementGoal}
            onUpdateGoal={handleUpdateReplacementGoal}
            maintenanceItems={maintenanceItems}
            onUpdateMaintenance={handleUpdateMaintenanceItems}
            workDaysCount={0}
            plannedWorkDays={plannedWorkDays}
            onUpdateWorkDays={handleUpdatePlannedWorkDays}
          />
        );
      case 'debts':
        return <DebtManager debts={debts} onUpdate={handleUpdateDebts} plannedWorkDays={plannedWorkDays} />;
      case 'calendar':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-800 px-1 mb-4">Sua Agenda</h2>
            <FinancialCalendar entries={entries} debts={debts} onSelectDay={(date) => { setSelectedDate(date); setActiveView('add'); }} />
          </div>
        );
      case 'history':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
             <h2 className="text-3xl font-black text-slate-800 px-1 mb-4">Histórico</h2>
             <div className="space-y-3">
               {[...entries].map(entry => {
                 const lucro = entry.earnings.reduce((s, c) => s + c.amount, 0) - entry.expenses.reduce((sum, c) => sum + c.amount, 0);
                 return (
                   <div key={entry.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex justify-between items-center group active:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1.25rem] flex flex-col items-center justify-center font-black ${entry.status === 'work' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                          <span className="text-xs uppercase leading-none opacity-50 mb-0.5">{format(parseISO(entry.date), 'EEE', { locale: ptBR })}</span>
                          <span className="text-lg leading-none">{entry.date.split('-')[2]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{format(parseISO(entry.date), 'dd/MM/yyyy')}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${entry.status === 'work' ? 'text-emerald-500' : 'text-slate-300'}`}>{entry.status === 'work' ? 'TRABALHOU' : 'FOLGA'}</p>
                        </div>
                     </div>
                     <div className="text-right flex items-center gap-4">
                        <div>
                          <p className={`text-base font-black ${lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>R$ {lucro.toFixed(0)}</p>
                        </div>
                        <button onClick={() => deleteEntry(entry.id)} className="text-slate-200 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        );
      case 'add':
        return <QuickEntry initialDate={selectedDate} onSave={handleSaveEntry} onCancel={() => { setSelectedDate(new Date()); setActiveView('dashboard'); }} />;
      case 'insights':
        return <InsightPanel entries={entries} goals={goals} />;
      case 'payment':
        return <PaymentScreen userId={userId!} userName={userName} userEmail={userEmail} onPaymentSuccess={handlePaymentSuccess} />;
      case 'goals':
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500 pb-20">
             <div className="flex justify-between items-center px-1">
               <h2 className="text-3xl font-black text-slate-800">Suas Metas</h2>
               <button onClick={() => setActiveView('dashboard')} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
             </div>
             <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-orange-500 p-1 rounded-lg"><Sparkles size={14} className="text-white fill-white" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Metas Inteligentes</span>
                </div>
                <p className="text-sm font-medium text-slate-200 mb-4 leading-relaxed">Calculamos metas realistas baseadas no <span className="text-orange-400 font-black">seu ritmo real</span>.</p>
                <button onClick={() => setGoals(suggestedGoals)} className="bg-white/10 px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all group">
                  <RefreshCcw size={16} className="text-orange-400 group-active:rotate-180 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-widest">Aplicar Sugestão Automática</span>
                </button>
             </div>
             <div className="space-y-4">
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Meta Diária (Líquida)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">R$</span>
                    <input type="number" value={goals.daily} onChange={(e) => setGoals({...goals, daily: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl p-5 pl-12 text-2xl font-black text-slate-800" />
                  </div>
                </div>
                <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Meta Mensal (Bruta)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">R$</span>
                    <input type="number" value={goals.monthly} onChange={(e) => setGoals({...goals, monthly: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-none rounded-2xl p-5 pl-12 text-2xl font-black text-slate-800" />
                  </div>
                </div>
             </div>
             <button onClick={() => setActiveView('dashboard')} className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl text-sm tracking-widest">SALVAR E VOLTAR</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeView={activeView} setActiveView={setActiveView}>
      <NotificationOverlay entries={entries} onAction={() => setActiveView('add')} />
      {renderContent()}
    </Layout>
  );
};

export default App;
