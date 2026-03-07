"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { GridStatus } from "../components/Layout";

interface GridStatusContextType {
  status: GridStatus;
  setStatus: (status: GridStatus) => void;
}

const GridStatusContext = createContext<GridStatusContextType | undefined>(undefined);

export function GridStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GridStatus>("nominal");

  return (
    <GridStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </GridStatusContext.Provider>
  );
}

export function useGridStatus() {
  const context = useContext(GridStatusContext);
  if (context === undefined) {
    throw new Error("useGridStatus must be used within a GridStatusProvider");
  }
  return context;
}
