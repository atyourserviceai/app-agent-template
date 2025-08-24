import { DurableObject } from "cloudflare:workers";

// User profile information (stored centrally in UserDO)
interface UserProfile {
  user_id: string;
  api_key: string; // JWT token (stored only in SQLite, never in state)
  email: string;
  credits: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
}

// Project metadata for organizing user's work
interface ProjectMetadata {
  name: string; // "personal", "saas-ideas", etc.
  display_name: string; // "Personal", "SaaS Ideas", etc.
  privacy: "private" | "public";
  created_at: string;
  description?: string;
}

/**
 * UserDO: Centralized user data management
 *
 * Responsibilities:
 * - Store JWT tokens in SQLite (not in state for security)
 * - Manage user profile information
 * - Handle project metadata and permissions
 * - Provide authentication info to ProjectAgents
 */
export class UserDO extends DurableObject {
  private sql: any; // SQL storage interface

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.initializeTables();
  }

  private async initializeTables() {
    try {
      // User authentication and billing info table (same schema as AppAgent)
      await this.sql.exec(`
        CREATE TABLE IF NOT EXISTS user_info (
          user_id TEXT PRIMARY KEY,
          api_key TEXT NOT NULL,
          email TEXT NOT NULL,
          credits REAL NOT NULL,
          payment_method TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Project metadata table for organizing user work
      await this.sql.exec(`
        CREATE TABLE IF NOT EXISTS projects (
          name TEXT PRIMARY KEY,
          display_name TEXT NOT NULL,
          privacy TEXT NOT NULL DEFAULT 'private',
          description TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log("UserDO: Tables initialized successfully");
    } catch (error) {
      console.error("UserDO: Failed to initialize tables:", error);
    }
  }

  // HTTP request handler for UserDO operations
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (request.method === "POST" && path === "/store-user-info") {
        return await this.handleStoreUserInfo(request);
      }

      if (request.method === "GET" && path === "/get-user-info") {
        return await this.handleGetUserInfo(request);
      }

      if (request.method === "POST" && path === "/create-project") {
        return await this.handleCreateProject(request);
      }

      if (request.method === "GET" && path === "/list-projects") {
        return await this.handleListProjects(request);
      }

      if (request.method === "GET" && path === "/get-project") {
        return await this.handleGetProject(request);
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("UserDO: Request handler error:", error);
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Store user authentication and profile information
  private async handleStoreUserInfo(request: Request): Promise<Response> {
    const userInfo = (await request.json()) as UserProfile;

    try {
      // Store user info with JWT token in SQLite only
      await this.sql.exec(`
        INSERT INTO user_info (user_id, api_key, email, credits, payment_method)
        VALUES ('${userInfo.user_id}', '${userInfo.api_key}', '${userInfo.email}', ${userInfo.credits}, '${userInfo.payment_method}')
        ON CONFLICT(user_id) DO UPDATE SET
          api_key = '${userInfo.api_key}',
          email = '${userInfo.email}',
          credits = ${userInfo.credits},
          payment_method = '${userInfo.payment_method}',
          updated_at = CURRENT_TIMESTAMP
      `);

      // Create default "personal" project if it doesn't exist
      await this.sql.exec(`
        INSERT INTO projects (name, display_name, privacy, description)
        VALUES ('personal', 'Personal', 'private', 'Your personal workspace')
        ON CONFLICT(name) DO NOTHING
      `);

      console.log(`UserDO: Stored user info for ${userInfo.user_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "User info stored successfully",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("UserDO: Failed to store user info:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to store user info",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Get user profile (without JWT token in response for security)
  private async handleGetUserInfo(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "user_id parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const userResult = await this.sql.exec(`
        SELECT user_id, email, credits, payment_method, created_at, updated_at
        FROM user_info
        WHERE user_id = '${userId}'
      `);

      const userRows = [...userResult];
      if (userRows.length === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Return user info WITHOUT JWT token for security
      const userInfo = userRows[0] as Omit<UserProfile, "api_key">;

      return new Response(JSON.stringify({ user: userInfo }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("UserDO: Failed to get user info:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to get user info",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Get JWT token for authentication (internal use only)
  async getJWTToken(userId: string): Promise<string | null> {
    try {
      const tokenResult = await this.sql.exec(`
        SELECT api_key
        FROM user_info
        WHERE user_id = '${userId}'
      `);

      const tokenRows = [...tokenResult];
      if (tokenRows.length === 0) {
        console.warn(`UserDO: No JWT token found for user ${userId}`);
        return null;
      }

      return (tokenRows[0] as { api_key: string }).api_key;
    } catch (error) {
      console.error("UserDO: Failed to get JWT token:", error);
      return null;
    }
  }

  // Create a new project
  private async handleCreateProject(request: Request): Promise<Response> {
    const requestData = await request.json();
    console.log("UserDO: Create project request data:", requestData);

    // Extract project data from the request (frontend sends different format)
    const projectData = {
      name: requestData.projectName,
      display_name: requestData.displayName || requestData.projectName,
      privacy: "private" as const, // Default to private for now
      description: requestData.description || null,
    };

    try {
      console.log("UserDO: About to execute SQL with data:", projectData);

      // Try template literal syntax instead of parameter binding
      await this.sql.exec(`
        INSERT INTO projects (name, display_name, privacy, description)
        VALUES (${JSON.stringify(projectData.name)}, ${JSON.stringify(projectData.display_name)}, ${JSON.stringify(projectData.privacy)}, ${JSON.stringify(projectData.description)})
      `);

      console.log(`UserDO: Created project ${projectData.name}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Project created successfully",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("UserDO: Failed to create project:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to create project",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // List all projects for this user
  private async handleListProjects(request: Request): Promise<Response> {
    try {
      const projectResult = await this.sql.exec(`
        SELECT name, display_name, privacy, description, created_at
        FROM projects
        ORDER BY created_at ASC
      `);

      const projects = [...projectResult] as ProjectMetadata[];

      return new Response(JSON.stringify({ projects }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("UserDO: Failed to list projects:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to list projects",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // Get specific project metadata
  private async handleGetProject(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const projectName = url.searchParams.get("name");

    if (!projectName) {
      return new Response(
        JSON.stringify({ error: "name parameter required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    try {
      const projectResult = await this.sql.exec(`
        SELECT name, display_name, privacy, description, created_at
        FROM projects
        WHERE name = '${projectName}'
      `);

      const projectRows = [...projectResult];
      if (projectRows.length === 0) {
        return new Response(JSON.stringify({ error: "Project not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const project = projectRows[0] as ProjectMetadata;

      return new Response(JSON.stringify({ project }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("UserDO: Failed to get project:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to get project",
          details: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
