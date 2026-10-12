// Finds names of technologies and concepts inside prose, so Md.astro can underline them and show a
// short explanation on hover. Each term is marked once per page (its first mention), never on its own page.
import type { Catalog } from '@/lib/catalog';
import { href } from '@/lib/nav';

export interface Term {
  key: string;
  name: string;
  kind: 'Technology' | 'Concept';
  summary: string;
  href: string;
}

/** Names that are also ordinary words, or too short to be sure of, are never marked. */
const AMBIGUOUS = new Set([
  'Arc', 'Boundary', 'C', 'Chroma', 'Cloud Storage', 'Construct', 'Cube', 'Evidence', 'Fission', 'Garage', 'Go', 'Hex', 'Ibis',
  'kind', 'Lance', 'nom', 'Pathway', 'Pivot', 'Prefect', 'REST', 'Silo', 'Spiral', 'Temporal', 'uv', 'Void', 'Vortex', 'Warp',
  'Waypoint', 'Arrow', 'Delta', 'Comet', 'Local', 'IAM', 'Tables', 'Workers', 'Run', 'Storage', 'Functions',
]);
// "Apache Hudi" is usually written "Hudi"; "Amazon S3" is "S3".
const VENDOR = /^(Apache|Amazon|AWS|Azure|Google|Microsoft|Cloudflare|HashiCorp|Eclipse|Oracle|Red Hat|Alibaba Cloud|VMware|HCP) /;

const singular = (s: string) =>
  s.replace(/(\w+)$/, w => (/ies$/.test(w) ? w.slice(0, -3) + 'y' : /(ss|us|sis)$/.test(w) ? w : /(ses|xes|ches|shes)$/.test(w) ? w.slice(0, -2) : w.replace(/s$/, '')));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * One regex for many words, shaped as a trie ("kafka(?: streams)?") so matching stays fast with
 * a thousand names. Optional tails are greedy, so the longest name wins: "Kafka Streams" over "Kafka".
 */
function trie(words: string[]): string {
  type Node = { end?: boolean; next: Map<string, Node> };
  const root: Node = { next: new Map() };
  for (const w of new Set(words.map(w => w.toLowerCase()))) {
    let n = root;
    for (const ch of w) n = n.next.get(ch) ?? (n.next.set(ch, { next: new Map() }), n.next.get(ch)!);
    n.end = true;
  }
  const build = (n: Node): string => {
    const alts = [...n.next].map(([ch, k]) => escape(ch) + build(k));
    if (!alts.length) return '';
    const body = alts.length > 1 ? `(?:${alts.join('|')})` : alts[0];
    return n.end ? `(?:${body})?` : body;
  };
  return build(root);
}

interface Dict {
  /** Exact spellings of technology names, matched case-sensitively. */
  exact: Map<string, Term>;
  /** Lowercased concept names, singular and plural, matched in any case. */
  loose: Map<string, Term>;
  pattern: RegExp;
}

let cached: { catalog: Catalog; dict: Dict } | undefined;

function dictionary(c: Catalog): Dict {
  if (cached?.catalog === c) return cached.dict;
  const exact = new Map<string, Term>();
  const loose = new Map<string, Term>();
  const plain = (s: string) => s.replace(/`/g, '');

  for (const p of c.concepts) {
    const term: Term = { key: `concept:${p.id}`, name: p.name, kind: 'Concept', summary: plain(p.summary), href: href(`concepts/${p.id}/`) };
    if (p.name.includes(':')) continue;
    const base = p.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const acronym = p.name.match(/\(([A-Z]{2,})\)/)?.[1];
    // single common words ("Logs", "Caching", "Sprints") would mark half of every page
    const forms = base.includes(' ') || base.includes('/') || base.includes('-') || /^[A-Z]{2,}s?$/.test(base) || /^(Lakehouses|Microservices|Monoliths|Hypervisors|MicroVMs|Monads)$/.test(base)
      ? [base, singular(base)]
      : [];
    for (const f of [...forms.map(f => f.toLowerCase()), ...(acronym ? [acronym.toLowerCase()] : [])]) if (!loose.has(f)) loose.set(f, term);
  }

  for (const t of c.technologies) {
    const term: Term = { key: `tech:${t.id}`, name: t.name, kind: 'Technology', summary: plain(t.summary), href: href(`technologies/${t.id}/`) };
    const base = t.name.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const inner = t.name.match(/\(([^)]+)\)/)?.[1];
    const forms = [t.name, base, base.replace(VENDOR, ''), ...(inner && /^[A-Z][A-Za-z0-9]{1,}$/.test(inner) && inner !== inner.toLowerCase() ? [inner] : [])];
    for (const f of forms) {
      if (f.length < 2 || AMBIGUOUS.has(f) || loose.has(f.toLowerCase()) || exact.has(f)) continue;
      exact.set(f, term);
    }
  }

  const pattern = new RegExp(`(?<![\\w-])(${trie([...exact.keys(), ...loose.keys()])})(?![\\w-]|\\+)`, 'gi');
  const dict = { exact, loose, pattern };
  cached = { catalog: c, dict };
  return dict;
}

export type Piece = string | { term: Term; text: string };

/**
 * Splits text into plain strings and marked terms. `seen` holds the terms already marked on this
 * page and is updated; `self` is the current page's path, whose own name is never marked.
 */
export function findTerms(c: Catalog, text: string, seen: Set<string>, self: string): Piece[] {
  const { exact, loose, pattern } = dictionary(c);
  const out: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const word = m[0];
    const term = exact.get(word) ?? loose.get(word.toLowerCase());
    // a concept phrase in any case, a technology only exactly as it's spelled
    if (!term || (term.kind === 'Technology' && !exact.has(word)) || seen.has(term.key) || term.href === self) continue;
    seen.add(term.key);
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push({ term, text: word });
    last = m.index + word.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
