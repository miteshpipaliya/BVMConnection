import { ProfilePage } from '@/components/social-pages';
export default async function Profile({params}:{params:Promise<{username:string}>}){const {username}=await params;return <ProfilePage username={username}/>}
