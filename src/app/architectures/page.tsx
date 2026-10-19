import ArchCard from '@/components/ArchCard';
import Shell from '@/components/Shell';
import { getCatalog } from '@/lib/catalog';
import { meta } from '@/lib/meta';
import { href } from '@/lib/nav';

export const metadata = meta('Architectures', 'Real stacks built from real technologies, each with a live model you can open in the playground.');

export default function Architectures() {
  const c = getCatalog();
  return (
    <Shell path="architectures/" section="architectures">
      <header className="max-w-3xl">
        <div className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">{c.architectures.length} architectures</div>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">Architectures</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Technologies make the most sense next to the things they connect to. Each of these is a common, real-world stack:
          watch it run, follow the data step by step, and see where it strains.
        </p>
      </header>
      <div className="mt-10 grid max-w-[50rem] gap-2">
        {c.architectures.map(a => <ArchCard key={a.id} arch={a} catalog={c} />)}
        <a href={href('playground/')} className="flex flex-col justify-center rounded-xl border border-dashed p-4 text-muted-foreground transition hover:border-foreground/30 hover:text-foreground">
          <span className="font-semibold text-foreground">Design your own</span>
          <span className="mt-1 text-sm">Drag technologies onto a canvas, connect them, and run traffic through your design.</span>
        </a>
      </div>
    </Shell>
  );
}
