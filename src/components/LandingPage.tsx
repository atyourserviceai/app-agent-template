import { X } from "@phosphor-icons/react";

interface LandingPageProps {
  onSignIn: () => void;
  onDismiss: () => void;
  authError?: string | null;
}

export function LandingPage({ onSignIn, onDismiss, authError }: LandingPageProps) {
  return (
    <div className="absolute inset-0 z-[55] overflow-auto bg-neutral-100/95 dark:bg-neutral-950/95 backdrop-blur-sm">
      <div className="w-full py-4 md:py-6 px-3 md:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Close button - inline at top */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={onDismiss}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 rounded-lg transition-colors"
              aria-label="Close and explore"
            >
              <X size={16} />
              <span>Skip intro</span>
            </button>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-block max-w-4xl w-full mx-auto rounded-2xl bg-transparent supports-[backdrop-filter]:backdrop-blur-[8px] px-4 md:px-6 lg:px-10 py-6 md:py-8 lg:py-10">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
                App Agent Template
              </h1>
            <p className="text-lg md:text-xl text-gray-800 dark:text-gray-200 mb-2">
              A clean foundation for Cloudflare Worker agents with interactive
              visuals.
            </p>
            <p className="text-blue-700 dark:text-blue-400 italic mb-6 md:mb-8 text-sm md:text-base">
              Free AI credits to get you going.
            </p>

            {authError && (
              <div className="mb-4 md:mb-6 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg max-w-md mx-auto">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {authError}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onDismiss}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg transition-colors duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                Try the Simulation
              </button>
              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg transition-colors duration-200 cursor-pointer"
              >
                Sign in to Chat
              </button>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 text-center">
            Feature highlights
          </h2>
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 text-gray-700 dark:text-gray-300 text-sm md:text-base">
            <ul className="list-disc pl-4 md:pl-6 space-y-1 md:space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Interactive ball simulation
                </strong>
                : PixiJS-powered bouncing balls controlled via AI chat.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Two modes
                </strong>
                : Plan and Act for structured AI workflows.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Auth & LLM Gateway
                </strong>{" "}
                via AI@YourService (users pay their own usage).
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Export / Import
                </strong>{" "}
                endpoints for data portability.
              </li>
            </ul>
            <ul className="list-disc pl-4 md:pl-6 space-y-1 md:space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-white">
                  AI-controlled physics
                </strong>
                : Change gravity, add balls, pause simulation via natural
                language.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Cloudflare Browser Rendering
                </strong>{" "}
                ready for remote scraping/automation.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Reliability & DX
                </strong>
                : improved auth/error handling, guarded mounts, readable logs.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Theming
                </strong>
                : system default, persistent toggle, DRY component.
              </li>
            </ul>
          </div>
        </div>

        {/* Ball Simulation Demo */}
        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            AI-controlled ball simulation
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-base">
            <div className="space-y-4">
              <p>
                The template includes a PixiJS-powered bouncing ball simulation
                that demonstrates how AI can control interactive visualizations
                through natural language.
              </p>
              <p className="font-medium text-gray-900 dark:text-white">
                Try commands like:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>"Add a red ball"</li>
                <li>"Add 5 blue balls"</li>
                <li>"Set gravity to zero"</li>
                <li>"Pause the simulation"</li>
                <li>"Clear all balls"</li>
              </ul>
            </div>
            <div className="space-y-4">
              <p className="font-medium text-gray-900 dark:text-white">
                Available tools:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    addBall
                  </code>{" "}
                  - Add a single ball with custom properties
                </li>
                <li>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    addMultipleBalls
                  </code>{" "}
                  - Add up to 20 balls at once
                </li>
                <li>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    setGravity
                  </code>{" "}
                  - Control physics (0 = floating, 2 = heavy)
                </li>
                <li>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    toggleSimulation
                  </code>{" "}
                  - Pause/resume animation
                </li>
                <li>
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">
                    clearBalls
                  </code>{" "}
                  - Remove all balls
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stack & Architecture */}
        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Stack & architecture
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-base">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Cloudflare Workers + Durable Objects
                </h3>
                <p>
                  Stateless request handling with strongly consistent state
                  where you need it (sessions, chat state, and long-lived
                  coordination).
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Agents SDK
                </h3>
                <p>
                  Agent lifecycle, tool execution, state sync and scheduling.
                  Ship multi-mode agents with minimal glue code.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  AI@YourService
                </h3>
                <p>
                  OAuth login and LLM Gateway so users pay for their own usage.
                  Works locally and in staging without changing your app code.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Remix (RR7) + React 19
                </h3>
                <p>
                  Modern routing/data APIs with React 19 UI and Tailwind CSS,
                  powered by Vite for local dev.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Two modes
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-center text-gray-700 dark:text-gray-300 text-base max-w-2xl mx-auto">
            <div>
              <div className="text-3xl mb-2">Plan</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Planning mode
              </h3>
              <p>
                Analyze tasks, create strategies, and break down complex
                problems without executing actions.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">Act</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Action mode
              </h3>
              <p>
                Execute approved actions, control the simulation, and interact
                with external systems.
              </p>
            </div>
          </div>
        </div>

        {/* Quickstart (from README highlights) */}
        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Quickstart
          </h2>
          <ol className="list-decimal pl-6 space-y-3 text-gray-700 dark:text-gray-300 text-base max-w-3xl mx-auto">
            <li>
              Install dependencies and copy `.dev.vars.example` to `.dev.vars`
              with your local values.
            </li>
            <li>
              Start the dev server; visit the app and sign in with
              AI@YourService.
            </li>
            <li>
              Chat with the AI to add balls, change gravity, or control the
              simulation.
            </li>
            <li>
              Switch between Plan and Act modes to explore different agent
              behaviors.
            </li>
          </ol>
          <p className="text-center mt-6">
            <a
              href="https://github.com/atyourserviceai/app-agent-template"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-700 dark:text-blue-400"
            >
              Read the full README
            </a>
          </p>
        </div>

        <div className="text-center pt-4">
          <p className="text-xl font-medium text-gray-900 dark:text-white mb-6">
            Build interactive AI agents with a production-ready foundation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onDismiss}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Try the Simulation
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="w-full sm:w-auto bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200 cursor-pointer"
            >
              Sign in to Chat
            </button>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-4">
            Simulation works locally. Sign in to use the AI chat.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}
