import { CommunitiesPage } from '@/components/social-pages';
export default async function Community({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <CommunitiesPage slug={slug}/>}
