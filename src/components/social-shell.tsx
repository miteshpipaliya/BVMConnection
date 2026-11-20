'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Clapperboard, Compass, Heart, Home, Menu, MessageCircle, PlusSquare, Search, Settings, UsersRound, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DemoProvider, useDemo } from '@/lib/demo-store';

type NavItem = { label: string; href: string; Icon: LucideIcon };
const links: NavItem[] = [
  { label: 'Home', href: '/home', Icon: Home },
  { label: 'Search', href: '/explore', Icon: Search },
  { label: 'Reels', href: '/reels', Icon: Clapperboard },
  { label: 'Messages', href: '/messages', Icon: MessageCircle },
  { label: 'Notifications', href: '/notifications', Icon: Heart },
  { label: 'Create', href: '/home?compose=1', Icon: PlusSquare },
  { label: 'Community', href: '/communities', Icon: UsersRound },
  { label: 'Profile', href: '/profile/mitesh.pipaliya', Icon: UserRound },
];
const mobileLabels = new Set(['Home', 'Search', 'Reels', 'Create', 'Community', 'Profile']);
function activeLink(pathname: string, item: NavItem) {
  if (item.label === 'Create') return false;
  if (item.label === 'Profile') return pathname.startsWith('/profile');
  if (item.label === 'Search') return pathname.startsWith('/explore');
  if (item.label === 'Community') return pathname.startsWith('/communities');
  return pathname === item.href || pathname.startsWith(item.href + '/');
}
function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/home" className={'cc-brand' + (compact ? ' cc-brand-mobile' : '')} aria-label="CampusConnect home">
    <span className="cc-logo" aria-hidden="true"><span style={{fontWeight:900,letterSpacing:"-0.12em"}}>C<span style={{color:"#c4a0ff"}}>C</span></span></span>
    <span className="cc-wordmark">Campus<span>Culture</span><small>BVM CAMPUS</small></span>
  </Link>;
}
function Nav({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return <nav className={mobile ? 'cc-mobile-nav' : 'cc-navigation'} aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
    {links.filter((item) => !mobile || mobileLabels.has(item.label)).map((item) => {
      const active = activeLink(pathname, item);
      const Icon = item.Icon;
      return <Link key={item.label} href={item.href} className={'cc-nav-item' + (active ? ' is-active' : '')}
        aria-current={active ? 'page' : undefined} aria-label={item.label} title={item.label}>
        <Icon size={mobile ? 23 : 25} strokeWidth={active ? 2.8 : 1.8} fill={active && item.label === 'Home' ? 'currentColor' : 'none'} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>;
    })}
  </nav>;
}
function Suggestions() {
  const { people, setPerson } = useDemo();
  return <aside className="cc-suggestions" aria-label="Suggested campus accounts">
    <div className="cc-me"><span className="cc-person-avatar you">MP</span><div><Link href="/profile/mitesh.pipaliya"><b>mitesh.pipaliya</b></Link><small>Your campus profile · demo</small></div><Link href="/profile/mitesh.pipaliya">View</Link></div>
    <div className="cc-suggestion-heading"><b>Suggested for you</b><Link href="/connections">See all</Link></div>
    {people.slice(0,5).map((person,i) => <div className="cc-suggested" key={person.handle}>
      <span className={'cc-person-avatar hue-' + i} aria-hidden="true">{person.name.split(' ').map(x => x[0]).join('')}</span>
      <div><Link href={'/profile/' + person.handle}><b>{person.handle}</b></Link><small>{person.dept}</small></div>
      <button type="button" onClick={() => setPerson(person.handle, person.state === 'connected' ? 'none' : 'connected')}>
        {person.state === 'connected' ? 'Following' : 'Follow'}
      </button>
    </div>)}
    <div className="cc-aside-links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/community-guidelines">Guidelines</Link><Link href="/settings">Settings</Link></div>
    <p className="cc-copyright">© 2026 CAMPUSCONNECT · BVM</p>
    <p className="cc-demo-disclaimer">Demo mode: interactions and sample identities are local, not live student data.</p>
  </aside>;
}
export default function SocialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <DemoProvider><div className="cc-app">
    <aside className="cc-sidebar" aria-label="Site navigation">
      <Brand />
      <Nav pathname={pathname} />
      <details className="cc-more">
        <summary><Menu size={25} strokeWidth={1.8} /><span>More</span></summary>
        <div><Link href="/settings"><Settings size={18}/>Settings</Link><Link href="/bookmarks"><Bookmark size={18}/>Saved</Link><Link href="/connections"><Compass size={18}/>Find students</Link></div>
      </details>
    </aside>
    <main className="cc-main" id="main-content">
      <header className="cc-mobile-header"><Brand compact/><div><Link href="/notifications" aria-label="Notifications"><Heart size={23}/></Link><Link href="/messages" aria-label="Messages"><MessageCircle size={23}/></Link></div></header>
      <div className="cc-page">{children}</div>
    </main>
    <Suggestions/>
    <Nav pathname={pathname} mobile />
  </div></DemoProvider>;
}
