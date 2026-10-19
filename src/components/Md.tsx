// Renders a content string, turning `backticks` into inline code and marking the first mention of each
// technology or concept on the page with a dotted underline; hovering one shows a short explanation
// (see TermCard.tsx). Nothing else is parsed. Each Md marks its own first mentions; the page keeps only
// the first on the whole page (see `firstTerms` in Shell.tsx).
import { getCatalog } from '@/lib/catalog';
import { pageState } from '@/lib/page';
import { findTerms, type Piece } from '@/lib/terms';

interface Props {
  text: string;
  /** Leave names unmarked, e.g. in a license. */
  plain?: boolean;
}

export default function Md({ text, plain }: Props) {
  const page = pageState();
  const catalog = plain ? undefined : getCatalog();
  const pieces = text.split(/`([^`]+)`/).map((s, i): Piece[] | { code: string } =>
    i % 2 ? { code: s } : catalog ? findTerms(catalog, s, new Set(), page.path) : [s]);
  return (
    <span className="md">
      {pieces.map((p, i) => ('code' in p ? <code key={i}>{p.code}</code> : p.map((x, j) => (typeof x === 'string' ? x : (
        <a key={`${i}-${j}`} href={x.term.href} className="term" data-term-key={x.term.key} data-term-name={x.term.name} data-term-kind={x.term.kind} data-term-tip={x.term.summary}>{x.text}</a>
      )))))}
    </span>
  );
}
