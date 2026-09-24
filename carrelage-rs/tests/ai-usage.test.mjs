import test from 'node:test';
import assert from 'node:assert/strict';
import {tokensFromResponse,estimateNanoUsd,summarizeUsage,monthKey} from '../lib/ai-usage.ts';
test('cached input is discounted; reasoning is not charged twice',()=>{
 const usage=tokensFromResponse({prompt_tokens:5000,completion_tokens:2000,prompt_tokens_details:{cached_tokens:1000},completion_tokens_details:{reasoning_tokens:1500}});
 assert.equal(estimateNanoUsd(usage),5025000);
 assert.equal(estimateNanoUsd({...usage,reasoning:0}),5025000);
});
test('unknown usage is not replaced with zero; invalid counters rejected',()=>{
 assert.equal(tokensFromResponse(null),null);
 assert.equal(tokensFromResponse({prompt_tokens:4,completion_tokens:2,prompt_tokens_details:{cached_tokens:5}}),null);
 assert.equal(tokensFromResponse({prompt_tokens:-1,completion_tokens:2}),null);
 assert.deepEqual(tokensFromResponse({prompt_tokens:4,completion_tokens:2}),{input:4,output:2,cached:0,reasoning:0});
});
test('monthly Reunion totals include billable failures, keep unknown costs separate',()=>{
 const base={model:'gpt-5-mini',usage:null,pricing:'test'};
 const events=[{...base,id:'a',date:'2026-08-31T21:00:00Z',status:'error',costNanoUsd:5000000},{...base,id:'b',date:'2026-08-01T00:00:00Z',status:'success',costNanoUsd:1000000},{...base,id:'c',date:'2026-09-02T00:00:00Z',status:'pending',costNanoUsd:null},{...base,id:'d',date:'2026-09-02T00:00:00Z',status:'rejected',costNanoUsd:0}];
 const sum=summarizeUsage(events,new Date('2026-09-15T00:00:00Z'));
 assert.equal(sum.monthUsd,.005);assert.equal(sum.totalUsd,.006);
 assert.equal(sum.unknown,1);assert.equal(sum.rejected,1);assert.equal(sum.errors,1);assert.equal(sum.successes,1);
 assert.equal(monthKey('2026-08-31T21:00:00Z'),monthKey('2026-09-01T04:00:00Z'));
});
