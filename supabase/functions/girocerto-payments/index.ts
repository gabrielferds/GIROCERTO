import { admin, ready, provider, syncCharge, publicCharge } from '../_shared/server.ts';
const origin='https://girocerto.gabrielferds044.chatgpt.site';
const headers={'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
 'Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
const json=(value:any,status=200)=>new Response(JSON.stringify(value),{status,headers});
Deno.serve(async req=>{
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers});
 if(req.method!=='POST') return json({error:'Método inválido.'},405);
 try{
  const token=req.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');
  if(!token) return json({error:'Entre na sua conta para pagar.'},401);
  const {data:{user},error:authError}=await admin.auth.getUser(token);
  if(authError||!user?.email) return json({error:'Sua sessão expirou. Entre novamente.'},401);
  const body=await req.json();
  if(body.action==='config') {
    const {data:quote,error}=await admin.rpc('gc_payment_quote',{p_user_id:user.id});
    if(error) throw new Error('Não foi possível consultar seu plano.');
    return json({ready:ready(),...quote});
  }
  if(!ready()) return json({error:'O pagamento automático está em configuração.'},503);
  if(body.action==='status'){
    const {data:charge,error}=await admin.from('gc_payments').select('*').eq('id',body.id).eq('user_id',user.id).maybeSingle();
    if(error||!charge) return json({error:'Cobrança não encontrada.'},404);
    return json(publicCharge(charge.provider_order_id ? await syncCharge(charge):charge));
  }
  if(body.action!=='create') return json({error:'Ação inválida.'},400);
  // Reuse the same intent and provider idempotency key across retries, reloads,
  // concurrent browser clicks, and failures after provider creation.
  const {data:profile}=await admin.from('profiles').select('id').eq('id',user.id).maybeSingle();
  if(!profile) return json({error:'Cadastro não encontrado.'},400);
  const {data:recent,error:recentError}=await admin.from('gc_payments').select('*').eq('user_id',user.id)
    .gt('expires_at',new Date().toISOString()).is('activated_at',null).not('status','in','(canceled,failed,expired)').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(recentError) throw new Error('Não foi possível consultar sua cobrança.');
  let charge=recent;
  if(charge?.provider_order_id) return json(publicCharge(await syncCharge(charge)));
  if(!charge){
    const {data,error}=await admin.rpc('gc_get_payment_intent',{p_user_id:user.id});
    if(error) throw new Error('Não foi possível iniciar sua cobrança.');
    charge=data;
    if(charge.provider_order_id) return json(publicCharge(await syncCharge(charge)));
  }
  const amount=Number(charge.amount).toFixed(2);
  const order=await provider('/v1/orders',{method:'POST',headers:{'X-Idempotency-Key':charge.id},body:JSON.stringify({
    type:'online',total_amount:amount,external_reference:charge.id,processing_mode:'automatic',
    transactions:{payments:[{amount,payment_method:{id:'pix',type:'bank_transfer'},expiration_time:'PT30M'}]},
    payer:{email:user.email}})});
  if(!/^ORD[A-Z0-9]+$/i.test(order.id||'')||order.external_reference!==charge.id) throw new Error('Resposta de cobrança inválida.');
  const method=order.transactions?.payments?.[0]?.payment_method;
  const {data:saved,error}=await admin.from('gc_payments').update({provider_order_id:order.id,status:order.status,
    qr_code:method?.qr_code||null,qr_code_base64:method?.qr_code_base64||null}).eq('id',charge.id).select('*').single();
  if(error) throw new Error('Não foi possível registrar a cobrança. Tente novamente para recuperar o mesmo PIX.');
  return json(publicCharge(saved));
 }catch(error){return json({error:error instanceof Error?error.message:'Não foi possível processar o pagamento.'},502);}
});
