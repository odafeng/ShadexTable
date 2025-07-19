// app/ClientProviders.tsx
'use client';

import { Toaster } from 'sonner';
import { AnalysisProvider } from '@/context/AnalysisContext';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster position="top-center" richColors />
      <AnalysisProvider>{children}</AnalysisProvider>
    </>
  );
}
