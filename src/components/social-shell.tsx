'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  Clapperboard,
  CircleHelp,
  CircleUserRound,
  Home,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Settings,
  UsersRound,
  Bell,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { DemoProvider } from '@/lib/demo-store';

type Icon = LucideIcon;
type NavItem = { label: string; href: string; Icon: Icon };

const primaryLinks: NavItem[] = [
  { label: 'Home', href: '/home', Icon: Home },
  { label: 'Reels', href: '/reels', Icon: Clapperboard },
  { label: 'Messages', href: '/messages', Icon: MessageCircle },
  { label: 'Search', href: '/explore', Icon: Search },
  { label: 'Notifications', href: '/notifications', Icon: Bell },
  { label: 'Create', href: '/home?compose=1', Icon: Plus },
  { label: 'Community', href: '/communities', Icon: UsersRound },
  { label: 'Profile', href: '/profile/mitesh.patel', Icon: CircleUserRound },
];

const mobileLinks = primaryLinks.filter(({ label }) =>
  ['Home', 'Reels', 'Search', 'Create', 'Community', 'Messages'].includes(label),
);

function isActive(path: string, item: NavItem) {
  if (item.label === 'Create') return false;
  if (item.label === 'Search') return path === '/explore' || path.startsWith('/explore/');
  if (item.label === 'Profile') return path.startsWith('/profile');
  if (item.label === 'Community') return path.startsWith('/communities');
  if (item.label === 'Messages') return path.startsWith('/messages');
  return path === item.href || path.startsWith(`${item.href}/`);
}

function NavigationLink({ item, pathname, mobile = false }: {
  item: NavItem;
  pathname: string;
  mobile?: boolean;
}) {
  const active = isActive(pathname, item);
  const { Icon } = item;
  return (
    <Link
      href={item.href}
      className={`nav-link${active ? ' active' : ''}${mobile ? ' mobile-nav-link' : ''}`}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      title={item.label}
    >
      <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

function MoreMenu() {
  return (
    <details className="nav-more">
      <summary className="nav-link" aria-label="More navigation options" title="More">
        <MoreHorizontal size={22} strokeWidth={1.8} aria-hidden="true" />
        <span>More</span>
      </summary>
      <div className="nav-more-menu" aria-label="More navigation">
        <Link href="/settings"><Settings size={18} aria-hidden="true" />Settings</Link>
        <Link href="/bookmarks"><Bookmark size={18} aria-hidden="true" />Saved posts</Link>
        <Link href="/connections"><UsersRound size={18} aria-hidden="true" />Discover students</Link>
        <Link href="/community-guidelines"><CircleHelp size={18} aria-hidden="true" />Community guidelines</Link>
      </div>
    </details>
  );
}

function Brand() {
  return (
    <Link className="brand" href="/home" aria-label="BVMConnection home">
      <span className="brand-mark" aria-hidden="true"><Network size={21} strokeWidth={2.2} /></span>
      <span className="brand-wordmark">BVM<span className="brand-light">Connection</span></span>
    </Link>
  );
}

export default function SocialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <DemoProvider>
      <div className="social-shell">
        <aside className="left-rail" aria-label="Primary navigation">
          <Brand />
          <nav className="main-nav" aria-label="Main">
            {primaryLinks.map((item) => (
              <NavigationLink key={item.label} item={item} pathname={pathname} />
            ))}
            <MoreMenu />
          </nav>
          <div className="left-bottom">
            <span className="preview-avatar" aria-hidden="true">B</span>
            <span className="preview-account"><b>Preview account</b><small>Local demo · not synced</small></span>
            <Menu size={17} aria-hidden="true" />
          </div>
        </aside>

        <section className="main-column" aria-label="BVMConnection content">
          <header className="mobile-top">
            <Brand />
            <div className="mobile-tools">
              <Link className="mobile-header-action" href="/notifications" aria-label="Notifications">
                <Bell size={21} aria-hidden="true" />
              </Link>
              <Link className="mobile-profile-action" href="/profile/mitesh.patel" aria-label="Your profile">
                <CircleUserRound size={21} aria-hidden="true" />
              </Link>
              <details className="mobile-more">
                <summary aria-label="More options"><Menu size={21} aria-hidden="true" /></summary>
                <div>
                  <Link href="/settings"><Settings size={17} />Settings</Link>
                  <Link href="/bookmarks"><Bookmark size={17} />Saved posts</Link>
                  <Link href="/connections"><UsersRound size={17} />Discover students</Link>
                  <Link href="/community-guidelines"><CircleHelp size={17} />Guidelines</Link>
                </div>
              </details>
            </div>
          </header>
          {children}
          <nav className="mobile-bottom" aria-label="Mobile navigation">
            {mobileLinks.map((item) => (
              <NavigationLink key={item.label} item={item} pathname={pathname} mobile />
            ))}
          </nav>
        </section>

        <aside className="right-rail" aria-label="Campus information">
          <form className="searchbox" action="/explore" role="search">
            <Search size={18} aria-hidden="true" />
            <input name="q" aria-label="Search BVMConnection" placeholder="Search BVMConnection" />
            <kbd aria-hidden="true">/</kbd>
          </form>
          <section className="rail-card campus-card">
            <span className="campus-card-mark" aria-hidden="true"><Network size={20} /></span>
            <span className="kicker">MADE FOR BVM</span>
            <h2>Your campus community</h2>
            <p>Share ideas, find collaborators and connect with students across Vallabh Vidyanagar.</p>
            <Link className="see-all" href="/communities">Explore Community <span aria-hidden="true">→</span></Link>
          </section>
          <section className="preview-note" aria-label="Preview status">
            <span className="preview-status-dot" aria-hidden="true" />
            <div><b>Preview mode</b><p>Sample interactions stay in this browser and aren’t synced to a student account.</p></div>
          </section>
          <footer className="rail-footer">
            <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/community-guidelines">Guidelines</Link>
            <span>© 2026 BVMConnection</span>
          </footer>
        </aside>
      </div>
    </DemoProvider>
  );
}
