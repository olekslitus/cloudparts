import { cn } from '@/lib/utils';

export default function SectionLabel({ className, id, children }: { className?: string; id?: string; children: React.ReactNode }) {
  return <h2 id={id} className={cn('mb-3 scroll-mt-20 font-mono text-[11px] font-medium tracking-widest text-muted-foreground uppercase', className)}>{children}</h2>;
}
