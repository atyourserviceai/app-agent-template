import { Robot, X, CheckCircle, Gear, Lightning, ChatCircle } from "@phosphor-icons/react";

interface AIChatPromoProps {
  onSignIn: () => void;
  onClose: () => void;
}

/**
 * AI Chat promotional panel for unauthenticated users
 * Shows the benefits of the AI chat feature and prompts sign-in
 */
export function AIChatPromo({ onSignIn, onClose }: AIChatPromoProps) {
  return (
    <div className="fixed inset-0 md:inset-auto md:right-6 md:bottom-8 md:w-[520px] md:max-h-[calc(100vh-4rem)] overflow-hidden z-[70]">
      <div className="h-full flex flex-col md:mx-0 md:rounded-lg overflow-hidden shadow-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-[#F48120]/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#F48120]/20">
              <Robot size={24} className="text-[#F48120]" weight="fill" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                AI Chat
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Control the simulation with natural language
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Hero section */}
          <div className="text-center space-y-3">
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
              Chat with AI to control the simulation
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              Add balls, change gravity, pause the animation - all through natural language commands.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <ChatCircle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  Natural Language Control
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Just describe what you want: "Add 5 red balls" or "Set gravity to zero"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Gear size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  Physics Control
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Adjust gravity, pause/resume animation, and control the simulation parameters
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <Lightning size={20} className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-white">
                  Real-Time Updates
                </h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  See your commands take effect instantly in the simulation
                </p>
              </div>
            </div>
          </div>

          {/* What you can ask */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              Example commands
            </h4>
            <div className="flex flex-wrap gap-2">
              {[
                "Add a red ball",
                "Add 10 random balls",
                "Set gravity to zero",
                "Clear all balls"
              ].map((command) => (
                <span
                  key={command}
                  className="px-3 py-1.5 text-sm rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  "{command}"
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <button
            type="button"
            onClick={onSignIn}
            className="w-full py-3 px-4 rounded-lg bg-[#F48120] hover:bg-[#F48120]/90 text-white font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} weight="bold" />
            Sign in to start chatting
          </button>
          <p className="text-center text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            New accounts get free credits to try it out.{" "}
            <a
              href="https://atyourservice.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F48120] hover:underline"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
