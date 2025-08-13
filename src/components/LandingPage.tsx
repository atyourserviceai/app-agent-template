interface LandingPageProps {
  onSignIn: () => void;
  authError?: string | null;
}

export function LandingPage({ onSignIn, authError }: LandingPageProps) {
  return (
    <div className="w-full py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block max-w-4xl w-full mx-auto rounded-2xl bg-transparent supports-[backdrop-filter]:backdrop-blur-[8px] px-6 py-8 md:px-10 md:py-10">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
              App Agent Template
            </h1>
            <p className="text-xl text-gray-800 dark:text-gray-200 mb-2">
              A clean foundation for Cloudflare Worker agents with a modern UX.
            </p>
            <p className="text-blue-700 dark:text-blue-400 italic mb-8">
              Free AI credits to get you going.
            </p>

            {authError && (
              <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg max-w-md mx-auto">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {authError}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={onSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                Try it →
              </button>
              <a
                href="https://github.com/atyourserviceai/app-agent-template"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white dark:bg-white dark:text-black font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 hover:bg-black/90 dark:hover:bg-white/90 cursor-pointer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>

        {/* What You Get Section */}
        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Feature highlights
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-base">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Four modes
                </strong>
                : Onboarding, Integration, Plan, Act.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Presentation‑first UI
                </strong>{" "}
                with floating Chat.
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
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-gray-900 dark:text-white">
                  Composio integration
                </strong>{" "}
                option to connect 3rd‑party apps.
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
            Four modes
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center text-gray-700 dark:text-gray-300 text-base">
            <div>
              <div className="text-3xl mb-2">🧭</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                1. Onboarding
              </h3>
              <p>
                Define the agent’s purpose, configuration and starting state.
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🧩</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                2. Integration
              </h3>
              <p>Connect tools and require confirmation before execution.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                3. Plan
              </h3>
              <p>Analyze and decide without executing any tools.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                4. Act
              </h3>
              <p>
                Execute approved actions using your own AI billing via the
                gateway.
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
              Use the floating Chat to interact; switch modes from the header.
            </li>
            <li>
              Export data via the provided endpoints when you want to back up or
              migrate.
            </li>
          </ol>
          <p className="text-center mt-6">
            <a
              href="https://github.com/atyourserviceai/app-agent-template"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-blue-700 dark:text-blue-400"
            >
              Read the full README →
            </a>
          </p>
        </div>

        <div className="text-center">
          <p className="text-xl font-medium text-gray-900 dark:text-white mb-6">
            Build faster with a production-ready agent foundation.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Try it →
            </button>
            <a
              href="https://github.com/atyourserviceai/app-agent-template"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white dark:bg-white dark:text-black font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 hover:bg-black/90 dark:hover:bg-white/90 cursor-pointer"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
