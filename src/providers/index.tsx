import { ModalProvider } from "@/providers/ModalProvider";
import { TooltipProvider } from "@/providers/TooltipProvider";
import { EnvironmentProvider } from "../contexts/EnvironmentContext";
import { useLoaderData } from "react-router";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const { environment, simulateThinkingTokens } = useLoaderData<{
    environment: string;
    simulateThinkingTokens: boolean;
  }>();

  return (
    <EnvironmentProvider
      environment={environment}
      simulateThinkingTokens={simulateThinkingTokens}
    >
      <TooltipProvider>
        <ModalProvider>{children}</ModalProvider>
      </TooltipProvider>
    </EnvironmentProvider>
  );
};
