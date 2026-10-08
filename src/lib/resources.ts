import { BookOpenIcon, CirclePlayIcon, FileTextIcon, GlobeIcon, GraduationCapIcon, HeadphonesIcon, PresentationIcon, ScrollTextIcon } from 'lucide-react';
import type { Resource } from '@/content/schema';

/** Label and icon for each kind of resource, in the order filters show them. */
export const RESOURCE_KIND: Record<Resource['kind'], { label: string; plural: string; Icon: typeof FileTextIcon }> = {
  article: { label: 'Article', plural: 'Articles', Icon: FileTextIcon },
  video: { label: 'Video', plural: 'Videos', Icon: CirclePlayIcon },
  slides: { label: 'Slides', plural: 'Slides', Icon: PresentationIcon },
  paper: { label: 'Paper', plural: 'Papers', Icon: ScrollTextIcon },
  book: { label: 'Book', plural: 'Books', Icon: BookOpenIcon },
  podcast: { label: 'Podcast', plural: 'Podcasts', Icon: HeadphonesIcon },
  course: { label: 'Course', plural: 'Courses', Icon: GraduationCapIcon },
  website: { label: 'Website', plural: 'Websites', Icon: GlobeIcon },
};
