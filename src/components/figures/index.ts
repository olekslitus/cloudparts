import type { ComponentType } from 'react';
import BrinModel from '@/components/figures/BrinModel';
import type { Figure } from '@/content/schema';

/** The interactive figure for each id a kind can name in its "figure" field. */
export const FIGURES: Record<Figure, ComponentType> = {
  brin: BrinModel,
};
