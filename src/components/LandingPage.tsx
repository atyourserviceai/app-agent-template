interface LandingPageProps {
  onSignIn: () => void;
  authError?: string | null;
}

export function LandingPage({ onSignIn, authError }: LandingPageProps) {
  return (
    <div className="w-full">
      <div className="max-w-2xl w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            App Agent Template{" "}
          </h1>
          <p className="text-blue-600 dark:text-blue-400 text-lg mb-1">
            ✨ AI Agent Boilerplate ✨
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Uses{" "}
            <a
              href="https://atyourservice.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              AI @ Your Service
            </a>{" "}
            as billing solution for AI usage
          </p>
        </div>

        <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Get Started with AI
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Sign in with AI @ Your Service to power your agent
            </p>
          </div>

          <div className="mb-6 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center">
              <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
              Get 50¢ in free credits to start
            </div>
            <div className="flex items-center">
              <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
              Track usage in your dashboard
            </div>
            <div className="flex items-center">
              <span className="text-green-500 dark:text-green-400 mr-2">✓</span>
              Top up or use your own OpenAI API key
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {authError}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onSignIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 hover:cursor-pointer shadow-md"
          >
            <span>🎯</span>
            <span>Sign in with AI @ Your Service</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">
              We'll only access your account to provide AI services and track
              usage. Your data is secure and never shared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
