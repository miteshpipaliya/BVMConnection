'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Camera, ChevronLeft, ChevronRight, Clapperboard, Grid3X3, Heart, ImagePlus, LockKeyhole, MessageCircle, MoreHorizontal, Music2, Pause, Play, Plus, Search, Send, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { useDemo, type DemoPost } from '@/lib/demo-store';
import { selectFeed } from '@/lib/demo-logic';

const exampleImages: Record<string, string> = {
  p2: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1100&q=80',
  p3: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1100&q=80',
  p4: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1100&q=80'
};
function mediaFor(post: DemoPost) { return post.image || exampleImages[post.id] || ''; }
function initials(name: string) { return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase(); }
const storyExamples = [
  { name:'Your story', short:'MP', text:'Share a moment with your campus ✨' },
  { name:'Aarav', short:'AP', text:'Building something exciting at BVM 🚌' },
  { name:'Diya', short:'DS', text:'Library hours and good vibes 📚' },
  { name:'Rohan', short:'RM', text:'Robotics lab in full swing ⚡' },
  { name:'Nisha', short:'NK', text:'Golden hour on campus 🌅' }
];
function StoryModal({ start, close }: { start: number; close: () => void }) {
  const [index, setIndex] = useState(start);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const id = window.setTimeout(() => setIndex(current => current === storyExamples.length - 1 ? current : current + 1), 5500);
    return () => window.clearTimeout(id);
  }, [index, paused]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(storyExamples.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);
  return <div className="cc-modal-backdrop" onClick={close} role="presentation">
    <section className="cc-story-viewer" role="dialog" aria-label="Demo stories" aria-modal="true" onClick={e => e.stopPropagation()}>
      <div className="cc-story-progress">{storyExamples.map((s, i) => <span key={s.name} className={i <= index ? 'done' : ''}/>)}</div>
      <header><b>{storyExamples[index].name} · Sample story</b><button onClick={() => setPaused(!paused)} aria-label={paused ? 'Resume' : 'Pause'}>{paused ? <Play size={16}/> : <Pause size={16}/>}</button><button onClick={close} aria-label="Close stories"><X size={17}/></button></header>
      <div className="cc-story-message">{storyExamples[index].text}</div>
      <div className="cc-story-controls"><button aria-label="Previous story" onClick={() => setIndex(Math.max(0, index - 1))}><ChevronLeft/></button><button aria-label="Next story" onClick={() => index === storyExamples.length - 1 ? close() : setIndex(index + 1)}><ChevronRight/></button></div>
    </section>
  </div>;
}
function CreatePostDialog({ close }: { close: () => void }) {
  const { addPost } = useDemo();
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  function publish() {
    if (!caption.trim() || !file || busy) return;
    if (file.size > 1.5 * 1024 * 1024) { setError('This local demo supports photos under 1.5 MB.'); return; }
    setBusy(true);
    const reader = new FileReader();
    reader.onerror = () => { setBusy(false); setError('Could not read photo. Choose another file.'); };
    reader.onload = () => {
      if (typeof reader.result !== 'string') { setError('Photo preview failed.'); setBusy(false); return; }
      try { addPost(caption.trim(), reader.result); close(); }
      catch { setError('Could not save this preview post.'); setBusy(false); }
    };
    reader.readAsDataURL(file);
  }
  return <div className="cc-modal-backdrop" onClick={close} role="presentation">
    <section className="cc-dialog" role="dialog" aria-modal="true" aria-label="Create a post" onClick={e => e.stopPropagation()}>
      <header><h2>Create a post</h2><button onClick={close} aria-label="Close post composer"><X size={20}/></button></header>
      <label>Campus photo <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { setFile(e.target.files?.[0] || null); setError(''); }} /></label>
      {preview ? <Image className="cc-dialog-preview" src={preview} unoptimized width={400} height={220} alt="Selected photo preview"/> : <p className="cc-dialog-note"><ImagePlus size={19}/> Select a photo to share.</p>}
      <label>Caption (required)<textarea maxLength={500} value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write a caption…"/></label>
      <label>Audio <select disabled aria-label="Music library is not yet available"><option>Music library — awaiting licensed catalog</option></select></label>
      {error && <p role="alert" style={{color:'#ff9aa8'}}>{error}</p>}
      <p className="cc-dialog-note">Local preview only. Photos and captions are stored in this browser, not uploaded to Supabase or Cloudflare R2.</p>
      <button className="cc-primary" disabled={!file || !caption.trim() || busy} onClick={publish}>{busy ? 'Preparing…' : 'Share demo post'}</button>
    </section>
  </div>;
}
function FeedPost({ post }: { post: DemoPost }) {
  const { togglePost, comment, removePost } = useDemo();
  const [showComments, setShowComments] = useState(false);
  const [input, setInput] = useState('');
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const media = mediaFor(post);
  const handle = () => navigator.clipboard?.writeText(window.location.origin + '/posts/' + post.id).then(() => setNotice('Link copied. This is a demo post.'));
  return <article className="cc-post">
    <header className="cc-post-head">
      <span className="cc-post-avatar"><span>{initials(post.name)}</span></span>
      <div className="cc-post-identity"><Link href={'/profile/' + post.handle}>{post.handle}</Link><small>{post.dept} · {post.time}</small></div>
      <button aria-label="Post options" onClick={() => setMenu(!menu)}><MoreHorizontal size={20}/></button>
    </header>
    {menu && <div className="cc-post-comments"><button className="cc-post-subtle" onClick={() => { togglePost(post.id, 'saved'); setMenu(false); }}>{post.saved ? 'Remove from saved' : 'Save post'}</button>{' · '}<button className="cc-post-subtle" onClick={() => { handle(); setMenu(false); }}>Copy link</button>{post.own && <><span> · </span><button className="cc-post-subtle" onClick={() => removePost(post.id)}>Delete</button></>}{' · '}<button className="cc-post-subtle" onClick={() => { setNotice('Reporting is unavailable in this local demo.'); setMenu(false); }}>Report</button></div>}
    <div className="cc-post-media">{media ? <Image src={media} alt={'Sample photo for ' + post.name + ' post'} width={950} height={1050} unoptimized/> : <div className="cc-photo-placeholder">{post.tag}<small>CAMPUSCONNECT · BVM</small></div>}</div>
    <div className="cc-post-actions">
      <button aria-label={post.liked ? 'Unlike' : 'Like'} className={post.liked ? 'liked' : ''} onClick={() => togglePost(post.id, 'liked')}><Heart size={25} fill={post.liked ? 'currentColor' : 'none'}/></button>
      <button aria-label="Show comments" onClick={() => setShowComments(!showComments)}><MessageCircle size={25}/></button>
      <button aria-label="Copy post link" onClick={handle}><Send size={24}/></button>
      <button aria-label={post.saved ? 'Remove saved post' : 'Save post'} onClick={() => togglePost(post.id, 'saved')}><Bookmark size={24} fill={post.saved ? 'currentColor' : 'none'}/></button>
    </div>
    <span className="cc-post-count">{post.likes.toLocaleString()} likes</span>
    <p className="cc-post-caption"><b>{post.handle}</b>{post.body}</p>
    <button className="cc-post-subtle" onClick={() => setShowComments(!showComments)}>{showComments ? 'Hide comments' : 'View all ' + post.replies + ' comments'}</button>
    {showComments && <div className="cc-post-comments">{post.comments.map((text, i) => <p key={i}><b>{i % 2 === 0 ? 'mirabuilds' : 'devpatel'}</b>{text}</p>)}</div>}
    <form className="cc-comment-form" onSubmit={e => { e.preventDefault(); if (input.trim()) { comment(post.id, input.trim()); setInput(''); setShowComments(true); } }}>
      <input aria-label="Add a comment" value={input} onChange={e => setInput(e.target.value)} placeholder="Add a comment…"/>
      <button disabled={!input.trim()}>Post</button>
    </form>
    {notice && <p className="cc-dialog-note" role="status">{notice}</p>}
  </article>;
}
export function CampusFeed() {
  const { posts } = useDemo();
  const [filter, setFilter] = useState('For you');
  const [story, setStory] = useState<number | null>(null);
  const [composing, setComposing] = useState(false);
  const filtered = useMemo(() => selectFeed(posts, filter), [posts, filter]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('compose')) { setComposing(true); window.history.replaceState({}, '', '/home'); }
  }, []);
  return <section className="cc-feed">
    <div className="cc-story-list" aria-label="Sample stories">
      {storyExamples.map((s, index) => <button className="cc-story-button" key={s.name} onClick={() => setStory(index)}>
        <span className="cc-story-ring"><span>{index === 0 ? <Plus size={24}/> : s.short}</span></span><small>{s.name}</small>
      </button>)}
    </div>
    <div className="cc-feed-header"><div><strong>Campus feed</strong><small> · Preview</small></div><button className="cc-create-button" onClick={() => setComposing(true)}><Plus size={16}/> Create</button></div>
    <div className="cc-feed-filter">{['For you','Following','Latest','Campus'].map(tab => <button key={tab} className={filter === tab ? 'selected' : ''} onClick={() => setFilter(tab)}>{tab}</button>)}</div>
    {filtered.length ? filtered.map(post => <FeedPost key={post.id} post={post}/>) : <div className="cc-profile-empty"><h2>No posts here yet</h2><p>Try another feed filter or create your first campus moment.</p></div>}
    {story !== null && <StoryModal start={story} close={() => setStory(null)}/>}
    {composing && <CreatePostDialog close={() => setComposing(false)}/>}
  </section>;
}
type ProfileSettings = { bio: string; branch: string; division: string; relationship: string; privacy: 'Campus' | 'Private' };
const initialProfile: ProfileSettings = { bio: 'Building things, meeting good people, making campus memories ✨', branch: 'Computer Engineering', division: 'A', relationship: 'Single', privacy: 'Campus' };
export function CampusProfile({ username }: { username: string }) {
  const { posts } = useDemo();
  const own = username === 'mitesh.patel';
  const target = posts.find(post => post.handle === username);
  const title = own ? 'Mitesh Patel' : (target?.name || username.replaceAll('.', ' '));
  const list = own ? posts.filter(post => post.own) : posts.filter(post => post.handle === username);
  const [profile, setProfile] = useState<ProfileSettings>(initialProfile);
  const [form, setForm] = useState<ProfileSettings>(initialProfile);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('Posts');
  const [follow, setFollow] = useState(false);
  const [statInfo, setStatInfo] = useState(false);
  useEffect(() => {
    if (!own) return;
    try {
      const saved = localStorage.getItem('campusconnect-demo-profile');
      if (saved) { const next = { ...initialProfile, ...JSON.parse(saved) } as ProfileSettings; setProfile(next); setForm(next); }
    } catch { /* Invalid previous local preview; keep defaults. */ }
  }, [own]);
  function save() {
    setProfile(form);
    try { localStorage.setItem('campusconnect-demo-profile', JSON.stringify(form)); } catch { /* Storage may be unavailable. */ }
    setEdit(false);
  }
  return <section className="cc-profile">
    <div className="cc-profile-top">
      <div className="cc-profile-avatar"><span>{initials(title)}</span></div>
      <div className="cc-profile-info">
        <h1>{username}</h1>
        <div className="cc-profile-controls">
          {own ? <><button onClick={() => { setForm(profile); setEdit(true); }}>Edit profile</button><Link href="/settings">Settings</Link></> : <><button onClick={() => setFollow(!follow)}>{follow ? 'Following' : 'Follow'}</button><Link href="/messages">Message</Link></>}
        </div>
        <div className="cc-profile-stats"><span><b>{list.length}</b> posts</span><button onClick={() => setStatInfo(!statInfo)}><b>{own ? '128' : '64'}</b> followers</button><button onClick={() => setStatInfo(!statInfo)}><b>{own ? '96' : '48'}</b> following</button></div>
        <div className="cc-profile-bio"><strong>{title}</strong>{own ? profile.bio : 'Campus moments, friends and projects.'}<div className="cc-profile-meta">{own ? profile.branch + ' · Division ' + profile.division + ' · ' + profile.relationship : 'BVM student'}</div></div>
        {own && <p className="cc-profile-private"><LockKeyhole size={13}/> {profile.privacy} account · demo preference only</p>}
      </div>
    </div>
    {statInfo && <p className="cc-dialog-note">Follower counts are sample data. Live followers and following require Supabase integration.</p>}
    <div className="cc-profile-tabs">{[['Posts', Grid3X3],['Reels', Clapperboard],['Tagged', Camera]].map(([label, Icon]) => {
      const Comp = Icon as typeof Grid3X3;
      return <button key={label as string} className={tab === label ? 'selected' : ''} onClick={() => setTab(label as string)}><Comp size={14}/>{label as string}</button>;
    })}</div>
    {tab === 'Posts' && (list.length ? <div className="cc-profile-grid">{list.map(post => <Link key={post.id} href={'/posts/' + post.id}>{mediaFor(post) ? <Image src={mediaFor(post)} width={350} height={350} alt="Campus post" unoptimized/> : <span>{post.tag}</span>}</Link>)}</div> : <div className="cc-profile-empty"><Camera size={44}/><h2>Share your first photo</h2><p>Your campus posts will appear here.</p>{own && <Link href="/home?compose=1">Create a post</Link>}</div>)}
    {tab === 'Reels' && <div className="cc-profile-empty"><Clapperboard size={42}/><h2>Reels</h2><p>Campus reels will appear here when publishing is connected.</p><Link href="/reels">Explore sample reels</Link></div>}
    {tab === 'Tagged' && <div className="cc-profile-empty"><h2>Tagged posts</h2><p>Nothing to show in this local demo yet.</p></div>}
    {edit && <div className="cc-modal-backdrop" onClick={() => setEdit(false)} role="presentation"><section className="cc-dialog" role="dialog" aria-label="Edit demo profile" aria-modal="true" onClick={e => e.stopPropagation()}>
      <header><h2>Edit profile</h2><button onClick={() => setEdit(false)} aria-label="Close editor"><X/></button></header>
      <label>Bio<textarea value={form.bio} maxLength={150} onChange={e => setForm({ ...form, bio: e.target.value })}/></label>
      <label>Branch<input value={form.branch} maxLength={70} onChange={e => setForm({ ...form, branch: e.target.value })}/></label>
      <label>Division<input value={form.division} maxLength={20} onChange={e => setForm({ ...form, division: e.target.value })}/></label>
      <label>Relationship status<select value={form.relationship} onChange={e => setForm({ ...form, relationship: e.target.value })}>{['Single','In Relationship','Situationship','Married','Engaged'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Account privacy<select value={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.value as ProfileSettings['privacy'] })}><option>Campus</option><option>Private</option></select></label>
      <p className="cc-dialog-note">This profile editor is browser-local. Privacy is not enforced until the backend is connected.</p>
      <button className="cc-primary" onClick={save}>Save demo profile</button>
    </section></div>}
  </section>;
}
export function CampusSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const { posts, people, communities } = useDemo();
  const [query, setQuery] = useState(initialQuery);
  const q = query.trim().toLowerCase();
  const matchingPeople = people.filter(p => (p.name + ' ' + p.handle + ' ' + p.dept).toLowerCase().includes(q));
  const matchingPosts = posts.filter(p => (p.name + ' ' + p.body + ' ' + p.tag).toLowerCase().includes(q));
  const matchingCommunities = communities.filter(c => (c.name + ' ' + c.description).toLowerCase().includes(q));
  return <section className="cc-search-page">
    <h1 className="cc-search-header">Search</h1>
    <div className="cc-search-field"><Search size={20}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search campus, accounts, posts…" aria-label="Search campus content"/></div>
    {q && <><h2 className="cc-search-section-title">Accounts</h2><div className="cc-search-results">{matchingPeople.length ? matchingPeople.map(p => <Link href={'/profile/' + p.handle} className="cc-search-result" key={p.handle}><span className="cc-person-avatar">{initials(p.name)}</span><div><b>{p.handle}</b><small>{p.name} · {p.dept}</small></div></Link>) : <p className="cc-dialog-note">No matching demo accounts.</p>}</div>
      <h2 className="cc-search-section-title">Community</h2><div className="cc-search-results">{matchingCommunities.map(c => <Link className="cc-search-result" key={c.slug} href={'/communities/' + c.slug}><span className="cc-person-avatar">{c.icon}</span><div><b>{c.name}</b><small>{c.description}</small></div></Link>)}</div>
    </>}
    <h2 className="cc-search-section-title">{q ? 'Matching posts' : 'Explore campus posts'}</h2>
    <div className="cc-explore-grid">{matchingPosts.map(post => <Link key={post.id} href={'/posts/' + post.id}>{mediaFor(post) ? <Image src={mediaFor(post)} alt={'Sample post by ' + post.name} width={300} height={300} unoptimized/> : <span>{post.tag}<br/>{post.name}</span>}</Link>)}</div>
    {matchingPosts.length === 0 && <p className="cc-dialog-note">No demo posts match this search.</p>}
    {!q && <p className="cc-dialog-note">Sample content only. Real student search will require a protected Supabase query.</p>}
  </section>;
}
const reelExamples = [
  { id:'r1', by:'campus.creatives', title:'Small moments, big memories ✨', src:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', poster:'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=500&q=70' },
  { id:'r2', by:'build.with.bvm', title:'A little inspiration for builders ⚡', src:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', poster:'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=70' },
  { id:'r3', by:'campus.moments', title:'Today’s campus mood 🌅', src:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', poster:'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=500&q=70' },
  { id:'r4', by:'campus.clubs', title:'Make something worth sharing 💫', src:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', poster:'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=70' },
  { id:'r5', by:'cc.originals', title:'Five ideas, one creative campus 🎬', src:'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', poster:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=500&q=70' }
];
function ReelItem({ item }: { item: typeof reelExamples[number] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  function togglePlay() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) void video.play().then(() => setPlaying(true)).catch(() => setError(true));
    else { video.pause(); setPlaying(false); }
  }
  function toggleMute() { if (ref.current) ref.current.muted = !muted; setMuted(!muted); }
  return <article className="cc-reel">
    <video ref={ref} src={item.src} poster={item.poster} preload="metadata" playsInline loop muted aria-label={item.title} onEnded={() => setPlaying(false)} onError={() => setError(true)} />
    <div className="cc-reel-overlay"><b>@{item.by}</b><p>{item.title}</p><small><Music2 size={14}/> Original sample-video audio</small>{error && <p>Sample video unavailable. Try another reel.</p>}</div>
    <div className="cc-reel-actions">
      <button onClick={togglePlay} aria-label={playing ? 'Pause reel' : 'Play reel'}>{playing ? <Pause/> : <Play/>}<small>{playing ? 'Pause' : 'Play'}</small></button>
      <button onClick={toggleMute} aria-label={muted ? 'Unmute reel' : 'Mute reel'}>{muted ? <VolumeX/> : <Volume2/>}<small>Audio</small></button>
      <button onClick={() => setLiked(!liked)} aria-label={liked ? 'Unlike reel' : 'Like reel'}><Heart fill={liked ? '#ff486f' : 'none'} color={liked ? '#ff486f' : 'white'}/><small>{liked ? 'Liked' : 'Like'}</small></button>
      <button onClick={() => setSaved(!saved)} aria-label={saved ? 'Unsave reel' : 'Save reel'}><Bookmark fill={saved ? '#fff' : 'none'}/><small>Save</small></button>
      <button onClick={() => navigator.clipboard?.writeText(window.location.origin + '/reels')} aria-label="Copy reels link"><Share2/><small>Share</small></button>
    </div>
  </article>;
}
export function CampusReels() {
  return <section className="cc-reel-page"><h1 className="cc-reel-title">Reels</h1><p className="cc-reel-demo">Five demonstration clips. These are generic sample videos, not BVM student uploads. Audio comes from the video file; a licensed song library is not connected.</p><div className="cc-reel-container">{reelExamples.map(item => <ReelItem key={item.id} item={item}/>)}</div></section>;
}
