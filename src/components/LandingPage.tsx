import { X, GithubLogo, Lightning, CloudArrowUp, Microphone, DeviceMobile, Code, Rocket } from "@phosphor-icons/react";

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
                Build AI-powered apps where users pay their own LLM costs.
              </p>
              <p className="text-blue-700 dark:text-blue-400 italic mb-6 md:mb-8 text-sm md:text-base">
                Fork it. Customize it. Ship it.
              </p>

              {authError && (
                <div className="mb-4 md:mb-6 p-3 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/50 rounded-lg max-w-md mx-auto">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {authError}
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
                <a
                  href="https://github.com/atyourserviceai/app-agent-template"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <GithubLogo size={24} weight="fill" />
                  Fork on GitHub
                </a>
                <button
                  type="button"
                  onClick={onSignIn}
                  className="w-full sm:w-auto bg-[#F48120] hover:bg-[#F48120]/90 text-white font-semibold py-3 md:py-4 px-6 md:px-8 rounded-lg text-base md:text-lg transition-colors duration-200 cursor-pointer"
                >
                  Try the Demo
                </button>
              </div>
              <button
                type="button"
                onClick={onDismiss}
                className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 underline"
              >
                or explore without signing in
              </button>
            </div>
          </div>

          {/* What is this? */}
          <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 text-center">
              What is this?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-base md:text-lg text-center max-w-2xl mx-auto mb-6">
              An open-source template for building AI chat applications with built-in authentication and billing.
              Your users sign in with{" "}
              <a
                href="https://atyourservice.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#F48120] hover:underline font-medium"
              >
                AI@YourService
              </a>{" "}
              and pay for their own LLM usage - you focus on your app, not billing infrastructure.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-700 dark:text-neutral-300">AI SDK v6</span>
              <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-700 dark:text-neutral-300">Cloudflare Agents SDK</span>
              <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-700 dark:text-neutral-300">React Router 7</span>
              <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-700 dark:text-neutral-300">TypeScript</span>
              <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full text-neutral-700 dark:text-neutral-300">Tailwind CSS</span>
            </div>
          </div>

          {/* Key Features */}
          <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-4 md:p-6 lg:p-8 mb-6 md:mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6 text-center">
              Built-in features
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-[#F48120]/20 flex-shrink-0">
                  <Lightning size={20} className="text-[#F48120]" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI Chat with Tools</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Streaming responses, tool calling, multi-turn conversations. Powered by AI SDK v6.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-blue-500/20 flex-shrink-0">
                  <Microphone size={20} className="text-blue-500" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Voice Input</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built-in speech-to-text transcription. Talk to your AI agent hands-free.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-green-500/20 flex-shrink-0">
                  <DeviceMobile size={20} className="text-green-500" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Cross-Device Sync</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    State persists in Durable Objects. Pick up where you left off on any device.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-purple-500/20 flex-shrink-0">
                  <CloudArrowUp size={20} className="text-purple-500" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">One-Click Deploy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Deploy to Cloudflare Workers with wrangler. Global edge deployment included.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-yellow-500/20 flex-shrink-0">
                  <Code size={20} className="text-yellow-600" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Export / Import</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Built-in data portability. Users can export their data anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                <div className="p-2 rounded-full bg-red-500/20 flex-shrink-0">
                  <Rocket size={20} className="text-red-500" weight="fill" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Plan & Act Modes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Structured workflows: plan before acting, or let the agent execute directly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it Works */}
          <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              How billing works
            </h2>
            <div className="max-w-2xl mx-auto text-gray-700 dark:text-gray-300 text-base space-y-4">
              <p>
                When users sign in to your app, they authenticate via{" "}
                <a
                  href="https://atyourservice.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#F48120] hover:underline font-medium"
                >
                  AI@YourService
                </a>
                {" "}and get their own credits. Every LLM call is billed to their account, not yours.
              </p>
              <p>
                New users get free credits to try your app. Power users can add more credits or bring their own API keys (BYOK).
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 italic">
                You build the app. We handle auth, billing, and the LLM gateway.
              </p>
            </div>
          </div>

          {/* Quickstart */}
          <div className="bg-white/90 dark:bg-black/60 rounded-2xl p-6 md:p-8 mb-8 border border-gray-200 dark:border-blue-500/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Get started in 5 minutes
            </h2>
            <div className="max-w-2xl mx-auto">
              <div className="bg-neutral-900 dark:bg-neutral-800 rounded-lg p-4 mb-4 overflow-x-auto">
                <code className="text-green-400 text-sm md:text-base font-mono whitespace-pre">
{`# Clone the template
git clone https://github.com/atyourserviceai/app-agent-template
cd app-agent-template

# Install & configure
pnpm install
cp .dev.vars.example .dev.vars

# Start developing
pnpm run dev`}
                </code>
              </div>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300 text-sm md:text-base">
                <li>Fork or clone the template from GitHub</li>
                <li>Configure your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.dev.vars</code> with AI@YourService credentials</li>
                <li>Customize the agent tools in <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">src/agent/</code></li>
                <li>Replace the demo UI with your own application</li>
                <li>Deploy with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">pnpm run deploy</code></li>
              </ol>
            </div>
          </div>

          {/* Demo Section */}
          <div className="bg-gradient-to-r from-[#F48120]/10 to-blue-500/10 rounded-2xl p-6 md:p-8 mb-8 border border-[#F48120]/20">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              Try the demo
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-base text-center max-w-2xl mx-auto mb-6">
              This template includes a bouncing ball simulation to demonstrate AI-controlled interactions.
              Sign in to chat with the AI and control the simulation with natural language.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto bg-[#F48120] hover:bg-[#F48120]/90 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Sign in to Chat
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-full sm:w-auto bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200"
              >
                Explore Without Signing In
              </button>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="text-center pt-4">
            <p className="text-xl font-medium text-gray-900 dark:text-white mb-6">
              Build your AI-powered app today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://github.com/atyourserviceai/app-agent-template"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <GithubLogo size={20} weight="fill" />
                View on GitHub
              </a>
              <a
                href="https://atyourservice.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto bg-[#F48120] hover:bg-[#F48120]/90 text-white font-semibold py-3 px-6 rounded-lg text-base transition-colors duration-200"
              >
                Learn about AI@YourService
              </a>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-4">
              Open source under MIT license.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
