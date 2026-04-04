'use client';

import dynamic from 'next/dynamic';

const StoresMap = dynamic(() => import('./StoresMap'), { ssr: false });

export default function MapPage() {
  return <StoresMap />;
}
