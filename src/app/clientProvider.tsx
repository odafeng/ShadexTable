// app/ClientProviders.tsx
'use client';

import { Toaster } from 'sonner';
// 不再需要 import AnalysisProvider

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-center" richColors />
      {children}
    </>
  );
}