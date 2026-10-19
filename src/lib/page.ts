// State for the page being rendered: its path, so Md never links a page to itself.
// React's cache() gives each page render its own copy.
import { cache } from 'react';

export const pageState = cache(() => ({ path: '/' }));
