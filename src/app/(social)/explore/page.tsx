import { ExplorePage } from '@/components/social-pages';
export default async function Explore({searchParams}:{searchParams:Promise<{q?:string}>}){const {q=''}=await searchParams;return <ExplorePage initialQuery={q}/>}
