// app/debug/dialog-test/page.tsx
"use client";

import { useState } from "react";
import AnalysisErrorDialog from "@/components/AnalysisErrorDialog";
import { Button } from "@/components/ui/button";

export default function DialogTestPage() {
  const [open, setOpen] = useState(false);
  const errorMsg = "類別變項 ‘BMI’ 為數值型且 unique 值數量為 62，疑似連續變項";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Button onClick={() => setOpen(true)}>觸發錯誤 Dialog</Button>
      <AnalysisErrorDialog open={open} onClose={() => setOpen(false)} message={errorMsg} />
    </div>
  );
}
