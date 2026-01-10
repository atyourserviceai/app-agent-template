# Project Migration Plan: User IDs to Project-Based Architecture

## Overview

Migrate from single-user agents to project-based agents with centralized user data.

**Before:** `/agents/app-agent/{userId}` with JWT in agent state
**After:** `/u/{userId}/{projectName}` with JWT only in SQLite

## Related Files

- `CF-AGENTS-ARCHITECTURE.md` - Current architecture
- `MULTIPLE_ROOMS.md` - Previous attempts and lessons
- `SHARING_ARCHITECTURE.md` - Future sharing features
- `src/agent/AppAgent.ts` - Current agent implementation
- `src/hooks/useAgentAuth.tsx` - Current auth hook

## Step-by-Step Migration

### Step 1: Create UserDO Class

**Create:** `src/agent/UserDO.ts`

- Centralized user data storage
- JWT tokens in SQLite only
- Project metadata management
- Same `user_info` table as AppAgent (lines 718-727)

### Step 2: Update Wrangler Config

**File:** `wrangler.jsonc` (lines 15-35)

- Add ProjectAgent and UserDO bindings
- Add migration v3 for ProjectAgent

### Step 3: Remove JWT from AppAgentState

**File:** `src/agent/AppAgent.ts` (lines 224-230)

- Remove `api_key?: string` from userInfo interface

### Step 4: Create ProjectAgent Class

**Create:** `src/agent/ProjectAgent.ts`

- Extends AppAgent
- Agent name format: `{userId}/{projectName}`
- Fetches user data from UserDO
- No JWT in state

### Step 5: Fix AppAgent JWT Access

**File:** `src/agent/AppAgent.ts`

- Update `getAIProvider()` (lines 341-362) to fetch from SQLite
- Update `getBrowserApiKey()` (lines 1191-1201) to fetch from SQLite

### Step 6: Update Auth Hook

**Rename:** `useAgentAuth.tsx` → `useProjectAuth.tsx`

- Change to `agent: "project-agent"`
- Change to `name: "${userId}/${projectName}"`

### Step 7: Update Worker Routing

**File:** `src/worker.ts` (before line 84)

- Add routing for `/u/{userId}/{projectName}` URLs

### Step 8: Update App Components

**File:** `src/app.tsx`

- Import `useProjectAuth` instead of `useAgentAuth`
- Use `useProjectAuth("personal")` on lines 224, 1137

### Step 9: Update Worker Exports

**File:** `src/worker.ts` (lines 5-7)

- Export ProjectAgent and UserDO classes

### Step 10: Update Auth Provider

**File:** `src/components/auth/AuthProvider.tsx`

- Update sync URLs (lines 101-102, 253-254) to use project agents

## Execution Order

Must be done in exact order 1-10 to avoid breaking changes.

## Testing

1. Login works and users get "personal" project
2. No JWT tokens in agent state (check dev tools)
3. AI features work with JWT from SQLite
4. URLs like `/u/{userId}/personal` route correctly

## Security Improvements

✅ JWT tokens removed from agent state
✅ Centralized user data in UserDO
✅ Project-based isolation maintained

## Future Features

After migration:

### Phase A: Core Project Features

- Project Switcher UI
- Username System
- Project creation and management

### Phase B: Sharing & Collaboration

- **Public Project URLs** (Phase 1 sharing)
  - Extend UserDO privacy settings: `private | public | unlisted`
  - Public projects accessible via `/u/{userId}/{projectName}` without auth
  - Read-only mode for shared projects
- **State Snapshots** (Phase 2 sharing)
  - Point-in-time captures of project state
  - Shareable via `/snapshots/{snapshotId}` URLs
  - Optional expiration and chat history inclusion

- **Visual Exports** (Phase 3 sharing)
  - PNG/PDF generation from presentation panel
  - Clean, professional sharing images
  - Shareable via `/share/{imageId}.png` URLs
