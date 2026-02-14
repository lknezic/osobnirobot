'use client';

import { useState, useEffect } from 'react';

interface ModelData {
  name: string;
  provider: string;
  model: string;
  costs: { inputPer1k: number; outputPer1k: number; tier: string; useCase: string } | null;
  maxTokens: number | null;
}

interface UsageSummary {
  totalSpend: number;
  totalRequests: number;
  byModel: Record<string, { spend: number; requests: number; tokens: number }>;
  daily: { date: string; spend: number; requests: number }[];
  period: { startDate: string; endDate: string; days: number };
}

interface ModelsResponse {
  models: ModelData[];
  health: { healthy: boolean; models: string[] };
  budgetRules: { dailyCeiling: number; weeklyCeiling: number; runawayThreshold: number };
}

export default function ModelsPage() {
  const [modelsData, setModelsData] = useState<ModelsResponse | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'models' | 'usage'>('models');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/models').then(r => r.ok ? r.json() : null),
      fetch('/api/admin/usage?days=30').then(r => r.ok ? r.json() : null),
    ]).then(([m, u]) => {
      setModelsData(m);
      setUsage(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-[#333] border-t-[#7c6bf0] rounded-full animate-spin" />
      </div>
    );
  }

  const tierColors: Record<string, string> = {
    Fast: '#4ade80',
    Quality: '#60a5fa',
    Premium: '#f59e0b',
  };

  // Projected monthly cost
  const daysElapsed = usage?.daily?.length || 1;
  const projectedMonthly = (usage?.totalSpend || 0) / daysElapsed * 30;
  const burnRate = (usage?.totalSpend || 0) / daysElapsed;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-lg font-bold mb-1">Models & Cost</h1>
        <p className="text-xs mb-6" style={{ color: '#666' }}>LiteLLM model inventory, usage tracking, and budget rules</p>

        {/* Stat cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Models', value: modelsData?.models.length || 0 },
            { label: 'MTD Spend', value: `$${(usage?.totalSpend || 0).toFixed(2)}` },
            { label: 'Projected/mo', value: `$${projectedMonthly.toFixed(2)}` },
            { label: 'Burn Rate', value: `$${burnRate.toFixed(2)}/day` },
          ].map(stat => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-[10px] mt-1" style={{ color: '#666' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {(['models', 'usage'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: activeTab === t ? 'rgba(124,107,240,0.12)' : 'transparent',
                color: activeTab === t ? '#a78bfa' : '#888',
              }}
            >
              {t === 'models' ? 'Model Inventory' : 'Usage & Budget'}
            </button>
          ))}
        </div>

        {activeTab === 'models' && (
          <div className="space-y-3">
            {/* Health banner */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs"
              style={{
                background: modelsData?.health.healthy ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: modelsData?.health.healthy ? '#4ade80' : '#f87171',
              }}
            >
              <span style={{ fontSize: 8 }}>●</span>
              LiteLLM Proxy: {modelsData?.health.healthy ? 'Healthy' : 'Unreachable'}
            </div>

            {/* Model cards */}
            {modelsData?.models.map(model => {
              const modelUsage = usage?.byModel[model.name];
              const color = tierColors[model.costs?.tier || ''] || '#888';

              return (
                <div
                  key={model.name}
                  className="p-4 rounded-xl border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.costs && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: `${color}20`, color }}
                        >
                          {model.costs.tier}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: '#555' }}>{model.provider}</span>
                  </div>

                  {model.costs && (
                    <div className="text-xs mb-2" style={{ color: '#888' }}>
                      ${model.costs.inputPer1k}/1K in &middot; ${model.costs.outputPer1k}/1K out
                    </div>
                  )}

                  {model.costs && (
                    <div className="text-xs mb-2" style={{ color: '#666' }}>
                      Used for: {model.costs.useCase}
                    </div>
                  )}

                  {modelUsage && (
                    <div className="flex gap-4 mt-2 pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <span className="text-[10px]" style={{ color: '#888' }}>
                        This month: ${modelUsage.spend.toFixed(2)}
                      </span>
                      <span className="text-[10px]" style={{ color: '#888' }}>
                        {modelUsage.requests.toLocaleString()} requests
                      </span>
                      <span className="text-[10px]" style={{ color: '#888' }}>
                        {(modelUsage.tokens / 1000).toFixed(0)}K tokens
                      </span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Budget rules */}
            {modelsData?.budgetRules && (
              <div
                className="p-4 rounded-xl border"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <h3 className="text-xs font-semibold mb-3">Budget Rules</h3>
                <div className="space-y-2 text-xs" style={{ color: '#888' }}>
                  <div className="flex justify-between">
                    <span>Daily ceiling per worker</span>
                    <span className="font-medium text-white">${modelsData.budgetRules.dailyCeiling.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly ceiling per worker</span>
                    <span className="font-medium text-white">${modelsData.budgetRules.weeklyCeiling.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Runaway threshold (monthly)</span>
                    <span className="font-medium text-[#f59e0b]">${modelsData.budgetRules.runawayThreshold.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <span>Current burn rate</span>
                    <span className="font-medium" style={{ color: burnRate > 10 ? '#f87171' : '#4ade80' }}>
                      ${burnRate.toFixed(2)}/day (${projectedMonthly.toFixed(2)}/mo projected)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-3">
            {/* Daily spend chart (simple bar chart) */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-3">Daily Spend (Last 30 Days)</h3>
              {usage?.daily && usage.daily.length > 0 ? (
                <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
                  {usage.daily.slice(-30).map(day => {
                    const maxSpend = Math.max(...usage.daily.map(d => d.spend), 0.01);
                    const height = Math.max(2, (day.spend / maxSpend) * 100);
                    return (
                      <div
                        key={day.date}
                        className="flex-1 rounded-t"
                        style={{
                          height: `${height}%`,
                          background: day.spend > 10 ? '#f87171' : 'rgba(124,107,240,0.6)',
                          minWidth: 3,
                        }}
                        title={`${day.date}: $${day.spend.toFixed(2)} (${day.requests} req)`}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-center py-8" style={{ color: '#555' }}>
                  No spend data available. LiteLLM may not be tracking yet.
                </div>
              )}
            </div>

            {/* By model breakdown */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-3">Spend by Model</h3>
              {usage?.byModel && Object.keys(usage.byModel).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(usage.byModel)
                    .sort(([, a], [, b]) => b.spend - a.spend)
                    .map(([model, data]) => {
                      const pct = usage.totalSpend > 0 ? (data.spend / usage.totalSpend * 100) : 0;
                      return (
                        <div key={model}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: '#ccc' }}>{model}</span>
                            <span style={{ color: '#888' }}>${data.spend.toFixed(2)} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: '#7c6bf0' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-xs text-center py-4" style={{ color: '#555' }}>
                  No model usage data yet
                </div>
              )}
            </div>

            {/* Total summary */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <h3 className="text-xs font-semibold mb-3">Period Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div style={{ color: '#666' }}>Total Spend</div>
                  <div className="text-base font-bold">${(usage?.totalSpend || 0).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>Total Requests</div>
                  <div className="text-base font-bold">{(usage?.totalRequests || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>Avg Cost/Request</div>
                  <div className="text-base font-bold">
                    ${usage?.totalRequests ? (usage.totalSpend / usage.totalRequests).toFixed(4) : '0.00'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#666' }}>Period</div>
                  <div className="text-base font-bold">{usage?.period?.days || 30} days</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
