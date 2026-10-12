// Icons for the sidebar: one per site section and one per handbook area. Shared by the
// server-rendered sidebar and the mobile menu, which gets the keys because components can't be serialized.
import {
  ArrowLeftRightIcon, BookmarkIcon, BoxIcon, DatabaseIcon, GaugeIcon, HammerIcon, HouseIcon, NetworkIcon,
  RocketIcon, ServerIcon, ShapesIcon, SquareMousePointerIcon, UsersIcon, type LucideIcon,
} from 'lucide-react';

export const SECTION_ICONS = {
  home: HouseIcon,
  concepts: ShapesIcon,
  technologies: BoxIcon,
  compare: ArrowLeftRightIcon,
  architectures: NetworkIcon,
  playground: SquareMousePointerIcon,
  resources: BookmarkIcon,
  benchmarks: GaugeIcon,
} satisfies Record<string, LucideIcon>;
export type SectionIcon = keyof typeof SECTION_ICONS;

/** By part id, from content/parts.json; unknown parts fall back to the concepts icon. */
const PARTS: Record<string, LucideIcon> = {
  build: HammerIcon,
  infra: ServerIcon,
  data: DatabaseIcon,
  ship: RocketIcon,
  teams: UsersIcon,
};
export const partIcon = (id: string): LucideIcon => PARTS[id] ?? ShapesIcon;
