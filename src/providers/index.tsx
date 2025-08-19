import { ModalProvider } from "@/providers/ModalProvider";
import { TooltipProvider } from "@/providers/TooltipProvider";
import { EnvironmentProvider } from "../contexts/EnvironmentContext";
import { useLoaderData } from "react-router";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const { environment } = useLoaderData<{ environment: string }>();

  return (
    <EnvironmentProvider environment={environment}>
      <TooltipProvider>
        <ModalProvider>{children}</ModalProvider>
      </TooltipProvider>
    </EnvironmentProvider>
  );
};
