import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DAY_MS,planTiming} from '../services/billingPolicy.mjs';
const paid=Date.parse('2026-10-01T10:15:30.000Z');
const expiry=new Date(paid+30*DAY_MS).toISOString();
test('reminder starts exactly after 28 days and ends at expiry',()=>{
 assert.equal(planTiming(expiry,false,paid+28*DAY_MS-1).earlyRenewal,false);
 assert.equal(planTiming(expiry,false,paid+28*DAY_MS).earlyRenewal,true);
 assert.equal(planTiming(expiry,false,paid+30*DAY_MS-1).earlyRenewal,true);
 assert.deepEqual(planTiming(expiry,false,paid+30*DAY_MS),{expired:true,earlyRenewal:false,daysLeft:0});
});
test('trial expires after exactly 72 hours and never receives renewal discount',()=>{
 const trial=new Date(paid+3*DAY_MS).toISOString();
 assert.equal(planTiming(trial,true,paid+DAY_MS).earlyRenewal,false);
 assert.equal(planTiming(trial,true,paid+3*DAY_MS-1).expired,false);
 assert.equal(planTiming(trial,true,paid+3*DAY_MS).expired,true);
});
