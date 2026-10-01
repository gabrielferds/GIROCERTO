
import React, { useState } from 'react';
import { User, Mail, Lock, ChevronRight, Bike, TrendingUp, Target, Sparkles, ShieldCheck, Check, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { addDays } from 'date-fns';

interface InitialFlowProps {
  onComplete: () => void;
}

type FlowStep = 'register' | 'login' | 'onboarding' | 'pricing';

const InitialFlow: React.FC<InitialFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState<FlowStep>('register');
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onboardingSlides = [
    {
      title: "Controle total do seu corre",
      description: "Lance seus ganhos e gastos em segundos. Saiba exatamente quanto está sobrando no final do dia.",
      icon: <TrendingUp size={48} className="text-orange-500" />,
      color: "bg-orange-50"
    },
    {
      title: "Planeje sua próxima nave",
      description: "Defina metas para trocar de moto ou fazer aquela manutenção pesada sem sustos.",
      icon: <Bike size={48} className="text-blue-500" />,
      color: "bg-blue-50"
    },
    {
      title: "Dicas de parceiro",
      description: "Receba insights inteligentes sobre os melhores dias para rodar e como economizar mais.",
      icon: <Sparkles size={48} className="text-purple-500" />,
      color: "bg-purple-50"
    },
    {
      title: "Foco no seu Lucro Real",
      description: "Descontamos taxas, gasolina e manutenção automaticamente para você ver seu lucro de verdade.",
      icon: <ShieldCheck size={48} className="text-emerald-500" />,
      color: "bg-emerald-50"
    }
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: formData.name,

          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user && !data.session) {
        setStep('login');
        setError('Conta criada. Confirme seu e-mail antes de entrar.');
        return;
      }

      if (data.user && data.session) {
        // O perfil é criado pelo trigger da Supabase, inclusive com confirmação por e-mail.
        setStep('onboarding');
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;
      onComplete();
    } catch (err: any) {
      setError(err.message || "E-mail ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  const nextOnboarding = () => {
    if (onboardingIndex < onboardingSlides.length - 1) {
      setOnboardingIndex(onboardingIndex + 1);
    } else {
      setStep('pricing');
    }
  };

  if (step === 'register' || step === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-10 text-center">
            <div className="bg-orange-500 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-200">
              <TrendingUp size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">GiroCerto</h1>
            <p className="text-slate-400 font-medium">As finanças do seu corre na palma da mão.</p>
          </div>

          <form onSubmit={step === 'register' ? handleRegister : handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 mb-2">
                {error}
              </div>
            )}
            
            {step === 'register' && (
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="text" 
                  placeholder="Seu Nome" 
                  className="w-full bg-white border-none rounded-2xl p-5 pl-12 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div className="relative">
              <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                required
                type="email" 
                placeholder="Seu E-mail" 
                className="w-full bg-white border-none rounded-2xl p-5 pl-12 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="relative">
              <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                required
                type="password"
                minLength={6} 
                placeholder="Sua Senha" 
                className="w-full bg-white border-none rounded-2xl p-5 pl-12 text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <button 
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl shadow-xl shadow-orange-100 active:scale-95 transition-all mt-6 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : (step === 'register' ? 'CRIAR CONTA GRATUITAMENTE' : 'ENTRAR NO APP')}
            </button>

            <button 
              type="button"
              onClick={() => setStep(step === 'register' ? 'login' : 'register')}
              className="w-full text-center text-xs font-bold text-slate-500 mt-2 uppercase tracking-widest"
            >
              {step === 'register' ? 'Já tenho uma conta' : 'Ainda não tenho conta'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-8">
          #NoCorre #GiroCerto
        </p>
      </div>
    );
  }

  if (step === 'onboarding') {
    const slide = onboardingSlides[onboardingIndex];
    return (
      <div className="min-h-screen bg-white flex flex-col p-8 animate-in slide-in-from-right duration-300">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <div className={`${slide.color} w-32 h-32 rounded-[3rem] flex items-center justify-center mb-10 animate-bounce-slow`}>
            {slide.icon}
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 leading-tight">{slide.title}</h2>
          <p className="text-slate-500 text-lg leading-relaxed">{slide.description}</p>
        </div>

        <div className="pb-10 space-y-8">
          <div className="flex justify-center gap-2">
            {onboardingSlides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === onboardingIndex ? 'w-8 bg-orange-500' : 'w-2 bg-slate-200'}`}
              />
            ))}
          </div>
          <button 
            onClick={nextOnboarding}
            className="w-full py-5 bg-slate-900 text-white font-black rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {onboardingIndex === onboardingSlides.length - 1 ? 'VAMOS LÁ' : 'PRÓXIMO'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'pricing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col p-6 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 bg-orange-500/10 w-40 h-40 rounded-full blur-3xl" />
            
            <div className="inline-flex bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
              OFERTA DE LANÇAMENTO
            </div>
            
            <h2 className="text-3xl font-black text-slate-800 mb-2">Acesso Total</h2>
            <p className="text-slate-400 font-medium mb-8">Experimente todas as ferramentas sem restrições.</p>

            <div className="space-y-4 mb-10 text-left">
              {[
                "3 dias de teste gratuito após o cadastro",
                "Dashboards de lucro real",
                "Metas inteligentes ilimitadas",
                "Controle de dívidas e boletos",
                "Calculadora de manutenção"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full">
                    <Check size={14} />
                  </div>
                  <span className="text-sm font-bold text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-50 pt-8">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Após o teste:</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-slate-900 font-black text-4xl">R$ 12,99</span>
                <span className="text-slate-400 font-bold text-sm">/30 dias</span>
              </div>
              <p className="text-[10px] text-orange-500 font-black uppercase mt-3 tracking-widest">
                RENOVE POR R$ 10,00 NOS ÚLTIMOS 2 DIAS DO PLANO
              </p>
              <p className="text-xs text-slate-500 mt-3">Primeiro pagamento: R$ 12,99. No vencimento, a renovação custa R$ 12,99. Pagamento por PIX, sem débito automático.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="w-full py-5 bg-orange-500 text-white font-black rounded-3xl shadow-xl shadow-orange-100 active:scale-95 transition-all mt-6"
        >
          CONTINUAR PARA O APP
        </button>
      </div>
    );
  }

  return null;
};

export default InitialFlow;
