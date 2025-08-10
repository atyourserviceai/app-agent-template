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
            What’s included
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-700 dark:text-gray-300 text-base">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Agent modes
                </h3>
                <p>
                  Onboarding, Integration, Plan, Act lifecycle wired end-to-end.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Floating chat UI
                </h3>
                <p>Presentation-first layout with on-demand chat.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Auth & gateway
                </h3>
                <p>AI@YourService login and LLM gateway pre-integrated.</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  Cloudflare-native
                </h3>
                <p>Workers + Durable Objects with clean state patterns.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            How it works
          </h2>
          <div className="grid md:grid-cols-4 gap-6 text-center text-gray-700 dark:text-gray-300 text-base">
            <div>
              <div className="text-3xl mb-2">💬</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                1. Chat
              </h3>
              <p>Converse in a floating panel over your presentation.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🧩</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                2. Integrate
              </h3>
              <p>Wire up tools and confirm before execution.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🗺️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                3. Plan
              </h3>
              <p>Think strategically without executing tools.</p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                4. Act
              </h3>
              <p>Run actions through the gateway with your billing.</p>
            </div>
          </div>
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
