import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTs} from './load-ts.mjs';
const {findReward,rewardDiscount}=loadTs(new URL('../lib/rewards.ts',import.meta.url));
const {checkoutRewardCoupon}=loadTs(new URL('../lib/reward-checkout.ts',import.meta.url));
test('reward boundaries and invalid values',()=>{
 for(const [code,subtotal,expected] of [['KREA050',1799,50],['KREA050',1800,50],['KREA050',1801,0],['KREA050',0,0],['KREA2',3499,0],[' krea2 ',3500,200],['FORGED',99999,0],['KREA2',NaN,0],['KREA2',Infinity,0],['KREA2',-3500,0]])assert.equal(rewardDiscount(code,subtotal),expected);
});
test('Stripe reward coupon provisioning is deterministic and idempotent',async()=>{
 const calls=[]; const reward=findReward('KREA2');
 const stripe={coupons:{retrieve:async()=>{throw {code:'resource_missing'};},create:async(...args)=>{calls.push(args);return{id:args[0].id};}}};
 assert.equal(await checkoutRewardCoupon(stripe,reward),'krearun-reward-v1-200');
 assert.equal(calls[0][0].amount_off,200);assert.equal(calls[0][1].idempotencyKey,'krearun-reward-v1-200');
});
test('existing coupons are checked, unexpected Stripe errors do not create new ones',async()=>{
 let creates=0;
 const coupons={retrieve:async()=>({id:'existing',amount_off:200,valid:true,currency:'eur',duration:'once'}),create:async()=>{creates++;}};
 assert.equal(await checkoutRewardCoupon({coupons},findReward('KREA2')),'existing');
 coupons.retrieve=async()=>({id:'bad',amount_off:900,valid:true,currency:'eur',duration:'once'});
 await assert.rejects(checkoutRewardCoupon({coupons},findReward('KREA2')));assert.equal(creates,0);
 coupons.retrieve=async()=>{throw new Error('offline');};
 await assert.rejects(checkoutRewardCoupon({coupons},findReward('KREA2')));assert.equal(creates,0);
});
