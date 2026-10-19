// The frame around every page: the sidebar (a drawer on narrow screens), the mobile header, the page
// outline and the term card. Each page renders its content inside one.
import { MenuIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, SearchIcon } from 'lucide-react';
import IconSprite from '@/components/IconSprite';
import NavTree, { type SideNode } from '@/components/NavTree';
import Outline from '@/components/Outline';
import Search from '@/components/Search';
import ShellScript from '@/components/ShellScript';
import SiteLogo from '@/components/SiteLogo';
import TermCard from '@/components/TermCard';
import ThemeToggle from '@/components/ThemeToggle';
import { getCatalog, type Catalog } from '@/lib/catalog';
import { logoOf } from '@/lib/glyphs';
import { href, REPO_URL } from '@/lib/nav';
import { navTree, type NavNode, type Where } from '@/lib/navtree';
import { pageState } from '@/lib/page';
import { cn } from '@/lib/utils';

export type Section = 'home' | 'concepts' | 'topics' | 'kinds' | 'technologies' | 'architectures' | 'compare' | 'resources' | 'benchmarks' | 'playground' | 'landscape' | 'timeline' | 'not-found';

interface Props {
  /** The page's own path, e.g. "technologies/kafka/", so Md doesn't link a page to itself. */
  path: string;
  section: Section;
  /** Highlights this id in the sidebar: a concept, kind, technology, architecture or (on topic pages) category. */
  active?: string;
  /** Sections for the page outline at the right edge of wide screens. */
  outline?: { id: string; label: string }[];
  children: React.ReactNode;
}

/** The sidebar tree as the small shape NavTree takes: pictures resolved as in Glyph.tsx, empty fields left out. */
const side = (c: Catalog, nodes: NavNode[]): SideNode[] => nodes.map(n => {
  const logo = n.tech && logoOf(n.tech.id);
  return {
    key: n.key,
    label: n.label,
    href: n.href,
    ...(logo ? { logo } : { icon: n.icon ?? (n.tech && c.concept(n.tech.concepts[0]).icon) }),
    ...(n.current && { current: true }),
    ...(n.open && { open: true }),
    ...(n.tag && { tag: n.tag }),
    ...(n.muted && { muted: true }),
    children: side(c, n.children),
  };
});

// Keeps only the first mention of each term on the page (Md.tsx marks one per text). Server components
// render out of document order, so this runs in the browser, as soon as the page's content is parsed and
// before React hydrates it; hydration leaves attributes alone, so the two agree.
const firstTerms = `{ const seen = new Set();
  for (const a of document.querySelectorAll('#main a.term')) {
    if (seen.has(a.dataset.termKey)) a.removeAttribute('href'); else { seen.add(a.dataset.termKey); a.dataset.first = ''; }
  } }`;

/** Pages that use the whole width of the window instead of a centered column. */
const FULL = new Set<Section>(['playground', 'landscape']);

export default function Shell({ path, section, active, outline, children }: Props) {
  pageState().path = href(path);
  const catalog = getCatalog();
  const base = href();
  const repo = REPO_URL;
  // the page being shown, so its item in the sidebar is highlighted and its branch starts open
  const page = active
    ? ({ topics: 'topic', concepts: 'concept', kinds: 'kind', technologies: 'tech', compare: 'compare', architectures: 'architecture', benchmarks: 'benchmark' } as const)[section as string] as Where['page']
    : undefined;
  const tree = navTree(catalog, { section, page, active });
  const iconButton = 'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

  return (
    <>
      <IconSprite />
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 lg:hidden">
        <button type="button" data-drawer-open className={iconButton} aria-label="Open navigation" aria-expanded="false"><MenuIcon className="size-4" /></button>
        <a href={base} className="flex items-center gap-2" aria-label="cloudparts, home">
          <SiteLogo />
          <span className="font-semibold tracking-tight">cloudparts</span>
        </a>
        <span className="ml-auto flex items-center gap-1">
          <button type="button" data-open-search="" className={iconButton} aria-label="Search"><SearchIcon className="size-4" /></button>
          <ThemeToggle />
        </span>
      </header>

      <button type="button" data-sidebar-open className={cn(iconButton, 'fixed top-3 left-3 z-40 hidden border bg-background shadow-sm lg:inline-flex')} aria-label="Show sidebar" title="Show sidebar">
        <PanelLeftOpenIcon className="size-4" />
      </button>

      <div className="flex">
        <div data-drawer-backdrop className="fixed inset-0 z-40 hidden bg-black/40 lg:hidden" aria-hidden="true"></div>
        <aside data-sidebar-panel className="fixed inset-y-0 left-0 z-50 hidden h-dvh w-[min(300px,85vw)] shrink-0 flex-col border-r bg-sidebar shadow-xl lg:z-30 lg:flex lg:w-[280px] lg:shadow-none" aria-label="Site navigation">
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <a href={base} className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted" aria-label="cloudparts, home">
              <SiteLogo />
              <span className="truncate font-semibold tracking-tight">cloudparts</span>
            </a>
            <button type="button" data-sidebar-close className={cn(iconButton, 'ml-auto')} aria-label="Hide sidebar" title="Hide sidebar">
              <PanelLeftCloseIcon className="size-4" />
            </button>
          </div>
          <div className="px-3 pb-2"><Search base={base} /></div>
          <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pt-1 pb-6" aria-label="Site" data-sidebar-scroll>
            <NavTree nodes={side(catalog, tree)} />
          </nav>
          <div className="flex items-center gap-1 border-t px-3 py-2">
            <ThemeToggle up />
            {repo && <a href={repo} className={iconButton} aria-label="Source on GitHub" title="Source on GitHub"><svg viewBox="0 0 16 16" className="size-4" fill="currentColor" aria-hidden="true"><path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" /></svg></a>}
            {repo && <a href={`${repo}/blob/main/CONTRIBUTING.md`} className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Add a technology →</a>}
          </div>
        </aside>

        <div data-main className="flex min-w-0 flex-1 flex-col">
          {FULL.has(section) ? (
            <main id="main" className="min-w-0 flex-1 px-4 pt-6 pb-12 sm:px-6">{children}</main>
          ) : (
            <main id="main" className="min-w-0 flex-1 px-4 pt-8 pb-20 sm:px-8 lg:px-12 lg:pt-12">
              <div className="mx-auto max-w-5xl">{children}</div>
            </main>
          )}
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: firstTerms }} />
      {outline && <Outline items={outline} />}
      <TermCard />
      <ShellScript />
    </>
  );
}
