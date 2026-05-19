# Project-Based Architecture Design Document

## Overview

This document outlines the design and implementation plan for a project-based system that allows users to create separate spaces for exploring and contrasting different startup ideas while maintaining clean, shareable URLs.

## Goal

Enable users to organize their startup idea exploration into separate projects while maintaining:

- Single authentication source
- Independent project spaces with separate chat/assessment state
- Clean URLs: `/profiles/{username}/{project-name}`
- Shareable idea snapshots: `/ideas/{snapshot-id}`

## Architecture Decisions

### ✅ Approved Architecture: Project-Based Isolation

The final architecture that solves all previous issues:

```
URL: /profiles/john-doe/saas-ideas
         ↓
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   UserDO        │    │ ProjectAgent    │
│                 │    │   (john-doe)    │    │   (john-doe/    │
│ - Project       │───▶│ - Username      │───▶│    saas-ideas)  │
│   Switcher      │    │ - Profile Data  │    │ - Chat State    │
│ - Auth State    │    │ - Project List  │    │ - Ideas Data    │
└─────────────────┘    │ - Permissions   │    │ - Assessment    │
                       └─────────────────┘    └─────────────────┘
```

**Key Principles:**

1. **UserDO**: User profile, username/handle, project metadata
2. **ProjectAgent**: Independent DO for each project (extends AppAgent)
3. **Clean URLs**: `/profiles/{username}/{project-name}` pattern
4. **Complete Isolation**: Each project has independent state and chat history

## Previous Implementation Attempts & Lessons Learned

### Key Issues with Room-Based Approach ❌

**Problems Encountered:**

- Complex room synchronization and authentication
- React hooks rules violations (conditional `useAgentChat` calls)
- Agent framework limitations (agents/ai-react expects valid agent always)
- Mixed SQL API usage between different DO types
- Security vulnerabilities with shared unauthenticated agents

**Critical Lesson:**
The agents framework and React patterns work best with **independent, isolated agents** rather than complex room-switching within a single agent.

## Why Project-Based Architecture Solves These Issues ✅

### Solution Benefits:

1. **No Conditional Hooks**: Each project = independent agent, always valid
2. **Simple Authentication**: One auth flow, project-specific routing
3. **Clean Separation**: UserDO for metadata, ProjectAgent for chat/assessment
4. **Consistent SQL**: All ProjectAgents use same AIChatAgent framework
5. **Security**: No shared agents, each project completely isolated

### URL Examples:

- **Live Projects**: `/profiles/john-doe/saas-ideas`
- **Idea Snapshots**: `/ideas/abc123def456`

## Implementation Plan

### Phase 1: Foundation (Small, Simple Changes)

1. **Create UserDO**: Username/handle system, project metadata
2. **Create ProjectAgent**: Extend existing AppAgent with project-specific features
3. **Update routing**: Handle `/profiles/{username}/{project-name}` pattern
4. **Migration**: Move existing data to "personal" project

### Phase 2: User Experience

1. **Project Switcher**: Header navigation between projects
2. **Project Creation**: UI flow for creating new projects
3. **Username Setup**: First-time user username selection

### Phase 3: Idea Snapshots (Later)

1. **Snapshot Creation**: "Share this idea" functionality
2. **Snapshot Viewing**: Standalone `/ideas/{snapshot-id}` pages
3. **Privacy Controls**: Public vs private project settings

## Files To Create/Modify

### New Files:

- `src/agent/UserDO.ts` - User profile and project metadata
- `src/agent/ProjectAgent.ts` - Extends AppAgent for individual projects
- `src/hooks/useProjectAuth.ts` - Project-based agent connections
- `src/components/ProjectSwitcher.tsx` - Header navigation between projects
- `src/components/SnapshotRegistry.ts` - For idea snapshot sharing (Phase 3)

### Modified Files:

- `src/worker.ts` - Add `/profiles/{username}/{project}` routing
- `src/app.tsx` - Update for project-based navigation
- `wrangler.jsonc` - Add ProjectAgent and UserDO bindings
- `src/hooks/useAgentAuth.tsx` → `useProjectAuth.tsx`

## Key Decisions

1. **Projects over Rooms**: Independent agents, not complex room switching
2. **Username System**: Clean URLs with user handles (`/profiles/john-doe/saas-ideas`)
3. **Dual Sharing**: Live projects + static idea snapshots
4. **Privacy Levels**: Private (owner only) and Public (read-only for others)
5. **Small Changes**: Incremental implementation, focus on stability

## Implementation Status ✅

**COMPLETED (Jan 2025)**: The critical architectural fixes have been successfully implemented:

### Fixed Issues:

1. **✅ React Hooks Violations**: Resolved conditional `useAgentChat` calls by implementing proper authentication guards in `ProjectTab` components
2. **✅ Agent Validation Errors**: Fixed constructor validation that was using internal agent IDs instead of project-specific names
3. **✅ Authentication Architecture**: Implemented centralized JWT storage in UserDO with proper security (JWT clearing on logout)
4. **✅ Security Vulnerabilities**: Eliminated shared unauthenticated agents through conditional rendering

### Key Architecture Changes:

- **Constructor Validation**: Removed blocking validation from `AppAgent` constructors (used internal hash IDs)
- **Request-Level Validation**: Preserved proper validation in `onRequest` methods (uses real agent names)
- **Centralized JWT Storage**: `AuthCallback` → `/api/store-user-info` → `UserDO` → project agents retrieve via `getJWTFromUserDO()`
- **Security**: Added `/api/clear-jwt` route for proper JWT cleanup on logout
- **Conditional Rendering**: Agent hooks only called when authenticated via `ProjectTab` guards

## Conclusion

The **project-based architecture** solves all the issues encountered with room-based approaches by embracing the agents framework's strengths rather than fighting against them. Each project is a completely independent agent, eliminating authentication sync, React hooks issues, and security vulnerabilities.

**Status**: ✅ Core architectural issues resolved. Ready for Phase 1 UserDO implementation for project metadata management.
