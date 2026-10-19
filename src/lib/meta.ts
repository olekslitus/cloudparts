// Page titles and descriptions, as every page's `metadata` export.
import type { Metadata } from 'next';

const SITE = 'cloudparts: Handbook for Modern Software Engineering';
const DESCRIPTION = 'cloudparts, a handbook for modern software engineering: how code, systems, delivery and teams work, with live models, plain-language explanations and sources for every fact.';

/** "Kafka · cloudparts", with the page's description, or the site's own title and description. */
export function meta(title?: string, description?: string): Metadata {
  const full = title ? `${title} · cloudparts` : SITE;
  const desc = description ?? DESCRIPTION;
  return { title: full, description: desc, openGraph: { title: full, description: desc } };
}
