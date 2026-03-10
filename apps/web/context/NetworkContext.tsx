"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface NetworkContextType {
  isOffline: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isOffline: false });

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("network-offline", handleOffline);
    window.addEventListener("network-online", handleOnline);

    return () => {
      window.removeEventListener("network-offline", handleOffline);
      window.removeEventListener("network-online", handleOnline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOffline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetworkStatus = () => useContext(NetworkContext);
