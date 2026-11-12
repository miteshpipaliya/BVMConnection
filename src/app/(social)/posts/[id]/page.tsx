import { PostDetail } from '@/components/social-pages';
export default async function Post({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PostDetail id={id}/>}
