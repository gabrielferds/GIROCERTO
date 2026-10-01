import { admin, ready, syncCharge } from '../_shared/server.ts';
import { verifySignature } from '../_shared/payment-core.mjs';
Deno.serve(async req=>{
 if(req.method!=='POST') return new Response('Method not allowed',{status:405});
 if(!ready()) return new Response('Not configured',{status:503});
 try{
  const url=new URL(req.url), id=url.searchParams.get('data.id');
  if(!id||!/^ORD[A-Z0-9]+$/i.test(id)) return new Response('Invalid order',{status:400});
  if(!await verifySignature(req.headers.get('x-signature'),req.headers.get('x-request-id'),id,
    Deno.env.get('MERCADO_PAGO_WEBHOOK_SECRET'))) return new Response('Invalid signature',{status:401});
  const body=await req.json();
  if(body.type!=='order'||body.data?.id!==id||body.live_mode!==true||String(body.application_id)!=='7087419125626531') return new Response('Invalid event',{status:400});
  const {data:charge,error}=await admin.from('gc_payments').select('*').eq('provider_order_id',id).maybeSingle();
  if(error) return new Response('Retry later',{status:500});
  if(!charge) return new Response('Retry after charge is saved',{status:503});
  await syncCharge(charge,true);
  return new Response('OK',{status:200});
 }catch{console.error('Mercado Pago webhook reconciliation failed');return new Response('Retry later',{status:500});}
});
