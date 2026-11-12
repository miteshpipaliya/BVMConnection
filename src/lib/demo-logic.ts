import type { DemoPost } from './demo-store';

export function selectFeed(posts:DemoPost[],tab:string):DemoPost[]{switch(tab){case'Following':return posts.filter(p=>p.following);case'Latest':return [...posts].reverse();case'Campus':return posts.filter(p=>p.tag==='CAMPUS'||p.tag==='WORKSHOP');default:return posts}}

export function togglePostState(posts:DemoPost[],id:string,key:'liked'|'saved'|'following'):DemoPost[]{return posts.map(p=>p.id===id?{...p,[key]:!p[key],...(key==='liked'?{likes:p.likes+(p.liked?-1:1)}:{})}:p)}
