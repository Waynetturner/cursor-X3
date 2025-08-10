// Type declarations for @mlc-ai/web-llm
declare module '@mlc-ai/web-llm' {
  export interface InitProgressReport {
    text: string
    progress: number
  }

  export class MLCEngine {
    constructor()
    reload(modelId: string): Promise<void>
    setInitProgressCallback(callback: (report: InitProgressReport) => void): void
    chat: {
      completions: {
        create(options: {
          messages: Array<{ role: string; content: string }>
          temperature?: number
          max_tokens?: number
          stream?: boolean
        }): Promise<{
          choices: Array<{
            message: {
              content: string
            }
          }>
        }>
      }
    }
  }

  export const prebuiltAppConfig: Record<string, {
    model: string;
    model_id: string;
    model_lib: string;
    required_features: string[];
    overrides?: Record<string, unknown>;
  }>
}
