/**
 * Tool Types
 *
 * This file contains type definitions for tools that are safe to import in React components.
 * These are kept separate from registry.ts to avoid importing Cloudflare Worker code in the browser.
 */

// Common parameter types
type WeatherParams = {
  location: string;
};

type TimeParams = {
  timezone: string;
};

type WebPageParams = {
  url: string;
};

type TaskParams = {
  taskId: string;
  description: string;
  dueDate: string;
};

type CompanyInfoParams = {
  name: string;
  industry: string;
  size: string;
};

type ProductInfoParams = {
  name: string;
  description: string;
  features: string[];
};

type FunnelStageParams = {
  stages: Array<{
    name: string;
    description: string;
  }>;
};

type QualificationParams = {
  criteria: Array<{
    field: string;
    value: string;
  }>;
};

type ObjectionResponseParams = {
  responses: Array<{
    objection: string;
    response: string;
  }>;
};

type TemplateParams = {
  templates: Array<{
    name: string;
    content: string;
  }>;
};

type ToolingPlanParams = {
  tools: Array<{
    name: string;
    purpose: string;
  }>;
};

type CommunicationChannelParams = {
  channels: Array<{
    type: string;
    details: string;
  }>;
};

type PlaybookParams = {
  steps: Array<{
    name: string;
    description: string;
  }>;
};

type SettingsParams = {
  settings: Record<string, unknown>;
};

type TestResultParams = {
  testName: string;
  result: boolean;
  details: string;
};

type DocumentationParams = {
  toolName: string;
  documentation: string;
};

type LeadParams = {
  name: string;
  email: string;
  company: string;
};

type SearchParams = {
  query: string;
  filters?: Record<string, unknown>;
};

type TestErrorParams = {
  message: string;
};

/**
 * Type definitions for tools that will be used in React components
 *
 * Note: This is a subset of the actual tools, just for typing purposes.
 */
export type ToolTypes = {
  // Context tools
  getWeatherInformation: (
    params: WeatherParams
  ) => Promise<{ temperature: number; conditions: string }>;
  getLocalTime: (params: TimeParams) => Promise<{ time: string }>;

  // Browser tools
  browseWebPage: (params: WebPageParams) => Promise<{ content: string }>;
  browseWithBrowserbase: (
    params: WebPageParams
  ) => Promise<{ content: string }>;
  fetchWebPage: (params: WebPageParams) => Promise<{ content: string }>;

  // Scheduling tools
  scheduleTask: (params: TaskParams) => Promise<{ taskId: string }>;
  getScheduledTasks: () => Promise<
    Array<{ taskId: string; description: string; dueDate: string }>
  >;
  cancelScheduledTask: (params: {
    taskId: string;
  }) => Promise<{ success: boolean }>;

  // Onboarding tools
  saveCompanyInfo: (params: CompanyInfoParams) => Promise<{ success: boolean }>;
  saveProductInfo: (params: ProductInfoParams) => Promise<{ success: boolean }>;
  saveFunnelStages: (
    params: FunnelStageParams
  ) => Promise<{ success: boolean }>;
  saveQualificationCriteria: (
    params: QualificationParams
  ) => Promise<{ success: boolean }>;
  saveObjectionResponses: (
    params: ObjectionResponseParams
  ) => Promise<{ success: boolean }>;
  saveTemplates: (params: TemplateParams) => Promise<{ success: boolean }>;
  saveToolingPlan: (params: ToolingPlanParams) => Promise<{ success: boolean }>;
  saveCommunicationChannels: (
    params: CommunicationChannelParams
  ) => Promise<{ success: boolean }>;
  savePlaybook: (params: PlaybookParams) => Promise<{ success: boolean }>;
  completeOnboarding: () => Promise<{ success: boolean }>;
  checkExistingConfig: () => Promise<{ exists: boolean }>;
  getOnboardingStatus: () => Promise<{ status: string }>;
  saveSettings: (params: SettingsParams) => Promise<{ success: boolean }>;

  // Testing tools
  recordTestResult: (params: TestResultParams) => Promise<{ success: boolean }>;
  documentTool: (params: DocumentationParams) => Promise<{ success: boolean }>;
  generateTestReport: () => Promise<{ report: string }>;
  saveCrmToolDocumentation: (
    params: DocumentationParams
  ) => Promise<{ success: boolean }>;
  completeTestingPhase: () => Promise<{ success: boolean }>;
  controlledErrorTool: (params: {
    shouldError: boolean;
  }) => Promise<{ result: string }>;

  // State access tools
  getAgentState: () => Promise<Record<string, unknown>>;
  getCompanyConfig: () => Promise<Record<string, unknown>>;
  getTestingState: () => Promise<Record<string, unknown>>;
  getCrmState: () => Promise<Record<string, unknown>>;
  setMode: (params: { mode: string }) => Promise<{ success: boolean }>;

  // CRM tools
  createLead: (params: LeadParams) => Promise<{ leadId: string }>;
  updateLead: (
    params: LeadParams & { leadId: string }
  ) => Promise<{ success: boolean }>;
  searchLeads: (
    params: SearchParams
  ) => Promise<Array<LeadParams & { leadId: string }>>;

  // Messaging tools
  suggestActions: (params: {
    context: string;
  }) => Promise<Array<{ action: string; confidence: number }>>;

  // Search tools
  searchWebPages: (
    params: SearchParams
  ) => Promise<Array<{ url: string; title: string; snippet: string }>>;

  // Test error tool
  testErrorTool: (params: TestErrorParams) => Promise<never>;
};
