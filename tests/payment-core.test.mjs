import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { isPaidOrder, verifySignature } from '../supabase/functions/_shared/payment-core.mjs';
const charge={id:'intent-1',provider_order_id:'ORDABC',amount:12.99};
const paid={id:'ORDABC',external_reference:'intent-1',type:'online',country_code:'BRA',currency_id:'BRL',
  total_amount:'12.99',total_paid_amount:'12.99',status:'processed',status_detail:'accredited',
  transactions:{payments:[{amount:'12.99',paid_amount:'12.99',status:'processed',status_detail:'accredited',payment_method:{id:'pix'}}]}};
test('only an exact accredited PIX order can unlock a plan',()=>{
 assert.equal(isPaidOrder(paid,charge),true);
 for(const patch of [{id:'ORDOTHER'},{external_reference:'other-user'},{total_amount:'0.01'},
   {total_paid_amount:'0.01'},{currency_id:'USD'},{country_code:'ARG'},{status:'action_required'},
   {status_detail:'refunded'},{transactions:{payments:[]}}]){
   assert.equal(Boolean(isPaidOrder({...paid,...patch},charge)),false);
 }
 const refund=structuredClone(paid);refund.transactions.payments[0].status_detail='refunded';
 assert.equal(isPaidOrder(refund,charge),false);
});
test('discounted PIX must match the exact server-stored price',()=>{
 const discounted=structuredClone(paid);
 discounted.total_amount='10.00';discounted.total_paid_amount='10.00';
 discounted.transactions.payments[0].amount='10.00';discounted.transactions.payments[0].paid_amount='10.00';
 assert.equal(isPaidOrder(discounted,{...charge,amount:10}),true);
 assert.equal(isPaidOrder(discounted,charge),false);
 assert.equal(isPaidOrder(paid,{...charge,amount:10}),false);
 assert.equal(isPaidOrder(paid,{...charge,amount:0.01}),false);
});
test('HMAC signature rejects altered id, request, secret, and malformed signature',async()=>{
 const secret='test-only-secret',ts='1742505638683',request='request-1',id='ORDABC';
 const hash=createHmac('sha256',secret).update(`id:ordabc;request-id:${request};ts:${ts};`).digest('hex');
 const signature=`ts=${ts},v1=${hash}`;
 assert.equal(await verifySignature(signature,request,id,secret),true);
 assert.equal(await verifySignature(signature,request,'ORDOTHER',secret),false);
 assert.equal(await verifySignature(signature,'other-request',id,secret),false);
 assert.equal(await verifySignature(signature,request,id,'different-secret'),false);
 assert.equal(await verifySignature('bad',request,id,secret),false);
 assert.equal(await verifySignature(signature,null,id,secret),false);
});
