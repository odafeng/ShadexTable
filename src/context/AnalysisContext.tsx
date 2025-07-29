"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type AnalysisState = {
  file: File | null;
  parsedData: any[];
  groupVar: string;
  catVars: string[];
  contVars: string[];
  fillNA: boolean;
  resultTable: any[];
  groupCounts: Record<string, number>;
  setFile: (f: File | null) => void;
  setParsedData: (d: any[]) => void;
  setGroupVar: (v: string) => void;
  setCatVars: (v: string[]) => void;
  setContVars: (v: string[]) => void;
  setFillNA: (v: boolean) => void;
  setResultTable: (v: any[]) => void;
  setGroupCounts: (v: Record<string, number>) => void;
  columnTypes: { column: string; suggested_type: string }[];
  setColumnTypes: (types: { column: string; suggested_type: string }[]) => void;
  aiDiagnosis: any; 
  setAiDiagnosis: (aiDiagnosis: any) => void;
  ColumnProfile: any[]; 
  setColumnProfile: (profile: any[]) => void; 
};

export const AnalysisContext = createContext<AnalysisState | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [groupVar, setGroupVar] = useState("");
  const [catVars, setCatVars] = useState<string[]>([]);
  const [contVars, setContVars] = useState<string[]>([]);
  const [fillNA, setFillNA] = useState(false);
  const [resultTable, setResultTable] = useState<any[]>([]);
  const [columnTypes, setColumnTypes] = useState<{ column: string; suggested_type: string }[]>([]);
  const [groupCounts, setGroupCounts] = useState<Record<string, number>>({});
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [ColumnProfile, setColumnProfile] = useState<any[]>([]);
  const value: AnalysisState = {
    file,
    parsedData,
    groupVar,
    catVars,
    contVars,
    fillNA,
    resultTable,
    groupCounts,
    columnTypes,
    aiDiagnosis,
    setColumnTypes,
    setFile,
    setParsedData,
    setGroupVar,
    setCatVars,
    setContVars,
    setFillNA,
    setResultTable,
    setGroupCounts,
    setAiDiagnosis,
    ColumnProfile,
    setColumnProfile
  };

  return <AnalysisContext.Provider value={{file,
    parsedData,
    groupVar,
    catVars,
    contVars,
    fillNA,
    resultTable,
    groupCounts,
    columnTypes,
    aiDiagnosis,
    setColumnTypes,
    setFile,
    setParsedData,
    setGroupVar,
    setCatVars,
    setContVars,
    setFillNA,
    setResultTable,
    setGroupCounts,
    setAiDiagnosis,
    ColumnProfile,
    setColumnProfile,
  }}>{children}</AnalysisContext.Provider>;
}

export const useAnalysis = () => {
  const context = useContext(AnalysisContext);
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider");
  }
  
  return context;
};


