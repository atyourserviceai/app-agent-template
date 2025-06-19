# AtYourService.ai OAuth Integration Plan

## Overview

Implement a clean OAuth flow where AtYourService.ai acts as the **AI fuel provider** for demos, separate from the demo's own authentication system. Users can choose between AtYourService.ai credits or their own API keys to power the AI.

## Key Architecture Insights

### 1. **Always Require AtYourService.ai Account**
Even for BYOK users, we require an AtYourService.ai account because:
- **User-specific agent rooms**: Each user needs their own agent instance (can't all use "default")
- **Consistent auth flow**: Single OAuth regardless of payment method
- **Better UX**: Users can switch between credits/BYOK in their dashboard
- **API key management**: BYOK keys stored securely in AtYourService.ai dashboard

### 2. **Authentication Strategy**
- **Authentication happens BEFORE agent creation** using `onBeforeConnect` hook
- **No separate API key verification in agent** - the gateway handles this when making LLM requests
- **User ID determines agent room name**: `/agents/app-agent-template/{user_id}`

## User Experience Flow

### App Agent Template Landing Page
```
┌─────────────────────────────────────────┐
│        🤖 App Agent Template            │
│     Customizable AI Agent Platform     │
│                                         │
│  This app uses AtYourService.ai to fuel │
│  the AI. Sign in to get started:        │
│                                         │
│  ✓ Get $5 in free credits               │
│  ✓ Your own private agent instance      │
│  ✓ Choose credits or BYOK (advanced)    │
│  ✓ Track usage in your dashboard        │
│                                         │
│  [🎯 Sign in with AtYourService.ai]    │
│                                         │
│  [ℹ️ Learn more about AtYourService.ai] │
└─────────────────────────────────────────┘
```

### OAuth Flow with Client Secret
1. **Landing** → "Sign in with AtYourService.ai"
2. **OAuth Redirect** → `https://atyourservice.ai/oauth/authorize?client_id=app-agent-template&redirect_uri=...`
3. **User Auth** → User signs in/signs up with AtYourService.ai
4. **Authorization** → User approves "App Agent Template" access
5. **Token Exchange** → App server exchanges authorization code + client secret for API key
6. **Store User Info** → User info stored in agent's Durable Object
7. **Agent Access** → Connect to user-specific agent: `/agents/app-agent-template/{user_id}`

### Why AtYourService.ai for All Users?
- **User-specific rooms**: Each user gets their own agent instance (`/{user_id}`)
- **Easy for AI integrators**: No need to build user management, billing, API key management
- **Users join integrator's organization**: Simple auth solution for getting started
- **Scales to enterprise**: Later can add custom auth for larger customers
- **Better UX**: Users can switch between credits/BYOK without re-auth

## Technical Architecture

### 1. Website (SvelteKit) - OAuth Provider

#### OAuth App Configuration
```typescript
// website/src/lib/oauth/types.ts
export interface OAuthApp {
  name: string;
  description: string;
  client_id: string;
  client_secret: string;
  redirect_uris: string[];
  scopes: string[];
  promotional_credits?: number;
  auth_url: string;
  token_url: string;
  websocket_url: string;
}

// website/src/lib/oauth/apps.ts
export const OAUTH_APPS: Record<string, OAuthApp> = {
  'app-agent-template': {
    name: 'App Agent Template',
    description: 'Template for building AI agents with AtYourService.ai',
    client_id: 'app-agent-template',
    client_secret: env.APP_AGENT_TEMPLATE_SECRET, // Required for server-side token exchange
    redirect_uris: [
      'http://localhost:5273/auth/callback', // local dev
      'https://app-agent-template.atyourservice.ai/auth/callback', // prod
    ],
    scopes: ['agent-fuel', 'usage-tracking'],
    promotional_credits: 500, // $5.00 promotional credits
    auth_url: 'https://atyourservice.ai',
    token_url: 'https://atyourservice.ai/oauth/token',
  },
  // ... other apps will be added later
};
```

#### OAuth Endpoints (Website)
```typescript
// website/src/routes/oauth/authorize/+page.server.ts
export const load: PageServerLoad = async ({ url, locals }) => {
  const clientId = url.searchParams.get('client_id');
  const scope = url.searchParams.get('scope');
  const redirectUri = url.searchParams.get('redirect_uri');

  const app = OAUTH_APPS[clientId];
  if (!app) throw error(400, 'Invalid client_id');

  return {
    app,
    authRequest: { clientId, scope, redirectUri }
  };
};

// website/src/routes/oauth/token/+server.ts
export const POST: RequestHandler = async ({ request, locals }) => {
  const { code, client_id, client_secret } = await request.json();

  // Verify client credentials
  const app = OAUTH_APPS[client_id];
  if (!app || app.client_secret !== client_secret) {
    throw error(401, 'Invalid client credentials');
  }

  // Verify auth code, get user
  const authSession = await getAuthSession(code);
  const user = authSession.user;

  // Create or get app-specific API key for this user
  const apiKey = await createUserApiKey(user.id, client_id, {
    name: `App: ${OAUTH_APPS[client_id].name}`,
    description: 'API key for app usage',
    app_context: client_id
  });

  // Grant promotional credits if new app user
  if (app.promotional_credits) {
    await grantPromotionalCredits(user.id, app.promotional_credits, client_id);
  }

  return json({
    // Return the actual AtYourService.ai API key
    api_key: apiKey.key,
    user_info: {
      id: user.id,
      email: user.email,
      credits: user.credits,
      granted_promo: app.promotional_credits
    }
  });
};
```

### 2. App Agent Template AuthGuard Component (React + Cloudflare Workers)

#### OAuth Configuration (Production URLs)
```typescript
// src/config/oauth.ts
interface OAuthConfig {
  client_id: string;
  auth_url: string;
  token_url: string;
}

export const getOAuthConfig = (): OAuthConfig => {
  // Use production AtYourService.ai for all environments
  return {
    client_id: 'app-agent-template',
    auth_url: 'https://atyourservice.ai',
    token_url: 'https://atyourservice.ai/oauth/token',
  };
};
```

#### AuthGuard Component
```typescript
// src/components/auth/AuthGuard.tsx
interface AuthMethod {
  type: 'atyourservice' | 'byok';
  apiKey?: string; // AtYourService.ai API key from OAuth
  userInfo?: { id: string; email: string; credits: number };
  byokKeys?: { openai?: string; anthropic?: string };
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [showBYOK, setShowBYOK] = useState(false);

  if (!authMethod) {
    return (
      <DemoLandingPage
        onSelectAtYourService={() => initiateOAuth()}
        onSelectBYOK={() => setShowBYOK(true)}
        showBYOK={showBYOK}
        onBYOKSubmit={(keys) => setAuthMethod({ type: 'byok', byokKeys: keys })}
      />
    );
  }

  return (
    <AuthProvider value={authMethod}>
      {children}
    </AuthProvider>
  );
}

function initiateOAuth() {
  const config = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.client_id,
    scope: 'agent-fuel,usage-tracking',
    redirect_uri: `${window.location.origin}/auth/callback`,
    response_type: 'code'
  });

  window.location.href = `${config.auth_url}/oauth/authorize?${params}`;
}
```

#### OAuth Callback Handler with Client Secret
```typescript
// src/routes/auth/callback/page.tsx - Server-side token exchange
export default function AuthCallback() {
  // Client-side receives auth code, sends to server for secure token exchange
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/?error=' + error);
        return;
      }

      if (!code) {
        navigate('/?error=missing_code');
        return;
      }

      try {
        const config = getOAuthConfig();
        const response = await fetch(config.token_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            client_id: config.client_id,
            grant_type: 'authorization_code'
          })
        });

        const tokenData = await response.json();

        // Store the AtYourService.ai API key for the agent
        localStorage.setItem('auth_method', JSON.stringify({
          type: 'atyourservice',
          apiKey: tokenData.api_key, // This is the AtYourService.ai API key!
          userInfo: tokenData.user_info
        }));

        navigate('/');
      } catch (err) {
        console.error('Token exchange failed:', err);
        navigate('/?error=token_exchange_failed');
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  return <div>Completing authentication...</div>;
}
```

### 3. Agent Connection with API Key

#### Cloudflare Workers Authentication Implementation

```typescript
// src/server.ts - Main entry point using routeAgentRequest
import { routeAgentRequest } from 'agents';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return (await routeAgentRequest(request, env, {
      // Authenticate users before WebSocket connection
      onBeforeConnect: async (request) => {
        const url = new URL(request.url);
        const token = url.searchParams.get('token');

        if (!token) {
          return new Response('Missing auth token', { status: 401 });
        }

        // Verify OAuth token with AtYourService.ai
        const userInfo = await verifyOAuthToken(token, env);
        if (!userInfo) {
          return new Response('Invalid auth token', { status: 403 });
        }

        // User info will be available to the agent instance
        // Agent name automatically becomes: `/agents/app-agent-template/{userInfo.id}`

        return undefined; // Continue to agent
      },

      // Authenticate HTTP requests
      onBeforeRequest: async (request) => {
        const url = new URL(request.url);
        const token = url.searchParams.get('token') ||
                     request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!token) {
          return new Response('Missing auth token', { status: 401 });
        }

        const userInfo = await verifyOAuthToken(token, env);
        if (!userInfo) {
          return new Response('Invalid auth token', { status: 403 });
        }

        return undefined; // Continue to agent
      }
    })) || new Response('Not found', { status: 404 });
  }
};

async function verifyOAuthToken(token: string, env: Env) {
  try {
    // Call AtYourService.ai to verify the OAuth token
    const response = await fetch('https://atyourservice.ai/api/oauth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return null;

    const userInfo = await response.json();
    return userInfo; // { id, email, api_key, payment_method: 'credits'|'byok' }
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
```

#### Frontend Agent Connection (User-Specific Rooms)
```typescript
// src/hooks/useAgentAuth.tsx - Connect to user-specific agent instances
export function useAgentAuth() {
  const { userInfo, token } = useContext(AuthContext);

  const agentConfig = useMemo(() => {
    if (!userInfo || !token) return null;

    // Each user gets their own agent instance using their user ID
    return {
      agent: 'app-agent-template',
      name: userInfo.id, // User-specific room name
      url: `${window.location.origin}/agents/app-agent-template/${userInfo.id}?token=${token}`,
    };
  }, [userInfo, token]);

  return agentConfig;
}
```

#### Simplified Agent Implementation (No Manual Auth)

The agent doesn't need to handle authentication - that's done by `onBeforeConnect`. The agent just needs to get the right API key from the OAuth verification:

```typescript
// src/agent/AppAgent.ts - Minimal changes to existing file

// Add this helper function to get user info from agent name
private getUserInfo(): { id: string; api_key: string } | null {
  // The agent name IS the user ID (set by routeAgentRequest URL routing)
  const userId = this.name;

  // TODO: We need to fetch the user's API key somehow
  // This could be stored in the agent's durable storage, or fetched from AtYourService.ai
  // For now, we'll need to implement this based on your auth flow

  return {
    id: userId,
    api_key: this.env.GATEWAY_API_KEY // Temporary - needs proper implementation
  };
}

// Update the AI provider to use gateway with user's API key
private getAIProvider() {
  const userInfo = this.getUserInfo();

  if (userInfo?.api_key) {
    // Always use AtYourService.ai Gateway - it handles both credits and BYOK
    return createOpenAI({
      apiKey: userInfo.api_key, // User's AtYourService.ai API key from OAuth
      baseURL: `${this.env.GATEWAY_BASE_URL}/v1/openai`,
    });
  } else {
    // Fallback to existing configuration
    return createOpenAI({
      apiKey: this.env.GATEWAY_API_KEY,
      baseURL: `${this.env.GATEWAY_BASE_URL}/v1/openai`,
    });
  }
}

// Modify existing onChatMessage to use the user-specific provider
async onChatMessage(
  onFinish: StreamTextOnFinishCallback<ToolSet>,
  options?: { abortSignal?: AbortSignal }
) {
  console.log(`[AppAgent] Processing chat for user: ${this.name}`);

  const dataStreamResponse = createDataStreamResponse({
    execute: async (dataStream) => {
      // ... existing code ...

      // Use user-specific AI provider
      const openai = this.getAIProvider();
      const model = openai("gpt-4o-2024-11-20");

      const result = streamText({
        model,
        system: this.getSystemPrompt(),
        messages: filteredMessages,
        tools: allTools,
        onFinish: async (args) => {
          console.log(`[AppAgent] Completed chat for user: ${this.name}`);
          onFinish(args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]);
        },
        // ... rest of existing config
      });

      result.mergeIntoDataStream(dataStream);
    },
    onError: getErrorMessage,
  });

  return dataStreamResponse;
}
```

#### User API Key Storage Implementation

**Option A: Store in Durable Storage During First Connection** ✅ **CHOSEN**

```typescript
// Enhanced onBeforeConnect with user data storage
onBeforeConnect: async (request) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing auth token', { status: 401 });
  }

  const userInfo = await verifyOAuthToken(token, env);
  if (!userInfo) {
    return new Response('Invalid auth token', { status: 403 });
  }

  // Store user info in the agent's Durable Object
  // This happens before the agent is created/retrieved
  const agentId = env.AppAgent.idFromName(userInfo.id);
  const agentStub = env.AppAgent.get(agentId);

  // Store user info for later access
  await agentStub.fetch(new Request('http://internal/store-user-info', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userInfo.id,
      api_key: userInfo.api_key,
      email: userInfo.email,
      credits: userInfo.credits
    })
  }));

  return undefined; // Continue to agent
}
```
```

## Implementation Priority

### Phase 1: Basic OAuth Flow
1. Website OAuth endpoints (`/oauth/authorize`, `/oauth/token`) with client secret
2. App AuthGuard component with AtYourService.ai redirect
3. OAuth callback handling and secure token exchange
4. Basic agent connection with user ID routing

### Phase 2: Agent Integration
1. Modify AppAgent.ts to handle user-specific API keys from Durable Storage
2. Implement user info storage via `onBeforeConnect`
3. Dynamic AI provider using stored user API key
4. User-specific agent instances working

### Phase 3: Advanced Features (Future)
1. BYOK key management in AtYourService.ai dashboard
2. Usage analytics per app user
3. Promotional credit system
4. Multi-app support

## Key Benefits for AI Integrators

1. **No Auth/Billing Infrastructure Needed**: AtYourService.ai handles user management, billing, API keys
2. **Easy Getting Started**: Users join integrator's organization, get free credits
3. **Scales to Enterprise**: Later can add custom auth for larger customers
4. **User Choice**: Credits OR bring-your-own-keys (managed in AtYourService.ai)
5. **User-Specific Instances**: Each user gets their own private agent room
6. **Real Usage Tracking**: Gateway handles verification, tracking, billing automatically

This showcases AtYourService.ai as a complete "AI backend as a service" solution for AI integrators who want to focus on building great agents, not infrastructure.
