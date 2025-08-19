import { createContext, useContext, ReactNode } from "react";

interface EnvironmentContextType {
  environment: string;
  isDev: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | null>(null);

interface EnvironmentProviderProps {
  children: ReactNode;
  environment: string;
}

export function EnvironmentProvider({
  children,
  environment,
}: EnvironmentProviderProps) {
  const value: EnvironmentContextType = {
    environment,
    isDev: environment === "dev",
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error(
      "useEnvironment must be used within an EnvironmentProvider"
    );
  }
  return context;
}
