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
  const { theme, format } = options;
  const isDark = theme === "dark";

  // Debug: Log the agent state to understand the structure
  console.log(
    "[ShareAssetTemplate] Agent state keys:",
    Object.keys(agentState || {})
  );
  console.log("[ShareAssetTemplate] Full agent state:", agentState);

  // Extract key data from agent state with defensive checks
  const mode = agentState?.mode || "act";

  // Mode information (simplified: only plan and act)
  const modeInfo = {
    plan: {
      title: "Think before you act",
      description: "Analyze context and propose next steps without executing."
    },
    act: {
      title: "Execute with confidence",
      description: "Execute approved actions with guardrails and visibility."
    }
  };

  const currentMode = modeInfo[mode as keyof typeof modeInfo] || modeInfo.act;

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

  // Format-specific adjustments
  const formatConfig = {
    square: {
      headerPadding: "40px",
      fontSize: { title: "32px", badge: "12px", description: "16px" },
      spacing: { marginBottom: "30px", gap: "20px" },
      maxWidth: "700px"
    },
    mobile: {
      headerPadding: "30px",
      fontSize: { title: "28px", badge: "11px", description: "15px" },
      spacing: { marginBottom: "25px", gap: "18px" },
      maxWidth: "600px"
    }
  };

  const config =
    formatConfig[format as keyof typeof formatConfig] || formatConfig.square;

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
          maxWidth: config.maxWidth,
          background: `linear-gradient(135deg, ${isDark ? "#404040" : "#f5f5f5"}, ${isDark ? "#262626" : "#e5e5e5"})`,
          borderRadius: "12px",
          padding: config.headerPadding,
          marginBottom: config.spacing.marginBottom
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
            fontSize: config.fontSize.badge,
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
            fontSize: config.fontSize.title,
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
            fontSize: config.fontSize.description,
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
          maxWidth: config.maxWidth,
          gap: config.spacing.gap,
          marginBottom: config.spacing.marginBottom
        }}
      >
        {/* Current Mode */}
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
            CURRENT MODE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "16px",
              color: colors.text,
              fontWeight: "600",
              textTransform: "capitalize"
            }}
          >
            {mode}
          </div>
        </div>

        {/* Last Change */}
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
            LAST CHANGE
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "16px",
              color: colors.text,
              fontWeight: "600"
            }}
          >
            {agentState?._lastModeChange
              ? new Date(agentState._lastModeChange).toLocaleDateString()
              : "—"}
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
