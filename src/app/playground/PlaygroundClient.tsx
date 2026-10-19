'use client';

// The playground only runs in the browser: it reads the URL and local storage as it starts.
import dynamic from 'next/dynamic';

const PlaygroundClient = dynamic(() => import('@/components/Playground'), { ssr: false });

export default PlaygroundClient;
