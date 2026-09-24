import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePlanAnalysis, planRequest, DEFAULT_PLAN_MODEL, openAIPlanRequest } from '../lib/plan-analysis.ts';
test('GPT-5 mini uses compatible reasoning parameters and no sampling temperature',()=>{
  const body=openAIPlanRequest('data:image/png;base64,AAAA');
  assert.equal(body.model,'gpt-5-mini');
  assert.equal(body.store,false);
  assert.equal(body.reasoning_effort,'low');
  assert.equal(body.max_completion_tokens,8000);
  assert.equal('temperature' in body,false);
  assert.equal('max_tokens' in body,false);
  assert.equal(body.messages[1].content[1].image_url.url,'data:image/png;base64,AAAA');
});
test('preserves unknown measurements without filling them in',()=>{
  const result=parsePlanAnalysis({rooms:[{name:'Cuisine',length:null,width:null,area:12.5,note:'Surface inscrite'}],warnings:['Cotes illisibles']});
  assert.equal(result.rooms[0].length,null);
  assert.equal(result.rooms[0].area,12.5);
});
test('rejects malformed model measurements and excessive responses',()=>{
  for(const length of [-1,NaN,Infinity,'5',0]) {
    assert.throws(()=>parsePlanAnalysis({rooms:[{name:'Test',length,width:3,area:null,note:''}],warnings:[]}));
  }
  assert.throws(()=>parsePlanAnalysis({rooms:[],warnings:'hello'}));
  assert.throws(()=>parsePlanAnalysis({rooms:Array(101).fill({}),warnings:[]}));
});
test('request uses vision input and structured JSON without client metadata',()=>{
  const req=planRequest('data:image/png;base64,AAAA',DEFAULT_PLAN_MODEL);
  assert.equal(req.model,'Qwen3.8-27B');
  assert.equal(req.response_format.type,'json_object');
  assert.equal(req.messages[1].content[1].image_url.url,'data:image/png;base64,AAAA');
  assert.equal(req.max_tokens,5000);
});
