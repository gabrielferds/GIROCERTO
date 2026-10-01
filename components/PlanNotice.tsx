import React from 'react';
import { Clock3 } from 'lucide-react';
import { planTiming } from '../services/billingPolicy.mjs';
interface Props {expiresAt:string|null;isFirstMonth:boolean;now:number;onPay:()=>void;}
export default function PlanNotice({expiresAt,isFirstMonth,now,onPay}:Props){
  if(!expiresAt)return null;
  const {expired,earlyRenewal,daysLeft}=planTiming(expiresAt,isFirstMonth,now);
  if(!expired && !earlyRenewal && !isFirstMonth)return null;
  const date=new Date(expiresAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
  return <aside className={`mb-5 p-4 rounded-3xl border ${expired?'bg-red-50 border-red-100':'bg-orange-50 border-orange-100'}`} aria-label="Seu plano GiroCerto">
    <div className="flex gap-3 items-start">
      <Clock3 size={22} className="text-orange-600 shrink-0 mt-1" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-bold text-slate-900">{expired?(isFirstMonth?'Seu teste terminou':'Seu plano venceu'):earlyRenewal?'Seu plano está perto de vencer':`Você tem ${daysLeft} ${daysLeft===1?'dia':'dias'} de teste restantes`}</p>
        <p className="text-sm text-slate-600 mt-1">{expired?'Continue usando o GiroCerto por R$ 12,99 a cada 30 dias.':earlyRenewal?`Vence em ${date}. Renove agora por R$ 10,00; no vencimento, R$ 12,99.`:`Conheça o app até ${date}. Depois, R$ 12,99 por 30 dias, sem débito automático.`}</p>
        {earlyRenewal && <p className="text-xs text-slate-500 mt-2">Os próximos 30 dias começam no vencimento atual. Você não perde os dias restantes.</p>}
      </div>
    </div>
    {(expired||earlyRenewal)&&<button onClick={onPay} className="mt-4 w-full sm:w-auto px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold">{earlyRenewal?'Renovar por R$ 10,00':isFirstMonth?'Ativar plano por R$ 12,99':'Renovar por R$ 12,99'}</button>}
  </aside>;
}
