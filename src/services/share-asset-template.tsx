import React from "react";
import type { AppAgentState } from "../agent/AppAgent";
import type { ShareExportOptions } from "./share-asset-generator";

export interface ShareAssetTemplateProps {
  agentState: AppAgentState;
  options: ShareExportOptions;
  dimensions: { width: number; height: number };
}

/**
 * Share Asset Template
 * Contains all JSX, styling, colors, and appearance logic for PNG exports
 */
export function ShareAssetTemplate({
  agentState,
  options,
  dimensions
}: ShareAssetTemplateProps) {
  const { theme } = options;
  const isDark = theme === "dark";

  // Extract key data from agent state
  const mode = agentState.mode || "onboarding";
  const onboardingComplete = agentState.isOnboardingComplete || false;
  const integrationComplete = agentState.isIntegrationComplete || false;
  const testCount = agentState.testResults
    ? Object.keys(agentState.testResults).length
    : 0;

  // Mode information
  const modeInfo = {
    onboarding: {
      title: "Welcome—let's set you up",
      description: "Set up the agent's purpose, defaults and operators."
    },
    integration: {
      title: "Validate and connect tools",
      description: "Connect tools, run checks and document capabilities."
    },
    plan: {
      title: "Think before you act",
      description: "Analyze context and propose next steps without executing."
    },
    act: {
      title: "Execute with confidence",
      description: "Execute approved actions with guardrails and visibility."
    }
  };

  const currentMode =
    modeInfo[mode as keyof typeof modeInfo] || modeInfo.onboarding;

  // Colors based on theme
  const colors = isDark
    ? {
        bg: "#171717",
        cardBg: "#262626",
        text: "#ffffff",
        textSecondary: "#a3a3a3",
        accent: "#F48120",
        border: "#404040",
        success: "#22c55e",
        warning: "#eab308"
      }
    : {
        bg: "#ffffff",
        cardBg: "#f5f5f5",
        text: "#171717",
        textSecondary: "#525252",
        accent: "#F48120",
        border: "#e5e5e5",
        success: "#22c55e",
        warning: "#eab308"
      };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        width: "100%",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "90%",
          maxWidth: "800px",
          background: `linear-gradient(135deg, ${isDark ? "#404040" : "#f5f5f5"}, ${isDark ? "#262626" : "#e5e5e5"})`,
          borderRadius: "12px",
          padding: "40px",
          marginBottom: "30px"
        }}
      >
        {/* Mode Badge */}
        <div
          style={{
            display: "flex",
            backgroundColor: colors.accent,
            color: "white",
            padding: "8px 16px",
            borderRadius: "14px",
            fontSize: "12px",
            fontWeight: "600",
            marginBottom: "20px",
            textTransform: "uppercase"
          }}
        >
          MODE • {mode}
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "36px",
            fontWeight: "bold",
            color: colors.text,
            marginBottom: "12px"
          }}
        >
          {currentMode.title}
        </div>

        {/* Description */}
        <div
          style={{
            display: "flex",
            fontSize: "16px",
            color: colors.textSecondary,
            lineHeight: "1.4"
          }}
        >
          {currentMode.description}
        </div>
      </div>

      {/* Stats Section */}
      <div
        style={{
          display: "flex",
          width: "90%",
          maxWidth: "800px",
          gap: "20px",
          marginBottom: "30px"
        }}
      >
        {/* Onboarding Status */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "12px",
              color: colors.textSecondary,
              fontWeight: "600",
              marginBottom: "8px"
            }}
          >
            ONBOARDING
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "16px",
              color: colors.text,
              fontWeight: "600"
            }}
          >
            {onboardingComplete ? "Complete" : "In progress"}
          </div>
        </div>

        {/* Integration Status */}
        <div
          style={{
            flex: 1,
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: "8px",
            padding: "20px",
            display: "flex",
            flexDirection: "column"
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "12px",
              color: colors.textSecondary,
              fontWeight: "600",
              marginBottom: "8px"
            }}
          >
            INTEGRATION
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "16px",
              color: colors.text,
              fontWeight: "600"
            }}
          >
            {integrationComplete ? "Complete" : `${testCount} tests`}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          fontSize: "12px",
          color: colors.textSecondary,
          marginTop: "auto",
          paddingBottom: "20px"
        }}
      >
        Generated by AI@YourService • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}