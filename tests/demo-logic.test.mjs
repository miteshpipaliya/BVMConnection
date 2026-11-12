import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectFeed, togglePostState } from '../src/lib/demo-logic.ts';

const posts=[
 {id:'a',name:'A',handle:'a',dept:'CE',time:'now',body:'Campus note',likes:2,replies:0,reposts:0,tag:'CAMPUS',liked:false,saved:false,following:true,comments:[],own:false},
 {id:'b',name:'B',handle:'b',dept:'IT',time:'earlier',body:'Project note',likes:1,replies:0,reposts:0,tag:'PROJECTS',liked:true,saved:false,following:false,comments:[],own:false},
];

describe('demo social state',()=>{
 it('filters following and campus feeds and returns latest in reverse order',()=>{
  assert.deepEqual(selectFeed(posts,'Following').map(p=>p.id),['a']);
  assert.deepEqual(selectFeed(posts,'Campus').map(p=>p.id),['a']);
  assert.deepEqual(selectFeed(posts,'Latest').map(p=>p.id),['b','a']);
  assert.deepEqual(selectFeed(posts,'For you'),posts);
 });
 it('toggles likes with matching count updates and leaves other posts untouched',()=>{
  const liked=togglePostState(posts,'a','liked');
  assert.equal(liked[0].liked,true);assert.equal(liked[0].likes,3);assert.equal(liked[1],posts[1]);
  const unliked=togglePostState(liked,'a','liked');
  assert.equal(unliked[0].liked,false);assert.equal(unliked[0].likes,2);
 });
 it('toggles bookmarks and following without changing the like count',()=>{
  const saved=togglePostState(posts,'a','saved');assert.equal(saved[0].saved,true);assert.equal(saved[0].likes,2);
  const followed=togglePostState(posts,'b','following');assert.equal(followed[1].following,true);assert.equal(followed[1].likes,1);
 });
});
