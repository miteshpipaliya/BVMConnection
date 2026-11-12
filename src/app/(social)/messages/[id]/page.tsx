import { MessagesPage } from '@/components/social-pages';
export default async function Chat({params}:{params:Promise<{id:string}>}){const {id}=await params;return <MessagesPage id={id}/>}
