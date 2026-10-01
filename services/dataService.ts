import { supabase } from './supabase';
import type { DailyEntry, MaintenanceItem, ExpenseDebt, BikeInfo, ReplacementGoal, FinancialGoals } from '../types';
const checked = (r: any) => { if(r.error) throw r.error; return r.data; };
export async function loadData(uid: string) {
 const results = await Promise.all([
 supabase.from('profiles').select('*').eq('id',uid).single(),
 supabase.from('entries').select('*').eq('user_id',uid).order('date',{ascending:false}),
 supabase.from('maintenance_items').select('*').eq('user_id',uid),
 supabase.from('my_bike').select('*').eq('user_id',uid).maybeSingle(),
 supabase.from('vehicle_goals').select('*').eq('user_id',uid).maybeSingle(),
 supabase.from('debts').select('*').eq('user_id',uid),
 supabase.from('goals').select('*').eq('user_id',uid)
 ]);
 const [p,entries,maintenance,bike,goal,debts,goalRows] = results.map(checked);
 return {
 profile: { ...p, planned_work_days:p.work_days_per_month ?? 22, trial_expires_at:p.plan_expiry_date, plano_fim:p.plan_expiry_date },
 entries:entries.map((e:any)=>({id:e.id,date:e.date,earnings:e.earnings,expenses:e.expenses,hoursWorked:Number(e.hours_worked),fuelUsed:e.fuel_used,status:e.status,notes:e.notes})),
 maintenance:maintenance.map((m:any)=>({id:m.id,name:m.name,qtyPerYear:m.qty_per_year,unitValue:Number(m.unit_value)})),
 bike:bike?{brand:bike.brand||'',model:bike.model||'',year:bike.year,mileage:bike.mileage,condition:bike.condition||'good',usage:bike.usage_type||'work',manualValue:bike.manual_value??bike.base_value,fipeValue:bike.fipe_value,fipeDate:bike.fipe_date,licensePlate:bike.license_plate}:null,
 replacementGoal:goal?{targetModel:goal.model,targetYear:goal.target_year??new Date().getFullYear(),targetPrice:Number(goal.target_value),monthsToGoal:goal.months_to_goal,paymentMethod:goal.payment_type,downPayment:goal.down_payment,installmentValue:goal.installment_value}:null,
 debts:debts.map((d:any)=>({id:d.id,name:d.name,type:d.type,paymentMethod:d.payment_method,totalValue:d.total_value,installmentValue:Number(d.installment_value),totalInstallments:d.total_installments,paidInstallments:d.paid_installments,startDate:d.start_date,dueDay:d.due_day,status:d.status||(d.is_paid?'paid':'active')})),
 goals:{daily:Number(goalRows.find((g:any)=>g.type==='DAILY')?.amount??150),weekly:Number(goalRows.find((g:any)=>g.type==='WEEKLY')?.amount??1000),monthly:Number(goalRows.find((g:any)=>g.type==='MONTHLY')?.amount??4000)}
 };
}
export async function saveWorkDays(uid:string, value:number) { checked(await supabase.from('profiles').update({work_days_per_month:value}).eq('id',uid).select().single()); }
export async function saveMaintenance(items:MaintenanceItem[]) { checked(await supabase.rpc('gc_save_maintenance',{items})); }
export async function saveDebts(items:ExpenseDebt[]) { checked(await supabase.rpc('gc_save_debts',{items})); }
export async function saveBike(uid:string,b:BikeInfo) {
 checked(await supabase.from('my_bike').upsert({user_id:uid,brand:b.brand,model:b.model,year:b.year,mileage:b.mileage,condition:b.condition,usage_type:b.usage,base_value:b.manualValue??b.fipeValue,manual_value:b.manualValue,fipe_value:b.fipeValue,fipe_date:b.fipeDate,license_plate:b.licensePlate},{onConflict:'user_id'}).select().single());
}
export async function saveReplacement(uid:string,g:ReplacementGoal|null) {
 if(!g) { checked(await supabase.from('vehicle_goals').delete().eq('user_id',uid));return; }
 checked(await supabase.from('vehicle_goals').upsert({user_id:uid,model:g.targetModel,target_year:g.targetYear,target_value:g.targetPrice,months_to_goal:g.monthsToGoal,payment_type:g.paymentMethod,down_payment:g.downPayment,installment_value:g.installmentValue},{onConflict:'user_id'}).select().single());
}
export async function saveEntry(uid:string,e:DailyEntry):Promise<DailyEntry> {
 const r=checked(await supabase.from('entries').upsert({id:e.id,user_id:uid,date:e.date,earnings:e.earnings,expenses:e.expenses,hours_worked:e.hoursWorked,fuel_used:e.fuelUsed,status:e.status,notes:e.notes},{onConflict:'user_id,date'}).select().single());
 return {...e,id:r.id};
}
export async function removeEntry(uid:string,id:string) {checked(await supabase.from('entries').delete().eq('user_id',uid).eq('id',id));}
export async function saveGoals(uid:string,g:FinancialGoals) {checked(await supabase.from('goals').upsert(Object.entries(g).map(([type,amount])=>({user_id:uid,type:type.toUpperCase(),amount})),{onConflict:'user_id,type'}));}
