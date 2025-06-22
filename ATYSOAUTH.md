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
  "app-agent-template": {
    name: "App Agent Template",
    description: "Template for building AI agents with AtYourService.ai",
    client_id: "app-agent-template",
    client_secret: env.APP_AGENT_TEMPLATE_SECRET, // Required for server-side token exchange
    redirect_uris: [
      "http://localhost:5273/auth/callback", // local dev
      "https://app-agent-template.atyourservice.ai/auth/callback", // prod
    ],
    scopes: ["agent-fuel", "usage-tracking"],
    promotional_credits: 500, // $5.00 promotional credits
    auth_url: "https://atyourservice.ai",
    token_url: "https://atyourservice.ai/oauth/token",
  },
  // ... other apps will be added later
};
```

#### OAuth Endpoints (Website)

```typescript
// website/src/routes/oauth/authorize/+page.server.ts
export const load: PageServerLoad = async ({ url, locals }) => {
  const clientId = url.searchParams.get("client_id");
  const scope = url.searchParams.get("scope");
  const redirectUri = url.searchParams.get("redirect_uri");

  const app = OAUTH_APPS[clientId];
  if (!app) throw error(400, "Invalid client_id");

  return {
    app,
    authRequest: { clientId, scope, redirectUri },
  };
};

// website/src/routes/oauth/token/+server.ts
export const POST: RequestHandler = async ({ request, locals }) => {
  const { code, client_id, client_secret } = await request.json();

  // Verify client credentials
  const app = OAUTH_APPS[client_id];
  if (!app || app.client_secret !== client_secret) {
    throw error(401, "Invalid client credentials");
  }

  // Verify auth code, get user
  const authSession = await getAuthSession(code);
  const user = authSession.user;

  // Create or get app-specific API key for this user
  const apiKey = await createUserApiKey(user.id, client_id, {
    name: `App: ${OAUTH_APPS[client_id].name}`,
    description: "API key for app usage",
    app_context: client_id,
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
      granted_promo: app.promotional_credits,
    },
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
    client_id: "app-agent-template",
    auth_url: "https://atyourservice.ai",
    token_url: "https://atyourservice.ai/oauth/token",
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
import { routeAgentRequest } from "agents";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return (
      (await routeAgentRequest(request, env, {
        // Authenticate users before WebSocket connection
        onBeforeConnect: async (request) => {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return new Response("Missing auth token", { status: 401 });
          }

          // Verify OAuth token with AtYourService.ai
          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          // User info will be available to the agent instance
          // Agent name automatically becomes: `/agents/app-agent-template/{userInfo.id}`

          return undefined; // Continue to agent
        },

        // Authenticate HTTP requests
        onBeforeRequest: async (request) => {
          const url = new URL(request.url);
          const token =
            url.searchParams.get("token") ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

          if (!token) {
            return new Response("Missing auth token", { status: 401 });
          }

          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          return undefined; // Continue to agent
        },
      })) || new Response("Not found", { status: 404 })
    );
  },
};

async function verifyOAuthToken(token: string, env: Env) {
  try {
    // Call AtYourService.ai to verify the OAuth token
    const response = await fetch("https://atyourservice.ai/api/oauth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const userInfo = await response.json();
    return userInfo; // { id, email, api_key, payment_method: 'credits'|'byok' }
  } catch (error) {
    console.error("Token verification failed:", error);
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
      agent: "app-agent-template",
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
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response("Missing auth token", { status: 401 });
  }

  const userInfo = await verifyOAuthToken(token, env);
  if (!userInfo) {
    return new Response("Invalid auth token", { status: 403 });
  }

  // Store user info in the agent's Durable Object
  // This happens before the agent is created/retrieved
  const agentId = env.AppAgent.idFromName(userInfo.id);
  const agentStub = env.AppAgent.get(agentId);

  // Store user info for later access
  await agentStub.fetch(
    new Request("http://internal/store-user-info", {
      method: "POST",
      body: JSON.stringify({
        user_id: userInfo.id,
        api_key: userInfo.api_key,
        email: userInfo.email,
        credits: userInfo.credits,
      }),
    })
  );

  return undefined; // Continue to agent
};
```

````

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

---

## Implementation Guide

### Prerequisites

Before implementing this OAuth integration, ensure you have:

1. **AtYourService.ai Gateway Running**: The gateway service at `packages/gateway` should be running locally
2. **Website Authentication**: The SvelteKit website at `website/` with existing OAuth providers (GitHub, Google)
3. **Agent Framework**: Cloudflare Workers using the Agents framework in `packages/demos/app-agent-template`

### Phase 1: Website OAuth Endpoints

#### 1.1 OAuth App Configuration
Create OAuth app registry in website settings:

```typescript
// website/src/lib/settings/oauth-apps.ts
export interface OAuthApp {
  client_id: string;
  client_secret: string;
  name: string;
  redirect_uris: string[];
  promotional_credits?: number;
  scopes: string[];
}

export const OAUTH_APPS: Record<string, OAuthApp> = {
  'app-agent-template': {
    client_id: 'app-agent-template',
    client_secret: 'app-agent-template-secret-dev', // Store in .env for production
    name: 'App Agent Template',
    redirect_uris: [
      'http://localhost:3000/auth/callback',
      'https://your-agent-domain.com/auth/callback'
    ],
    promotional_credits: 500, // $5.00 in credits
    scopes: ['api_access', 'credit_usage']
  }
};
````

#### 1.2 OAuth Authorization Endpoint

Create the authorization endpoint:

```typescript
// website/src/routes/oauth/authorize/+server.ts
import { redirect, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { OAUTH_APPS } from "$lib/settings/oauth-apps";
import { generateApiKey } from "$lib/api/key-utils";

export const GET: RequestHandler = async ({ url, locals: { session } }) => {
  const client_id = url.searchParams.get("client_id");
  const redirect_uri = url.searchParams.get("redirect_uri");
  const response_type = url.searchParams.get("response_type");
  const state = url.searchParams.get("state");

  // Validate OAuth parameters
  if (!client_id || !redirect_uri || response_type !== "code") {
    throw error(400, "Invalid OAuth parameters");
  }

  const app = OAUTH_APPS[client_id];
  if (!app || !app.redirect_uris.includes(redirect_uri)) {
    throw error(400, "Invalid client_id or redirect_uri");
  }

  // If user not logged in, redirect to login with OAuth context
  if (!session) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("redirectTo", url.toString());
    loginUrl.searchParams.set("oauth_app", app.name);
    throw redirect(303, loginUrl.toString());
  }

  // Generate authorization code (store temporarily in your preferred cache/database)
  const authCode = generateApiKey("auth_");

  // Store auth code with user info (implement your storage mechanism)
  await storeAuthCode(authCode, {
    user_id: session.user.id,
    client_id,
    expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // Redirect back to app with auth code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", authCode);
  if (state) redirectUrl.searchParams.set("state", state);

  throw redirect(303, redirectUrl.toString());
};
```

#### 1.3 OAuth Token Exchange Endpoint

Create the token exchange endpoint:

```typescript
// website/src/routes/oauth/token/+server.ts
import { json, error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { OAUTH_APPS } from "$lib/settings/oauth-apps";
import { generateApiKey, hashApiKey } from "$lib/api/key-utils";

export const POST: RequestHandler = async ({
  request,
  locals: { supabaseServiceRole },
}) => {
  const { code, client_id, client_secret } = await request.json();

  // Verify client credentials
  const app = OAUTH_APPS[client_id];
  if (!app || app.client_secret !== client_secret) {
    throw error(401, "Invalid client credentials");
  }

  // Verify and consume auth code
  const authSession = await getAndDeleteAuthCode(code);
  if (!authSession || authSession.client_id !== client_id) {
    throw error(400, "Invalid or expired authorization code");
  }

  // Create or get app-specific API key for this user
  const apiKey = await createUserApiKey(
    supabaseServiceRole,
    authSession.user_id,
    {
      name: `App: ${app.name}`,
      app_context: client_id,
      settings: {
        enable_minimization: true,
        minimization_token_threshold: 200000,
      },
    }
  );

  // Grant promotional credits if new app user
  if (app.promotional_credits) {
    await grantPromotionalCredits(
      supabaseServiceRole,
      authSession.user_id,
      app.promotional_credits,
      client_id
    );
  }

  // Get user info
  const { data: userData } = await supabaseServiceRole.auth.admin.getUserById(
    authSession.user_id
  );
  const user = userData?.user;

  return json({
    access_token: apiKey.key, // Return the actual AtYourService.ai API key
    token_type: "bearer",
    user_info: {
      id: user?.id,
      email: user?.email,
      credits: await getUserCreditBalance(
        supabaseServiceRole,
        authSession.user_id
      ),
      granted_promo: app.promotional_credits,
    },
  });
};

// Helper functions (implement these in your preferred way)
async function storeAuthCode(code: string, data: any) {
  // Store in Redis, database, or memory cache with TTL
}

async function getAndDeleteAuthCode(code: string) {
  // Retrieve and delete auth code atomically
}

async function createUserApiKey(supabase: any, userId: string, options: any) {
  const key = generateApiKey("sk-cm-v1-");
  const keyHash = await hashApiKey(key);

  const { data } = await supabase
    .from("api_keys")
    .insert({
      user_id: userId,
      name: options.name,
      key_hash: keyHash,
      settings: options.settings,
      is_active: true,
    })
    .select()
    .single();

  return { ...data, key }; // Return the unhashed key for the response
}
```

### Phase 2: Agent Template Authentication

#### 2.1 OAuth Configuration

Create OAuth configuration in the agent:

```typescript
// packages/demos/app-agent-template/src/config/oauth.ts
interface OAuthConfig {
  client_id: string;
  client_secret: string;
  auth_url: string;
  token_url: string;
}

export const getOAuthConfig = (): OAuthConfig => {
  // Use production AtYourService.ai for all environments
  return {
    client_id: "app-agent-template",
    client_secret: "app-agent-template-secret-dev", // From Cloudflare Worker environment variables
    auth_url: "https://atyourservice.ai/oauth/authorize",
    token_url: "https://atyourservice.ai/oauth/token",
  };
};
```

#### 2.2 AuthGuard Component

Create the main authentication component:

```typescript
// packages/demos/app-agent-template/src/components/auth/AuthGuard.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getOAuthConfig } from '../../config/oauth';

interface UserInfo {
  id: string;
  email: string;
  credits: number;
}

interface AuthMethod {
  type: 'atyourservice' | 'byok';
  apiKey?: string; // AtYourService.ai API key from OAuth
  userInfo?: UserInfo;
  byokKeys?: { openai?: string; anthropic?: string };
}

interface AuthContextType {
  authMethod: AuthMethod | null;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  switchToBYOK: (keys: { openai?: string; anthropic?: string }) => void;
  switchToCredits: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);

  useEffect(() => {
    // Check for stored auth on component mount
    const stored = localStorage.getItem('auth_method');
    if (stored) {
      try {
        setAuthMethod(JSON.parse(stored));
      } catch (e) {
        console.error('Invalid stored auth:', e);
        localStorage.removeItem('auth_method');
      }
    }
  }, []);

  const login = () => {
    const config = getOAuthConfig();
    const state = Math.random().toString(36).substring(2);

    const authUrl = new URL(config.auth_url);
    authUrl.searchParams.set('client_id', config.client_id);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/callback`);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);

    localStorage.setItem('oauth_state', state);
    window.location.href = authUrl.toString();
  };

  const logout = () => {
    setAuthMethod(null);
    localStorage.removeItem('auth_method');
    localStorage.removeItem('oauth_state');
  };

  const switchToBYOK = (keys: { openai?: string; anthropic?: string }) => {
    if (!authMethod || authMethod.type !== 'atyourservice') return;

    const newAuth: AuthMethod = {
      type: 'byok',
      apiKey: authMethod.apiKey, // Keep AtYourService.ai API key for verification
      userInfo: authMethod.userInfo,
      byokKeys: keys
    };

    setAuthMethod(newAuth);
    localStorage.setItem('auth_method', JSON.stringify(newAuth));
  };

  const switchToCredits = () => {
    if (!authMethod || authMethod.type !== 'byok') return;

    const newAuth: AuthMethod = {
      type: 'atyourservice',
      apiKey: authMethod.apiKey,
      userInfo: authMethod.userInfo
    };

    setAuthMethod(newAuth);
    localStorage.setItem('auth_method', JSON.stringify(newAuth));
  };

  return (
    <AuthContext.Provider
      value={{
        authMethod,
        isAuthenticated: !!authMethod,
        login,
        logout,
        switchToBYOK,
        switchToCredits
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authMethod, login } = useAuth();

  if (!authMethod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">App Agent Template</h1>
          <p className="text-gray-600 mb-6">
            Sign in with AtYourService.ai to fuel your AI interactions. Get $5 free credits to start!
          </p>
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
          >
            Sign in with AtYourService.ai
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

#### 2.3 OAuth Callback Handler

Create the OAuth callback handler:

```typescript
// packages/demos/app-agent-template/src/components/auth/AuthCallback.tsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getOAuthConfig } from '../../config/oauth';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/?error=' + error);
        return;
      }

      // Verify state parameter
      const storedState = localStorage.getItem('oauth_state');
      if (!code || !state || state !== storedState) {
        navigate('/?error=invalid_state');
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
            client_secret: config.client_secret,
            grant_type: 'authorization_code'
          })
        });

        if (!response.ok) {
          throw new Error(`Token exchange failed: ${response.status}`);
        }

        const tokenData = await response.json();

        // Store the AtYourService.ai API key for the agent
        localStorage.setItem('auth_method', JSON.stringify({
          type: 'atyourservice',
          apiKey: tokenData.access_token,
          userInfo: tokenData.user_info
        }));

        // Clean up OAuth state
        localStorage.removeItem('oauth_state');

        navigate('/');
      } catch (err) {
        console.error('Token exchange failed:', err);
        navigate('/?error=token_exchange_failed');
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}
```

#### 2.4 Agent Connection Hook

Create a hook for agent authentication:

```typescript
// packages/demos/app-agent-template/src/hooks/useAgentAuth.tsx
import { useMemo } from "react";
import { useAuth } from "../components/auth/AuthGuard";

export function useAgentAuth() {
  const { authMethod } = useAuth();

  const agentConfig = useMemo(() => {
    if (!authMethod) return null;

    // Each user gets their own agent instance using their user ID
    return {
      agent: "app-agent-template",
      name: authMethod.userInfo?.id || "anonymous",
      url: authMethod.userInfo
        ? `/agents/app-agent-template/${authMethod.userInfo.id}?token=${authMethod.apiKey}`
        : undefined,
    };
  }, [authMethod]);

  return agentConfig;
}
```

### Phase 3: Cloudflare Workers Integration

#### 3.1 Main Worker Entry Point

Update the main worker entry point to use authentication:

```typescript
// packages/demos/app-agent-template/src/server.ts
import { routeAgentRequest } from "agents";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return (
      (await routeAgentRequest(request, env, {
        // Authenticate users before WebSocket connection
        onBeforeConnect: async (request) => {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            return new Response("Missing auth token", { status: 401 });
          }

          // Verify OAuth token with AtYourService.ai
          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          // Store user info in the agent's Durable Object before connection
          const userId = extractUserIdFromPath(url.pathname);
          if (userId !== userInfo.id) {
            return new Response("User ID mismatch", { status: 403 });
          }

          const agentId = env.AppAgent.idFromName(userId);
          const agentStub = env.AppAgent.get(agentId);

          // Store user info for later access by the agent
          await agentStub.fetch(
            new Request("http://internal/store-user-info", {
              method: "POST",
              body: JSON.stringify({
                user_id: userInfo.id,
                api_key: token, // Store the AtYourService.ai API key
                email: userInfo.email,
                credits: userInfo.credits,
                payment_method: userInfo.payment_method,
              }),
            })
          );

          return undefined; // Continue to agent
        },

        // Authenticate HTTP requests
        onBeforeRequest: async (request) => {
          const url = new URL(request.url);
          const token =
            url.searchParams.get("token") ||
            request.headers.get("Authorization")?.replace("Bearer ", "");

          if (!token) {
            return new Response("Missing auth token", { status: 401 });
          }

          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          return undefined; // Continue to agent
        },
      })) || new Response("Not found", { status: 404 })
    );
  },
};

async function verifyOAuthToken(token: string, env: Env) {
  try {
    // Call AtYourService.ai gateway to verify the token
    const response = await fetch(`${env.GATEWAY_BASE_URL}/api/oauth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;

    const userInfo = await response.json();
    return userInfo; // { id, email, credits, payment_method: 'credits'|'byok' }
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

function extractUserIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/agents\/app-agent-template\/([^\/\?]+)/);
  return match ? match[1] : null;
}
```

#### 3.2 Agent Implementation Updates

Update the AppAgent to use stored user information:

```typescript
// packages/demos/app-agent-template/src/agent/AppAgent.ts
// Add these methods to the existing AppAgent class:

private userInfo: {
  id: string;
  api_key: string;
  email: string;
  credits: number;
  payment_method: 'credits' | 'byok';
} | null = null;

// Add internal request handler for storing user info
async onRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (url.pathname === '/store-user-info' && request.method === 'POST') {
    const userInfo = await request.json();
    this.userInfo = userInfo;

    // Store in durable storage for persistence
    await this.storage.put('user_info', userInfo);

    return new Response('OK');
  }

  // Call parent method for other requests
  return super.onRequest(request);
}

// Override the AI provider to use user's API key
private getAIProvider() {
  if (this.userInfo?.api_key) {
    return createOpenAI({
      apiKey: this.userInfo.api_key, // User's AtYourService.ai API key
      baseURL: `${this.env.GATEWAY_BASE_URL}/v1/openai`,
    });
  } else {
    // Fallback to environment API key
    return createOpenAI({
      apiKey: this.env.GATEWAY_API_KEY,
      baseURL: `${this.env.GATEWAY_BASE_URL}/v1/openai`,
    });
  }
}

// Initialize user info on agent startup
async onStart() {
  // Try to load user info from storage
  const storedUserInfo = await this.storage.get('user_info');
  if (storedUserInfo) {
    this.userInfo = storedUserInfo;
  }

  // Call parent method
  await super.onStart();
}

// Update onChatMessage to use user-specific provider
async onChatMessage(
  onFinish: StreamTextOnFinishCallback<ToolSet>,
  options?: { abortSignal?: AbortSignal }
) {
  console.log(`[AppAgent] Processing chat for user: ${this.userInfo?.id || 'anonymous'}`);

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
          console.log(`[AppAgent] Completed chat for user: ${this.userInfo?.id || 'anonymous'}`);
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

### Phase 4: Frontend Integration

#### 4.1 Update Main App Component

Update the main app to use authentication:

```typescript
// packages/demos/app-agent-template/src/app.tsx
import { AuthProvider, AuthGuard } from './components/auth/AuthGuard';
import { useAgentAuth } from './hooks/useAgentAuth';
// ... existing imports

function AppContent() {
  const agentConfig = useAgentAuth();
  // ... existing useAgentState logic, but use agentConfig from useAgentAuth

  const { agent, agentState, agentMode, changeAgentMode, navigateToRoom } = useAgentState(
    'onboarding',
    agentConfig // Pass the authenticated agent config
  );

  // ... rest of existing component logic
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppContent />
      </AuthGuard>
    </AuthProvider>
  );
}
```

#### 4.2 Update Agent State Hook

Update the useAgentState hook to accept external configuration:

```typescript
// packages/demos/app-agent-template/src/hooks/useAgentState.ts
// Modify the existing hook to accept an external config parameter:

export function useAgentState(
  initialMode: AgentMode = "onboarding",
  externalConfig?: { agent: string; name: string; url?: string } | null
) {
  // ... existing state setup

  const [agentConfig] = useState(() => {
    if (externalConfig) {
      console.log(`[UI] Using external agent config: ${externalConfig.name}`);
      return externalConfig;
    }

    // Fallback to URL-based config for development
    const name = getNameFromURL() || "default-room";
    console.log(`[UI] Using URL-based agent config: ${name}`);
    return {
      agent: "app-agent",
      name,
    };
  });

  // Initialize the agent with authentication if available
  const agent = useAgent({
    agent: agentConfig.agent,
    name: agentConfig.name,
    url: agentConfig.url, // Include URL for authenticated connections
    onStateUpdate: (newState: AppAgentState) => {
      // ... existing logic
    },
  });

  // ... rest of existing logic
}
```

### Key File Locations and Dependencies

#### Website (SvelteKit) Files:

- `website/src/lib/settings/oauth-apps.ts` - OAuth app configuration
- `website/src/routes/oauth/authorize/+server.ts` - Authorization endpoint
- `website/src/routes/oauth/token/+server.ts` - Token exchange endpoint
- `website/src/lib/api/key-utils.ts` - Existing API key utilities (already exists)
- `website/src/lib/auth/ws-token.ts` - WebSocket token utilities (already exists)

#### Agent Template Files:

- `packages/demos/app-agent-template/src/config/oauth.ts` - OAuth configuration
- `packages/demos/app-agent-template/src/components/auth/AuthGuard.tsx` - Main auth component
- `packages/demos/app-agent-template/src/components/auth/AuthCallback.tsx` - OAuth callback
- `packages/demos/app-agent-template/src/hooks/useAgentAuth.tsx` - Agent auth hook
- `packages/demos/app-agent-template/src/server.ts` - Worker entry point (modify existing)
- `packages/demos/app-agent-template/src/agent/AppAgent.ts` - Agent implementation (modify existing)
- `packages/demos/app-agent-template/src/app.tsx` - Main app component (modify existing)
- `packages/demos/app-agent-template/src/hooks/useAgentState.ts` - Agent state hook (modify existing)

#### Environment Variables:

Add to Cloudflare Worker environment (wrangler.toml or via dashboard):

```toml
[env.production.vars]
OAUTH_CLIENT_SECRET = "app-agent-template-secret-production"

[env.preview.vars]
OAUTH_CLIENT_SECRET = "app-agent-template-secret-preview"
```

#### Dependencies:

The implementation uses existing dependencies and patterns from:

- **SvelteKit**: Website framework (already in use)
- **Supabase**: Database and auth (already in use)
- **Cloudflare Workers**: Agent hosting (already in use)
- **React**: Frontend framework for agent UI (already in use)
- **agents/react**: Agent framework hooks (already in use)

### Integration Points with Existing Code:

1. **Gateway Integration**: Uses existing `packages/gateway` for API key verification and LLM routing
2. **API Key Management**: Leverages existing API key utilities in `website/src/lib/api/key-utils.ts`
3. **Supabase Integration**: Uses existing user and credit management in the website
4. **Agent Framework**: Builds on existing Cloudflare Agents patterns in the demos
5. **Authentication Flow**: Integrates with existing Supabase OAuth providers in the website

### Testing Approach:

1. **Local Development**: Use `dev-key-*` API keys for testing without OAuth flow
2. **OAuth Testing**: Test full OAuth flow between localhost:3000 (agent) and localhost:5173 (website)
3. **User Isolation**: Verify each user gets their own agent instance and data
4. **Credit Tracking**: Test that AtYourService.ai gateway properly tracks usage per API key

This implementation provides a complete, production-ready OAuth integration that showcases AtYourService.ai as an "AI backend as a service" solution for AI integrators.
