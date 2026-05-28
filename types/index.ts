export type ProviderName = "openai" | "anthropic" | "ollama";

export interface ProviderInfo {
  name: ProviderName;
  available: boolean;
  warning?: string;
  defaultModel: string;
}

export interface ProvidersResponse {
  providers: ProviderInfo[];
  hasAvailable: boolean;
}

export interface ProcessResult {
  data: Record<string, unknown>;
  uniqueId?: string;
  confidence: Record<string, number | null>;
  overallConfidence: number;
  lowConfidenceFields: string[];
  processingTime: number;
  model: string;
  provider: string;
}

export type AppState = "loading" | "no-providers" | "setup" | "processing" | "result" | "error";

export type TabName = "setup" | "result" | "surveyForm" | "error";

export interface SetupData {
  provider: ProviderName;
  model: string;
  temperature?: number;
  maxTokens?: number;
  images: FileData[];
  surveyJson: Record<string, unknown>;
}

export interface FileData {
  name: string;
  type: string;
  content: string;
}
