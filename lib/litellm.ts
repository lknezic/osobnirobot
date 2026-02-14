/**
 * LiteLLM API client for admin dashboard.
 * Queries the LiteLLM proxy for spend data, model info, and health.
 */

const LITELLM_URL = process.env.LITELLM_URL || 'http://localhost:4000';
const LITELLM_MASTER_KEY = process.env.LITELLM_MASTER_KEY || '';

async function litellmFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${LITELLM_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${LITELLM_MASTER_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`LiteLLM API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface SpendLog {
  api_key: string;
  model: string;
  spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  startTime: string;
  endTime: string;
}

export interface ModelInfo {
  model_name: string;
  litellm_params: {
    model: string;
    api_key?: string;
  };
  model_info?: {
    input_cost_per_token?: number;
    output_cost_per_token?: number;
    max_tokens?: number;
  };
}

export interface SpendSummary {
  totalSpend: number;
  totalRequests: number;
  byModel: Record<string, { spend: number; requests: number; tokens: number }>;
  byKey: Record<string, { spend: number; requests: number }>;
  daily: { date: string; spend: number; requests: number }[];
}

/** Get spend logs for a date range */
export async function getSpendLogs(startDate: string, endDate: string): Promise<SpendLog[]> {
  try {
    return await litellmFetch<SpendLog[]>(`/spend/logs?start_date=${startDate}&end_date=${endDate}`);
  } catch {
    return [];
  }
}

/** Get model info */
export async function getModelInfo(): Promise<ModelInfo[]> {
  try {
    const data = await litellmFetch<{ data: ModelInfo[] }>('/model/info');
    return data.data || [];
  } catch {
    return [];
  }
}

/** Get health check */
export async function getLiteLLMHealth(): Promise<{ healthy: boolean; models: string[] }> {
  try {
    const data = await litellmFetch<Record<string, unknown>>('/health');
    return { healthy: true, models: Object.keys(data) };
  } catch {
    return { healthy: false, models: [] };
  }
}

/** Get spend summary from logs */
export function summarizeSpend(logs: SpendLog[]): SpendSummary {
  const byModel: SpendSummary['byModel'] = {};
  const byKey: SpendSummary['byKey'] = {};
  const dailyMap: Record<string, { spend: number; requests: number }> = {};

  let totalSpend = 0;

  for (const log of logs) {
    totalSpend += log.spend || 0;

    // By model
    if (!byModel[log.model]) byModel[log.model] = { spend: 0, requests: 0, tokens: 0 };
    byModel[log.model].spend += log.spend || 0;
    byModel[log.model].requests += 1;
    byModel[log.model].tokens += log.total_tokens || 0;

    // By key
    const key = log.api_key || 'default';
    if (!byKey[key]) byKey[key] = { spend: 0, requests: 0 };
    byKey[key].spend += log.spend || 0;
    byKey[key].requests += 1;

    // Daily
    const date = (log.startTime || '').slice(0, 10);
    if (date) {
      if (!dailyMap[date]) dailyMap[date] = { spend: 0, requests: 0 };
      dailyMap[date].spend += log.spend || 0;
      dailyMap[date].requests += 1;
    }
  }

  const daily = Object.entries(dailyMap)
    .map(([date, d]) => ({ date, ...d }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    totalSpend,
    totalRequests: logs.length,
    byModel,
    byKey,
    daily,
  };
}

/** Hardcoded model cost info (LiteLLM may not return this) */
export const MODEL_COSTS: Record<string, { inputPer1k: number; outputPer1k: number; tier: string; useCase: string }> = {
  'gemini-2.0-flash': { inputPer1k: 0.00001, outputPer1k: 0.00004, tier: 'Fast', useCase: 'Heartbeat, reading, checking' },
  'claude-sonnet-4': { inputPer1k: 0.003, outputPer1k: 0.015, tier: 'Quality', useCase: 'Writing, research, analysis' },
  'claude-opus-4.6': { inputPer1k: 0.015, outputPer1k: 0.075, tier: 'Premium', useCase: 'Complex reasoning (rare)' },
};
