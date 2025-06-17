/**
 * Utility functions for exporting and importing Agent data
 */
import type { AppAgent } from "../AppAgent";
import type { AppAgentState } from "../AppAgent";

/**
 * Database schema column definition
 */
export interface SchemaColumn {
  name: string;
  type: string;
  notnull?: number | boolean;
  pk?: number | boolean;
  dflt_value?: string | null;
  cid?: number;
}

/**
 * Generic database row type with more specific JSON handling
 */
export type DatabaseRow = Record<
  string,
  string | number | boolean | null | object
>;

/**
 * Message row for chat history
 */
export interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
  metadata?: string | object;
}

/**
 * Schedule row for tasks
 */
export interface ScheduleRow {
  id: string;
  when: string | number;
  callback: string;
  data?: string;
  [key: string]: unknown;
}

/**
 * SQL-safe value type that can be used in SQL template literals
 */
type SqlValue = string | number | boolean | null;

/**
 * Convert any value to a SQL-safe value
 */
export function toSqlValue(value: unknown): SqlValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  // For objects and arrays, convert to JSON string
  return JSON.stringify(value);
}

/**
 * Result structure for database exports
 */
export interface DatabaseExportResult {
  metadata: {
    exportedAt: string;
    agentId: string;
    state: unknown;
  };
  tables: Record<
    string,
    {
      schema?: SchemaColumn[];
      rows?: DatabaseRow[];
      description: string;
      error?: string;
    }
  >;
}

/**
 * Import options for database imports
 */
export interface ImportOptions {
  preserveAgentId?: boolean;
  includeMessages?: boolean;
  includeScheduledTasks?: boolean;
}

/**
 * Import request structure
 */
export interface ImportRequest {
  options: ImportOptions;
  data: DatabaseExportResult;
}

/**
 * Import result structure
 */
export interface ImportResult {
  success: boolean;
  agentId: string;
  tablesImported: string[];
  recordsImported: number;
  warnings: string[];
  updatedState: boolean;
}

/**
 * Export all agent data including state and database tables
 *
 * @param agent The agent instance
 * @returns A promise that resolves to the export result
 */
export async function exportAgentData(
  agent: AppAgent
): Promise<DatabaseExportResult> {
  console.log("[export-import] Database export requested");

  // Get the agent's ID using a safe method
  const agentId = await getAgentId(agent);

  // Prepare the result object
  const result: DatabaseExportResult = {
    metadata: {
      exportedAt: new Date().toISOString(),
      agentId,
      state: agent.state,
    },
    tables: {},
  };

  // Define table names and their queries
  const tableQueries = [
    {
      name: "cf_agents_state",
      schemaQuery: agent.sql`PRAGMA table_info(cf_agents_state)`,
      dataQuery: agent.sql`SELECT * FROM cf_agents_state`,
    },
    {
      name: "cf_ai_chat_agent_messages",
      schemaQuery: agent.sql`PRAGMA table_info(cf_ai_chat_agent_messages)`,
      dataQuery: agent.sql`SELECT * FROM cf_ai_chat_agent_messages`,
    },
    {
      name: "cf_agents_schedules",
      schemaQuery: agent.sql`PRAGMA table_info(cf_agents_schedules)`,
      dataQuery: agent.sql`SELECT * FROM cf_agents_schedules`,
    },
    {
      name: "companies",
      schemaQuery: agent.sql`PRAGMA table_info(companies)`,
      dataQuery: agent.sql`SELECT * FROM companies`,
    },
    {
      name: "leads",
      schemaQuery: agent.sql`PRAGMA table_info(leads)`,
      dataQuery: agent.sql`SELECT * FROM leads`,
    },
    {
      name: "interaction_history",
      schemaQuery: agent.sql`PRAGMA table_info(interaction_history)`,
      dataQuery: agent.sql`SELECT * FROM interaction_history`,
    },
  ];

  // Process each table
  for (const table of tableQueries) {
    // Schema query returns an array of column info
    const schema = await table.schemaQuery;
    const rows = await table.dataQuery;

    // Convert schema to SchemaColumn type
    const schemaColumns: SchemaColumn[] = Array.isArray(schema)
      ? schema.map((col) => ({
          name: String(col.name || ""),
          type: String(col.type || "TEXT"),
          notnull: Boolean(col.notnull),
          pk: Boolean(col.pk),
          dflt_value:
            col.dflt_value !== undefined ? String(col.dflt_value) : null,
          cid: typeof col.cid === "number" ? col.cid : 0,
        }))
      : [];

    result.tables[table.name] = {
      schema: schemaColumns,
      rows,
      description: getTableDescription(table.name),
    };
  }

  return result;
}

/**
 * Import agent data from a previous export
 *
 * @param agent The agent instance
 * @param importRequest The import request containing options and data
 * @returns A promise that resolves to the import result
 */
export async function importAgentData(
  agent: AppAgent,
  importRequest: ImportRequest
): Promise<ImportResult> {
  console.log("[export-import] Database import requested");

  // Get the agent's ID using a safe method
  const agentId = await getAgentId(agent);

  // Extract options
  const options = importRequest.options || {};
  const includeMessages = options.includeMessages ?? true;
  const includeScheduledTasks = options.includeScheduledTasks ?? true;

  // Prepare the result tracking
  const result: ImportResult = {
    success: true,
    agentId,
    tablesImported: [],
    recordsImported: 0,
    warnings: [],
    updatedState: false,
  };

  // Handle agent state import first
  if (importRequest.data.metadata.state) {
    // Ensure the state schema is valid
    const importedState = agent.ensureStateSchema(
      importRequest.data.metadata.state as AppAgentState
    );

    // Update the state
    await agent.setState(importedState);
    result.updatedState = true;
  }

  // Import table data for each table
  for (const [tableName, tableData] of Object.entries(
    importRequest.data.tables
  )) {
    // Skip message history if not requested
    if (tableName === "cf_ai_chat_agent_messages" && !includeMessages) {
      result.warnings.push(
        "Skipped importing message history (includeMessages=false)"
      );
      continue;
    }

    // Skip scheduled tasks if not requested
    if (tableName === "cf_agents_schedules" && !includeScheduledTasks) {
      result.warnings.push(
        "Skipped importing scheduled tasks (includeScheduledTasks=false)"
      );
      continue;
    }

    // Skip tables that had errors during export
    if (tableData.error) {
      result.warnings.push(
        `Skipped importing ${tableName}: Table had export errors`
      );
      continue;
    }

    // Skip tables that don't have rows
    if (!tableData.rows || !Array.isArray(tableData.rows)) {
      result.warnings.push(
        `Skipped importing ${tableName}: No valid rows data`
      );
      continue;
    }

    // First ensure the table exists
    // For system tables (cf_*), we don't recreate them as they are managed by the Agent framework
    if (!tableName.startsWith("cf_")) {
      // Check if we need to create custom tables
      // Convert the schema data to a proper SchemaColumn array
      const schemaColumns: SchemaColumn[] = Array.isArray(tableData.schema)
        ? tableData.schema.map((col) => ({
            name: String(col.name || ""),
            type: String(col.type || "TEXT"),
            notnull: Boolean(col.notnull),
            pk: Boolean(col.pk),
            dflt_value:
              col.dflt_value !== undefined ? String(col.dflt_value) : null,
            cid: typeof col.cid === "number" ? col.cid : 0,
          }))
        : [];

      await ensureTableExists(agent, tableName, schemaColumns);
    }

    // Import the rows with individual inserts
    let tableImportCount = 0;

    // Process each row individually
    for (const row of tableData.rows as Record<string, unknown>[]) {
      if (tableName === "cf_ai_chat_agent_messages") {
        // For message history
        await importMessage(agent, row);
        tableImportCount++;
      } else if (tableName === "cf_agents_schedules") {
        // For scheduled tasks
        await importSchedule(agent, row);
        tableImportCount++;
      } else if (tableName === "cf_agents_state") {
        // For agent state table
        await importAgentState(agent, row);
        tableImportCount++;
      } else {
        // For all other tables
        await importRow(agent, tableName, row);
        tableImportCount++;
      }
    }

    // Update import statistics
    result.tablesImported.push(tableName);
    result.recordsImported += tableImportCount;
  }

  // Sync state to ensure all changes are persisted
  await agent.setState(agent.state);

  console.log(
    `[export-import] Import completed: ${result.recordsImported} records imported`
  );

  return result;
}

/**
 * Helper to get the Agent ID safely
 */
async function getAgentId(agent: AppAgent): Promise<string> {
  try {
    // Try to get ID from the database
    const stateResult = await agent.sql`SELECT * FROM cf_agents_state LIMIT 1`;
    if (stateResult.length > 0 && stateResult[0].id) {
      // Convert the ID to string to ensure it's a string type
      return String(stateResult[0].id);
    }
  } catch (e) {
    console.warn("[export-import] Could not get ID from database:", e);
  }

  // Fallback to a generated ID
  return crypto.randomUUID();
}

/**
 * Ensure a table exists in the database
 * @param agent The agent instance
 * @param tableName The name of the table to create if it doesn't exist
 * @param schema The schema information from PRAGMA table_info
 */
async function ensureTableExists(
  agent: AppAgent,
  tableName: string,
  schema: SchemaColumn[]
): Promise<void> {
  try {
    // First check if the table already exists
    const tableCheck = await agent.sql`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name=${tableName}
    `;

    if (tableCheck.length > 0) {
      console.log(
        `[export-import] Table ${tableName} already exists, skipping creation`
      );
      return;
    }

    // If we have schema information, use it to create the table
    if (Array.isArray(schema) && schema.length > 0) {
      // For each column, create a separate CREATE TABLE statement
      // This avoids the need for complex SQL string interpolation
      // We use a very direct approach where we explicitly name each column type

      console.log(`[export-import] Creating table ${tableName}`);

      // For safety, we'll use hardcoded table creation statements for known tables
      // instead of trying to dynamically build SQL
      if (tableName === "scheduled_tasks") {
        await agent.sql`
          CREATE TABLE IF NOT EXISTS "scheduled_tasks" (
            id TEXT PRIMARY KEY,
            lead_id TEXT,
            description TEXT NOT NULL,
            scheduled_for TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            completed_at TEXT
          )
        `;
      } else if (tableName === "history") {
        await agent.sql`
          CREATE TABLE IF NOT EXISTS "history" (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            event_type TEXT NOT NULL,
            details TEXT
          )
        `;
      } else {
        // For unknown tables, we won't try to create them dynamically
        // This is safer than trying to build SQL statements on the fly
        console.warn(
          `[export-import] Unknown table ${tableName}, skipping automatic table creation.`
        );
        return;
      }

      console.log(`[export-import] Created table ${tableName}`);
    } else {
      console.warn(
        `[export-import] No schema information for table ${tableName}, skipping creation`
      );
    }
  } catch (error) {
    console.error(`[export-import] Error creating table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Helper function to import a message
 */
async function importMessage(
  agent: AppAgent,
  messageData: Record<string, unknown>
): Promise<void> {
  try {
    // Simply use the exact fields from the backup - no manipulation or fallbacks
    const id = messageData.id as string;
    const message = messageData.message as string;
    const createdAt = messageData.created_at as string;

    // Direct import without any transformations
    await agent.sql`
      INSERT OR REPLACE INTO cf_ai_chat_agent_messages
      (id, message, created_at)
      VALUES (${id}, ${message}, ${createdAt})
    `;
    console.log(`[export-import] Imported message with id: ${id}`);
  } catch (error) {
    console.error("[export-import] Error importing message:", error);
    throw error;
  }
}

/**
 * Helper function to import a scheduled task
 */
async function importSchedule(
  agent: AppAgent,
  scheduleData: Record<string, unknown>
): Promise<void> {
  try {
    // Simply use the exact fields from the backup - no manipulation or fallbacks
    const id = scheduleData.id as string;
    const cron = scheduleData.cron as string;
    const callback = scheduleData.callback as string;
    const data = scheduleData.data as string;
    const nextRunTime = scheduleData.next_run_time as string;
    const createdAt = scheduleData.created_at as string;

    // Direct import without any transformations
    await agent.sql`
      INSERT OR REPLACE INTO cf_agents_schedules
      (id, cron, callback, data, next_run_time, created_at)
      VALUES (
        ${id},
        ${cron},
        ${callback},
        ${data},
        ${nextRunTime},
        ${createdAt}
      )
    `;
    console.log(`[export-import] Imported schedule with id: ${id}`);
  } catch (error) {
    console.error("[export-import] Error importing schedule:", error);
    throw error;
  }
}

/**
 * Helper function to import agent state
 */
async function importAgentState(
  agent: AppAgent,
  stateData: Record<string, unknown>
): Promise<void> {
  try {
    // For the state table, import as-is
    const id = stateData.id as string;
    const state = stateData.state as string;

    // The cf_agents_state table only has id and state columns
    await agent.sql`
      INSERT OR REPLACE INTO cf_agents_state
      (id, state)
      VALUES (${id}, ${state})
    `;
    console.log(`[export-import] Imported agent state with id: ${id}`);
  } catch (error) {
    console.error("[export-import] Error importing agent state:", error);
    throw error;
  }
}

/**
 * Helper function to import a row into a custom table
 */
async function importRow(
  agent: AppAgent,
  tableName: string,
  rowData: Record<string, unknown>
): Promise<void> {
  try {
    // For custom tables, import exactly as they appear in the backup
    if (tableName === "companies") {
      const id = rowData.id as string;
      const name = rowData.name as string;
      const description = rowData.description as string;
      const config = rowData.config as string;
      const createdAt = rowData.created_at as string;
      const updatedAt = rowData.updated_at as string;

      await agent.sql`
        INSERT OR IGNORE INTO companies
        (id, name, description, config, created_at, updated_at)
        VALUES (
          ${id},
          ${name},
          ${description},
          ${config},
          ${createdAt},
          ${updatedAt}
        )
      `;
      console.log(`[export-import] Imported company with id: ${id}`);
    } else if (tableName === "leads") {
      const id = rowData.id as string;
      const companyId = rowData.company_id as string;
      const data = rowData.data as string;
      const funnelStage = rowData.funnel_stage as string;
      const lastUpdated = rowData.last_updated as string;

      await agent.sql`
        INSERT OR IGNORE INTO leads
        (id, company_id, data, funnel_stage, last_updated)
        VALUES (
          ${id},
          ${companyId},
          ${data},
          ${funnelStage},
          ${lastUpdated}
        )
      `;
      console.log(`[export-import] Imported lead with id: ${id}`);
    } else if (tableName === "interaction_history") {
      const id = rowData.id as string;
      const leadId = rowData.lead_id as string;
      const timestamp = rowData.timestamp as string;
      const action = rowData.action as string;
      const result = rowData.result as string;

      await agent.sql`
        INSERT OR IGNORE INTO interaction_history
        (id, lead_id, timestamp, action, result)
        VALUES (
          ${id},
          ${leadId},
          ${timestamp},
          ${action},
          ${result}
        )
      `;
      console.log(
        `[export-import] Imported interaction history with id: ${id}`
      );
    } else {
      // For unknown tables, we'll log the attempt but won't import
      // This is safer than trying to dynamically create SQL for unknown tables
      console.warn(
        `[export-import] Unknown table ${tableName}, skipping automatic import. Please define a specific import handler for this table type.`
      );
    }
  } catch (error) {
    console.error(
      `[export-import] Error importing row into ${tableName}:`,
      error
    );
    throw error;
  }
}

/**
 * Get a description of a table based on its name
 * Used for the database export feature
 */
function getTableDescription(tableName: string): string {
  // Provide descriptions for known tables
  const tableDescriptions: Record<string, string> = {
    cf_agents_state: "Stores the Agent state data",
    cf_ai_chat_agent_messages:
      "Stores chat message history for the AI chat agent",
    cf_agents_schedules: "Stores scheduled tasks and their execution status",
    companies: "Stores company information",
    leads: "Stores lead data",
    interaction_history: "Stores history of lead interactions",
  };

  return (
    tableDescriptions[tableName] || "No description available for this table"
  );
}
