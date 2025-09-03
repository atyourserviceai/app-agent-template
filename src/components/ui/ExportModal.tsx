import { useState, useEffect } from "react";
import {
  X,
  Download,
  Image,
  FileText,
  Code,
  Upload
} from "@phosphor-icons/react";

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentUserId: string;
}

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: "png" | "svg" | "json" | "import";
  format?: "square" | "mobile";
  dimensions?: string;
}

const exportOptions: ExportOption[] = [
  {
    id: "square-png",
    name: "Square",
    description: "Perfect for Instagram, LinkedIn, and social posts",
    icon: <Image weight="duotone" />,
    type: "png",
    format: "square",
    dimensions: "1080×1080"
  },
  {
    id: "mobile-png",
    name: "Mobile Story",
    description: "Vertical format, height fits content automatically",
    icon: <Image weight="duotone" />,
    type: "png",
    format: "mobile",
    dimensions: "750×auto"
  },
  {
    id: "agent-backup-export",
    name: "Export Backup (JSON)",
    description: "Download complete configuration and state data",
    icon: <Download weight="duotone" />,
    type: "json"
  },
  {
    id: "agent-backup-import",
    name: "Import Backup (JSON)",
    description: "Restore configuration and state from backup file",
    icon: <Upload weight="duotone" />,
    type: "import"
  }
];

export function ExportModal({
  isOpen,
  onClose,
  agentUserId
}: ExportModalProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [exportingIds, setExportingIds] = useState<Set<string>>(new Set());
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(
    new Map()
  );
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Generate preview URLs when modal opens or theme changes
  useEffect(() => {
    if (!isOpen) return;

    const generatePreviews = async () => {
      const newPreviewUrls = new Map<string, string>();

      for (const option of exportOptions) {
        if (option.type === "png") {
          try {
            const response = await fetch(
              `/agents/app-agent/${agentUserId}/export`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  type: option.type,
                  format: option.format,
                  theme,
                  includeDebug: false
                })
              }
            );

            if (response.ok) {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              newPreviewUrls.set(option.id, url);
            }
          } catch (error) {
            console.error(
              `Failed to generate preview for ${option.id}:`,
              error
            );
          }
        }
      }

      setPreviewUrls(newPreviewUrls);
    };

    generatePreviews();

    // Cleanup URLs when component unmounts or modal closes
    return () => {
      previewUrls.forEach((url) => {
        window.URL.revokeObjectURL(url);
      });
    };
  }, [isOpen, theme, agentUserId]);

  if (!isOpen) return null;

  const handleImport = async (file: File) => {
    setExportingIds((prev) => new Set(prev).add("agent-backup-import"));
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/agents/app-agent/${agentUserId}/backup/import`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      if (response.ok) {
        setImportResult({
          success: true,
          message: result.message || "Import successful!"
        });
      } else {
        setImportResult({
          success: false,
          message: result.error || "Import failed"
        });
      }
    } catch (error) {
      console.error("Import failed:", error);
      setImportResult({
        success: false,
        message: "Import failed due to network error"
      });
    } finally {
      setExportingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete("agent-backup-import");
        return newSet;
      });
    }
  };

  const handleExport = async (option: ExportOption) => {
    if (option.type === "import") {
      // Handle file import
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = ".json";
      fileInput.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          handleImport(file);
        }
      };
      fileInput.click();
      return;
    }
    setExportingIds((prev) => new Set(prev).add(option.id));

    try {
      let response: Response;
      let filename: string;

      if (option.type === "json") {
        // JSON backup export
        response = await fetch(
          `/agents/app-agent/${agentUserId}/backup/export`,
          {
            method: "GET"
          }
        );
        filename = `agent-backup-${new Date().toISOString().split("T")[0]}.json`;
      } else {
        // Image export
        response = await fetch(`/agents/app-agent/${agentUserId}/export`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: option.type,
            format: option.format,
            theme,
            includeDebug: false
          })
        });
        filename = `agent-export-${option.format}-${theme}.${option.type}`;
      }

      if (response.ok) {
        // Create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Export failed:", error);
      // Could add toast notification here
    } finally {
      setExportingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(option.id);
        return newSet;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 md:p-6 bg-white/40 dark:bg-black/40 supports-[backdrop-filter]:backdrop-blur-[8px]">
      <div className="w-full max-w-2xl mx-auto my-8 md:my-12">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-neutral-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Export
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Download and share your agent state in various formats
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Theme:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    theme === "light"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-3 py-1 rounded-md text-sm transition-colors ${
                    theme === "dark"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="p-6 grid gap-4">
            {exportOptions.map((option) => {
              const isExporting = exportingIds.has(option.id);
              const previewUrl = previewUrls.get(option.id);

              return (
                <div
                  key={option.id}
                  className="rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors overflow-hidden"
                >
                  {/* Header with title and download button */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-gray-500 dark:text-gray-400">
                        {option.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {option.description}{" "}
                          {option.dimensions && `• ${option.dimensions}`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExport(option)}
                      disabled={isExporting}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        option.type === "import"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {option.type === "import" ? (
                        <Upload size={16} />
                      ) : (
                        <Download size={16} />
                      )}
                      {isExporting
                        ? option.type === "import"
                          ? "Importing..."
                          : "Exporting..."
                        : option.type === "import"
                          ? "Import"
                          : "Download"}
                    </button>
                  </div>

                  {/* Image preview for PNG exports */}
                  {option.type === "png" && (
                    <div className="px-4 pb-4">
                      {previewUrl ? (
                        <div className="relative bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 border border-gray-200 dark:border-neutral-600">
                          {/* Checkerboard pattern background to show transparency */}
                          <div
                            className="absolute inset-4 rounded"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg width='16' height='16' xmlns='http://www.w3.org/2000/svg'%3e%3cg fill='%23f3f4f6'%3e%3crect width='8' height='8'/%3e%3crect x='8' y='8' width='8' height='8'/%3e%3c/g%3e%3cg fill='%23e5e7eb'%3e%3crect x='8' width='8' height='8'/%3e%3crect y='8' width='8' height='8'/%3e%3c/g%3e%3c/svg%3e")`,
                              backgroundSize: "16px 16px"
                            }}
                          />
                          <div className="relative flex items-center justify-center min-h-[120px]">
                            <img
                              src={previewUrl}
                              alt={`${option.name} preview`}
                              className="max-w-full max-h-[200px] object-contain shadow-lg"
                              style={{
                                border: "2px solid rgba(0,0,0,0.1)",
                                borderRadius: "4px"
                              }}
                            />
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded backdrop-blur-sm">
                            {option.dimensions}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 rounded-lg border border-gray-200 dark:border-neutral-600 bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                          <div className="text-gray-500 dark:text-gray-400 text-sm">
                            Generating preview...
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Import Result */}
          {importResult && (
            <div
              className={`mx-6 p-4 rounded-lg ${
                importResult.success
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div
                className={`text-sm font-medium ${
                  importResult.success
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }`}
              >
                {importResult.success
                  ? "✅ Import Successful"
                  : "❌ Import Failed"}
              </div>
              <div
                className={`text-sm mt-1 ${
                  importResult.success
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}
              >
                {importResult.message}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 rounded-b-2xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Files are generated on-demand and downloaded directly to your
              device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
