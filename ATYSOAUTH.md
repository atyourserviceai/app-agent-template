# AtYourService.ai OAuth Integration Guide

## ✅ **IMPLEMENTATION STATUS - COMPLETE**

The OAuth integration for the app-agent-template is **FULLY FUNCTIONAL** with end-to-end authentication working perfectly.

### **✅ What's Working:**
- Complete authentication flow with AtYourService.ai
- Demo mode for unauthenticated users
- User-specific private agent instances (`/agents/app-agent/{user_id}`)
- Real-time credit balance and user profile
- Zero frontend environment variables needed
- Smart authentication with progressive enhancement

### **✅ Architecture Overview:**
- **OAuth Provider**: Website (SvelteKit) handles authorization and token exchange
- **Agent Template**: React + Cloudflare Workers with authentication hooks
- **Gateway Integration**: User info endpoint and API key verification
- **Perfect Cloudflare Compliance**: Uses `onBeforeConnect` hooks as documented

---

## 🚀 **Adding OAuth to Other Demos (e.g. Superfans)**

### **Current Status: Superfans Demo**

✅ **PARTIALLY IMPLEMENTED** - Basic OAuth integration added to superfans demo:
- Environment variables configured
- Server endpoints added
- Auth components copied
- Basic demo showing authentication status

**TODO**: Complete integration with the existing superfans chat UI (components, hooks, full agent state management)

### **Step 1: Copy Authentication Components**

```bash
# From the core directory, copy auth components
cp -r packages/demos/app-agent-template/src/components/auth packages/demos/superfans/src/components/
cp packages/demos/app-agent-template/src/config/oauth.ts packages/demos/superfans/src/config/
cp packages/demos/app-agent-template/src/hooks/useAgentAuth.tsx packages/demos/superfans/src/hooks/
```

### **Step 2: Add OAuth App to Website**

Add to `website/src/lib/settings/oauth-apps.ts`:

```typescript
export const OAUTH_APPS: Record<string, OAuthApp> = {
  // ... existing apps
  "superfans-demo": {
    name: "Superfans Demo",
    description: "CRM Agent for superfan community management",
    client_id: "superfans-demo",
    client_secret: env.SUPERFANS_DEMO_SECRET,
    redirect_uris: [
      "http://localhost:5274/auth/callback", // Update port as needed
      "https://superfans-demo.atyourservice.ai/auth/callback",
    ],
    scopes: ["agent-fuel", "usage-tracking"],
    promotional_credits: 500,
    auth_url: "https://atyourservice.ai",
    token_url: "https://atyourservice.ai/oauth/token",
  },
};
```

### **Step 2: Environment Variables**

✅ **COMPLETED** - Added to `packages/demos/superfans/wrangler.jsonc`:

```json
{
  "vars": {
    "OAUTH_PROVIDER_BASE_URL": "http://127.0.0.1:45173"
  },
  "env": {
    "staging": {
      "vars": {
        "OAUTH_PROVIDER_BASE_URL": "https://staging.atyourservice.ai"
      }
    },
    "production": {
      "vars": {
        "OAUTH_PROVIDER_BASE_URL": "https://atyourservice.ai"
      }
    }
  }
}
```

### **Step 3: Update Server Entry Point**

✅ **COMPLETED** - Updated `packages/demos/superfans/src/server.ts` with OAuth routes and authentication hooks.

For reference, the key changes needed:

```typescript
import { routeAgentRequest } from "agents";
import { AppAgent } from "./agent";
import { verifyOAuthToken } from "./utils/auth"; // You'll need to copy this too

export { AppAgent };
export { AppAgent as SuperfansAgent };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // OAuth configuration endpoint
    if (url.pathname === '/api/oauth/config') {
      return new Response(JSON.stringify({
        client_id: "superfans-demo",
        auth_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/authorize`,
        token_url: `${env.OAUTH_PROVIDER_BASE_URL}/oauth/token`,
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // User info proxy endpoint
    if (url.pathname === '/api/user/info') {
      const authHeader = request.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const gatewayResponse = await fetch(`${env.GATEWAY_BASE_URL}/v1/user/info`, {
        method: 'GET',
        headers: { 'Authorization': authHeader },
      });

      return new Response(await gatewayResponse.text(), {
        status: gatewayResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check OpenAI key endpoint (existing)
    if (url.pathname === "/check-open-ai-key") {
      const hasApiKey = !!env.GATEWAY_API_KEY;
      return Response.json({ success: hasApiKey });
    }

    if (!env.GATEWAY_API_KEY) {
      console.error("GATEWAY_API_KEY is not set");
      return new Response("GATEWAY_API_KEY is not set", { status: 500 });
    }

    // Add authentication to agent routing
    return (
      (await routeAgentRequest(request, env, {
        cors: true,
        onBeforeConnect: async (request) => {
          const url = new URL(request.url);
          const token = url.searchParams.get("token");

          if (!token) {
            // Allow demo mode for default rooms
            const pathMatch = url.pathname.match(/\/agents\/([^\/]+)\/([^\/\?]+)/);
            if (pathMatch) {
              const [, agentName, roomName] = pathMatch;
              if (roomName !== "default-room" && roomName !== "onboarding" && roomName.length > 10) {
                return new Response("Authentication required for user-specific agents", { status: 401 });
              }
            }
            return undefined; // Allow demo access
          }

          // Verify token for authenticated access
          const userInfo = await verifyOAuthToken(token, env);
          if (!userInfo) {
            return new Response("Invalid auth token", { status: 403 });
          }

          return undefined; // Continue to agent
        },
      })) || new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<Env>;
```

### **Step 4: Test Current Integration**

To test the basic OAuth integration in superfans:

```bash
# 1. Make sure types are regenerated after environment variable changes
cd packages/demos/superfans && pnpm run types

# 2. Start the website for OAuth provider
cd website && pnpm run dev  # Runs on port 45173

# 3. Start the superfans demo
cd packages/demos/superfans && pnpm run dev  # Check the port in the output

# 4. Visit the superfans demo
# You should see the OAuth sign-in screen
# After signing in, it shows authentication status

# 5. Test demo mode by visiting with ?demo=true or similar
```

### **Step 5: Complete Integration (TODO)**

To fully integrate with the existing superfans chat UI:

1. **Update Main App Component** - Integrate AuthProvider/AuthGuard with existing chat interface
2. **Modify useAgentState Hook** - Add externalConfig parameter support
3. **Update Chat Components** - Pass authenticated agent config through component tree
4. **Add User Profile** - Copy UserProfile component from app-agent-template
5. **Test End-to-End** - Verify authenticated vs demo mode functionality

### **Reference Implementation Pattern**

For other demos, follow this pattern:

```typescript
// Main app structure
export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <YourExistingChatComponent />
      </AuthGuard>
    </AuthProvider>
  );
}

// Inside your chat component
function YourExistingChatComponent() {
  const agentConfig = useAgentAuth();
  const { agent, agentState, agentMode, changeAgentMode } = useAgentState(
    "onboarding",
    agentConfig  // Pass authenticated config
  );

  // Rest of your existing logic unchanged
}
```

### **Step 6: Legacy Steps for Full Manual Implementation**

For reference, here are the remaining manual steps if implementing from scratch:

#### **Update Main App Component**

Modify `packages/demos/superfans/src/app.tsx`:

```typescript
import { AuthProvider, AuthGuard } from './components/auth/AuthGuard';
import { useAgentAuth } from './hooks/useAgentAuth';
// ... existing imports

function ChatContent() {
  // Get authenticated agent config
  const agentConfig = useAgentAuth();

  // Pass the authenticated config to useAgentState
  const { agent, agentState, agentMode, changeAgentMode } = useAgentState(
    "onboarding",
    agentConfig
  );

  // ... rest of your existing Chat component logic
  // (keep all the existing UI, hooks, and functionality)

  return (
    // ... existing JSX
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <ChatContent />
      </AuthGuard>
    </AuthProvider>
  );
}
```

### **Step 5: Update Agent State Hook**

Modify `packages/demos/superfans/src/hooks/useAgentState.ts`:

```typescript
export function useAgentState(
  initialMode: AgentMode = "onboarding",
  externalConfig?: { agent: string; name: string; query?: Record<string, string> } | null
) {
  // ... existing state declarations

  const [agentConfig] = useState(() => {
    if (externalConfig) {
      console.log(`[UI] Using external agent config: ${externalConfig.name}`);
      return externalConfig;
    }

    // Fallback to URL-based config for development
    const name = getNameFromURL() || "default-room";
    console.log(`[UI] Using URL-based agent config: ${name}`);
    return {
      agent: "superfans-agent", // Keep your existing agent name
      name,
    };
  });

  // Initialize the agent with authentication support
  const agent = useAgent({
    agent: agentConfig.agent,
    name: agentConfig.name,
    query: agentConfig.query, // Include authentication query params
    onStateUpdate: (newState: AppAgentState) => {
      // ... existing onStateUpdate logic
    },
  });

  // ... rest of existing logic unchanged
}
```

### **Step 6: Copy Authentication Utilities**

Copy the auth utilities:

```bash
cp packages/demos/app-agent-template/src/utils/auth.ts packages/demos/superfans/src/utils/
```

### **Step 7: Environment Variables**

Add to `packages/demos/superfans/.dev.vars`:

```bash
OAUTH_PROVIDER_BASE_URL=http://127.0.0.1:45173
```

Add to `packages/demos/superfans/wrangler.toml`:

```toml
[env.development.vars]
OAUTH_PROVIDER_BASE_URL = "http://127.0.0.1:45173"

[env.production.vars]
OAUTH_PROVIDER_BASE_URL = "https://atyourservice.ai"
```

### **Step 8: Add OAuth App Secret to Website**

Add to `website/.env`:

```bash
SUPERFANS_DEMO_SECRET=your-secret-here
```

### **Step 9: Test the Integration**

1. Start the website: `cd website && pnpm run dev`
2. Start the superfans demo: `cd packages/demos/superfans && pnpm run dev`
3. Visit the superfans demo URL
4. You should see the OAuth landing page
5. Click "Sign in with AtYourService.ai" to test the flow

---

## 🎯 **Key Benefits of This Architecture**

1. **Zero Auth Infrastructure**: AtYourService.ai handles all user management, billing, and API keys
2. **User Isolation**: Each authenticated user gets private agent instances
3. **Demo Mode**: Unauthenticated users can explore without barriers
4. **Progressive Enhancement**: Authentication adds private features seamlessly
5. **Environment Agnostic**: Frontend works across dev/staging/production without config changes
6. **Real Usage Tracking**: Gateway automatically handles verification and billing

This showcases AtYourService.ai as a complete "AI backend as a service" solution, allowing AI integrators to focus on building great agents rather than authentication and billing infrastructure.
