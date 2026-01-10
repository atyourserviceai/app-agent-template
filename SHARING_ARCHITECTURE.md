# App State Sharing Architecture (Simple & Modern)

## Overview

Design for sharing app states leveraging the current UserDO + ProjectAgent architecture. This replaces the complex idea-specific sharing with flexible, multi-format sharing approaches.

## Current Architecture Integration

With the new UserDO + ProjectAgent system (`/u/{userId}/{projectName}`), we can implement multiple sharing approaches:

1. **Public Project URLs** - Share entire project state via public read-only access
2. **State Snapshots** - Point-in-time captures of project state for sharing
3. **Visual Exports** - PNG/image generation from presentation panel content

### Architecture Diagram

```
Private Project:                 Public Sharing Options:
/u/john-doe/saas-ideas          ┌─ /u/john-doe/saas-ideas?public=true (Public URL)
         ↓                      │
   ProjectAgent                 ├─ /snapshots/abc123def (State Snapshot)
   (authenticated)              │
         ↓                      └─ /share/abc123def.png (Visual Export)
   Full App State
   Chat + Presentation
   Private Access              → Public/Anonymous Access
```

## Sharing Approaches

### 1. Public Project URLs (Simplest)

Leverage the existing UserDO privacy settings to make projects publicly accessible:

```typescript
// UserDO already has privacy column in projects table
interface ProjectMetadata {
  name: string;
  display_name: string;
  privacy: "private" | "public" | "unlisted"; // Extend current privacy options
  description?: string;
  created_at: string;
}

// In UserDO.ts - extend existing handleGetProject
private async handleGetProject(request: Request): Promise<Response> {
  // ... existing code ...
  const project = projectRows[0];

  // Check if public access is allowed
  if (project.privacy !== "private") {
    // Return project metadata for public/unlisted projects
    return new Response(JSON.stringify({ project }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // For private projects, require authentication (existing logic)
  // ...
}
```

**Public URL Pattern:**

- `/u/{userId}/{projectName}` - Works for public projects without authentication
- `/u/{userId}/{projectName}?view=readonly` - Explicit read-only mode

### 2. State Snapshots (Flexible)

Extend the current ProjectAgent to support state snapshots:

```typescript
// Add to ProjectAgent (extends AppAgent)
interface StateSnapshot {
  snapshot_id: string;
  project_name: string;
  app_state: AppAgentState; // Use existing state structure
  chat_history?: Message[]; // Optional chat inclusion
  created_at: string;
  view_count: number;
  expires_at?: string;
}

class SnapshotRegistry extends DurableObject {
  // Simple key-value storage for snapshots
  async createSnapshot(
    projectName: string,
    appState: AppAgentState,
    options: {
      includeChat?: boolean;
      expiresInDays?: number;
    } = {}
  ): Promise<string> {
    const snapshotId = generateId(); // Use existing generateId from ai package

    const snapshot: StateSnapshot = {
      snapshot_id: snapshotId,
      project_name: projectName,
      app_state: this.sanitizeState(appState), // Remove sensitive data
      chat_history: options.includeChat
        ? await this.getChatHistory()
        : undefined,
      created_at: new Date().toISOString(),
      view_count: 0,
      expires_at: options.expiresInDays
        ? new Date(
            Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000
          ).toISOString()
        : undefined
    };

    await this.ctx.storage.put(snapshotId, snapshot);
    return snapshotId;
  }

  private sanitizeState(state: AppAgentState): AppAgentState {
    // Remove sensitive user info but keep functional state
    return {
      ...state,
      userInfo: undefined // Remove user authentication info
    };
  }
}
```

### 3. Visual Exports (Clean Sharing)

Generate PNG/image exports from the presentation panel content:

```typescript
// Add to ProjectAgent
async generateVisualShare(format: "png" | "pdf" = "png"): Promise<string> {
  // Get current app state and render presentation view
  const state = await this.getState();

  if (format === "png") {
    // Use headless browser or canvas to render presentation panel
    // Return URL to generated image: /share/{id}.png
    return await this.renderToPNG(state);
  }

  // Future: PDF export, etc.
}

private async renderToPNG(state: AppAgentState): Promise<string> {
  // Implementation would use:
  // 1. Puppeteer/Playwright to render the presentation component
  // 2. Or Canvas API to generate visualization
  // 3. Store in R2/Storage and return shareable URL

  const imageId = generateId();
  // ... rendering logic ...
  return `/share/${imageId}.png`;
}
```

## Implementation Strategy

### Phase 1: Public Project URLs (Immediate)

**Minimal changes to existing codebase:**

1. **Extend UserDO privacy options**:

   ```typescript
   // In UserDO.ts - update projects table schema
   privacy: "private" | "public" | "unlisted"; // Add public/unlisted options
   ```

2. **Update project routing**:

   ```typescript
   // In worker.ts - modify existing /u/{userId}/{projectName} routing
   if (url.pathname.startsWith("/u/")) {
     // Check if project is public before requiring authentication
     const isPublicProject = await checkProjectPrivacy(userId, projectName);
     if (isPublicProject) {
       // Allow unauthenticated access in read-only mode
     }
   }
   ```

3. **Add privacy control UI**:
   ```tsx
   // In project settings
   <select value={privacy} onChange={setPrivacy}>
     <option value="private">Private (owner only)</option>
     <option value="public">Public (anyone can view)</option>
     <option value="unlisted">Unlisted (shareable link)</option>
   </select>
   ```

### Phase 2: State Snapshots (Later)

1. **Add SnapshotRegistry DO** to wrangler.jsonc
2. **Extend ProjectAgent** with snapshot creation methods
3. **Add snapshot UI** - "Create snapshot" button in project

### Phase 3: Visual Exports (Future)

1. **Headless browser setup** for rendering
2. **R2 storage** for generated images
3. **Export UI** in presentation panel

## Benefits of This Architecture

### 🚀 **Leverages Existing Infrastructure**

- Uses current UserDO + ProjectAgent architecture
- Minimal new code required for Phase 1
- Built on proven project isolation patterns

### 🔒 **Flexible Privacy Controls**

- **Private**: Owner-only access (existing behavior)
- **Public**: Anyone can view, discoverable
- **Unlisted**: Shareable link, not discoverable

### ⚡ **Multiple Sharing Formats**

- **Live URLs**: Always up-to-date project state
- **Snapshots**: Point-in-time captures that don't change
- **Visual Exports**: Clean, professional sharing images

### 🛡️ **Security-First Design**

- State sanitization removes sensitive user data
- Read-only access for shared content
- Optional expiration for snapshots

### 🔧 **Implementation-Simple**

- Phase 1 requires only privacy setting changes
- Phases 2-3 are optional enhancements
- Each phase is independently valuable

## Recommended Implementation Priority

**Focus Order:**

1. **Project architecture migration** (current priority per PLAN.md)
2. **Phase 1: Public URLs** (immediate sharing capability)
3. **Phase 2: State snapshots** (advanced sharing options)
4. **Phase 3: Visual exports** (professional presentation sharing)

## Key Simplifications from Previous Plan

### ❌ **What We Simplified**

- Removed idea-specific sharing complexity
- No separate "snapshot" entity management
- Leverages existing UserDO privacy system
- No anonymous sharing (uses project owner context)

### ✅ **What We Kept**

- Clean, shareable URLs
- Privacy controls (private/public/unlisted)
- Multiple sharing formats (live/snapshot/visual)
- Read-only sharing access

This sharing architecture integrates seamlessly with the current UserDO + ProjectAgent system, providing immediate value with minimal implementation overhead.
