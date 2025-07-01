# OAuth Authentication in App Agent Template

This document explains how OAuth authentication works in the App Agent Template, including token handling, database synchronization, and automatic retry mechanisms.

## Overview

The App Agent Template uses OAuth 2.0 flow with AI @ Your Service to authenticate users and manage API keys for AI requests. The implementation includes automatic token refresh capabilities to handle token expiration gracefully.

## Authentication Flow

### 1. OAuth Setup

- Users initiate OAuth flow through the frontend
- OAuth provider validates credentials and issues tokens
- Tokens are stored in the agent's SQLite database

### 2. WebSocket Connection

- Client connects to agent with OAuth token in URL parameters
- Server validates token with OAuth provider in `onBeforeConnect`
- Connection established if token is valid

### 3. Agent Initialization

- Agent loads user info from database on connection
- May contain stale token if database hasn't been updated recently
- Automatic refresh mechanism handles token staleness

## Token Synchronization

### Problem: Database vs. Connection Token Mismatch

The agent can experience token synchronization issues:

1. **WebSocket Connection**: Uses current/fresh token from URL
2. **Database Storage**: May contain older/stale token
3. **AI Requests**: Use token from database → potential 403 errors

### Solution: Automatic Token Refresh with Retry Logic

The agent implements automatic token refresh when 403 errors occur:

```typescript
// In onChatMessage method
while (retryCount <= maxRetries) {
  try {
    result = streamText({
      model,
      // ... other options
      onError: async (error: any) => {
        if (error?.status === 403 && retryCount < maxRetries) {
          const refreshed = await this.refreshTokenOnError();
          if (refreshed) {
            return; // Retry in outer loop
          }
        }
        throw error;
      },
    });
    break; // Success
  } catch (error: any) {
    if (error?.status === 403 && retryCount < maxRetries) {
      const refreshed = await this.refreshTokenOnError();
      if (refreshed) {
        retryCount++;
        // Get fresh AI provider with new token
        const refreshedOpenai = this.getAIProvider();
        model = refreshedOpenai("gpt-4.1-2025-04-14");
        continue; // Retry
      }
    }
    throw error;
  }
}
```

## Key Components

### 1. Server Authentication (`src/server.ts`)

```typescript
async onBeforeConnect(url: URL, env: Env) {
  const token = url.searchParams.get("token");
  if (!token) {
    return false;
  }

  try {
    // Validate token with OAuth provider
    const userInfo = await validateOAuthToken(token, env);
    console.log(`[Auth] ✅ Token validated for user: ${userInfo.id}`);
    return true;
  } catch (error) {
    console.error("[Auth] ❌ Token validation failed:", error);
    return false;
  }
}
```

### 2. Agent Connection Handler (`src/agent/AppAgent.ts`)

```typescript
async onConnect(connection: Connection) {
  console.log("[AppAgent] Client connected");

  // Load user info from database (may be stale)
  await this.loadUserInfo();

  const state = this.state as AppAgentState;
  if (state.userInfo) {
    console.log(`[AppAgent] ✅ User authenticated: ${state.userInfo.id}`);
  }
}
```

### 3. Token Refresh Logic

```typescript
async refreshTokenOnError() {
  try {
    const state = this.state as AppAgentState;
    const currentApiKey = state.userInfo?.api_key;

    if (!currentApiKey) {
      return false;
    }

    // Try to fetch fresh user info with current token
    await this.fetchUserInfoFromOAuth(currentApiKey);

    // Check if token was actually updated
    const newState = this.state as AppAgentState;
    const newApiKey = newState.userInfo?.api_key;

    if (newApiKey && newApiKey !== currentApiKey) {
      console.log(`[AppAgent] ✅ Token refreshed`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[AppAgent] Error during token refresh:", error);
    return false;
  }
}
```

## Database Schema

### User Info Table

```sql
CREATE TABLE IF NOT EXISTS user_info (
  user_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  email TEXT NOT NULL,
  credits REAL NOT NULL,
  payment_method TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

## Error Handling

### 403 Forbidden Errors

- Automatically detected in `onChatMessage` and `onError` handlers
- Triggers token refresh attempt
- Maximum 1 retry to prevent infinite loops
- Falls back to error message if refresh fails

### Token Validation Failures

- Logged with detailed error information
- Connection rejected if token invalid
- User must re-authenticate through OAuth flow

## Security Considerations

### No Global State

- Tokens are never stored in global variables
- Each agent instance maintains its own token state
- Prevents cross-user token contamination in Cloudflare Workers

### Token Redaction in Logs

- API keys shown as: `sk-oauth-c2c4ccd565e8...4ce31bc4a24b`
- First 20 characters + last 8 characters visible
- Prevents accidental token exposure in logs

### Automatic Cleanup

- Stale tokens automatically refreshed on use
- Database updated with fresh tokens when available
- Graceful degradation if refresh fails

## Troubleshooting

### Common Issues

1. **"No user API key available"**
   - User not authenticated
   - OAuth flow incomplete
   - Check WebSocket connection parameters

2. **403 Forbidden on AI requests**
   - Token expired or invalid
   - Automatic refresh should handle this
   - Check logs for refresh attempt results

3. **Connection rejected**
   - Invalid OAuth token
   - Token validation failed with provider
   - User needs to re-authenticate

### Debug Logging

Enable detailed logging to trace authentication flow:

```typescript
// Server logs
console.log("[Auth] Token validation attempt");
console.log("[Auth] ✅ Token validated for user: ${userInfo.id}");

// Agent logs
console.log("[AppAgent] Client connected");
console.log("[AppAgent] ✅ User authenticated: ${state.userInfo.id}");
console.log("[AppAgent] API key being used: ${redactedApiKey}");
console.log("[AppAgent] Token refresh attempt due to 403 error");
```

## Integration with AI @ Your Service

The agent integrates with AI @ Your Service gateway for:

- Token validation
- User info retrieval
- Credit management
- API key routing

All AI requests are routed through the gateway using user-specific API keys, ensuring proper billing and access control.
