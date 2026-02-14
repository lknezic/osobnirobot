'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCards } from './StatCards';

interface SummaryStats {
  commentsToday: number;
  repliesReceived: number;
  accountsEngaged: number;
  postsCreated: number;
}

interface KnowledgeEntry {
  category: string;
  filename: string;
  preview: string;
  fullContent: string;
}

interface SummaryData {
  stats: SummaryStats;
  issues: { pendingQuestions: number; improvementCount: number };
  engagementStats: string | null;
  improvementSuggestions: string | null;
  researchFindings: string | null;
  knowledge: KnowledgeEntry[];
}

interface SummaryProps {
  employeeId: string;
  employeeName: string;
  containerStatus: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  docs: 'Knowledge Docs',
  memory: 'Memory & Learning',
};

export function Summary({ employeeId, employeeName, containerStatus }: SummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedFile, setExpandedFile] = useState<string | null>(null);

  const fetchSummary = useCallback(async (q?: string) => {
    try {
      const queryParam = q ? `?q=${encodeURIComponent(q)}` : '';
      const res = await fetch(`/api/employees/${employeeId}/summary${queryParam}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => {
    if (containerStatus !== 'running') {
      setLoading(false);
      return;
    }
    fetchSummary();
    const interval = setInterval(() => fetchSummary(), 60000);
    return () => clearInterval(interval);
  }, [containerStatus, fetchSummary]);

  // Debounced search
  useEffect(() => {
    if (containerStatus !== 'running') return;
    const timer = setTimeout(() => fetchSummary(search), 500);
    return () => clearTimeout(timer);
  }, [search, containerStatus, fetchSummary]);

  if (containerStatus !== 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">📊</div>
        <h2 className="text-base font-semibold">Summary not available</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {employeeName} needs to be online to view their summary.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
        <p className="text-sm" style={{ color: '#888' }}>Loading summary...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-red-400">Failed to load summary</p>
      </div>
    );
  }

  const filteredKnowledge = data.knowledge.filter(e =>
    categoryFilter === 'all' || e.category === categoryFilter
  );

  const categories = Array.from(new Set(data.knowledge.map(e => e.category)));

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-4 max-w-[800px] mx-auto">
      {/* Stat cards */}
      <StatCards cards={[
        { label: 'Comments Today', value: data.stats.commentsToday },
        { label: 'Replies', value: data.stats.repliesReceived },
        { label: 'Accounts Engaged', value: data.stats.accountsEngaged },
        { label: 'Issues', value: data.issues.pendingQuestions, color: data.issues.pendingQuestions > 0 ? '#facc15' : '#4ade80' },
      ]} />

      {/* Engagement details */}
      {data.engagementStats && (
        <details
          className="rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <summary className="px-5 py-3 cursor-pointer text-sm font-semibold hover:text-white transition-colors" style={{ color: '#ccc' }}>
            Engagement Details
          </summary>
          <div className="px-5 pb-4">
            <pre className="text-xs whitespace-pre-wrap" style={{ color: '#aaa' }}>
              {data.engagementStats}
            </pre>
          </div>
        </details>
      )}

      {/* Improvement suggestions */}
      {data.improvementSuggestions && (
        <details
          className="rounded-2xl border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <summary className="px-5 py-3 cursor-pointer text-sm font-semibold hover:text-white transition-colors" style={{ color: '#ccc' }}>
            Improvement Suggestions ({data.issues.improvementCount})
          </summary>
          <div className="px-5 pb-4">
            <pre className="text-xs whitespace-pre-wrap" style={{ color: '#aaa' }}>
              {data.improvementSuggestions}
            </pre>
          </div>
        </details>
      )}

      {/* Knowledge Base — searchable */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Knowledge Base</h3>

        {/* Search */}
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge files..."
            className="w-full px-4 py-2 rounded-xl text-sm border"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.06)',
              color: '#e5e5e5',
              outline: 'none',
            }}
          />
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className="px-3 py-1 rounded-full text-xs font-medium shrink-0"
            style={{
              background: categoryFilter === 'all' ? 'rgba(124,107,240,0.15)' : 'rgba(255,255,255,0.03)',
              color: categoryFilter === 'all' ? '#a78bfa' : '#888',
              border: '1px solid',
              borderColor: categoryFilter === 'all' ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)',
            }}
          >
            All ({data.knowledge.length})
          </button>
          {categories.map(cat => {
            const count = data.knowledge.filter(e => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="px-3 py-1 rounded-full text-xs font-medium shrink-0"
                style={{
                  background: categoryFilter === cat ? 'rgba(124,107,240,0.15)' : 'rgba(255,255,255,0.03)',
                  color: categoryFilter === cat ? '#a78bfa' : '#888',
                  border: '1px solid',
                  borderColor: categoryFilter === cat ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)',
                }}
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </button>
            );
          })}
        </div>

        {/* File list */}
        <div className="flex flex-col gap-2">
          {filteredKnowledge.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: '#555' }}>
              {search ? 'No files match your search' : 'No knowledge files yet'}
            </p>
          ) : (
            filteredKnowledge.map(entry => (
              <div
                key={`${entry.category}-${entry.filename}`}
                className="rounded-2xl border overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <button
                  onClick={() => setExpandedFile(expandedFile === entry.filename ? null : entry.filename)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: '#7c6bf0' }}>
                      {entry.filename}
                    </span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.05)', color: '#888' }}
                    >
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#555' }}>
                    {expandedFile === entry.filename ? '▼' : '▶'}
                  </span>
                </button>
                {expandedFile === entry.filename && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <pre className="text-xs whitespace-pre-wrap mt-3" style={{ color: '#aaa' }}>
                      {entry.fullContent || 'Empty file'}
                    </pre>
                  </div>
                )}
                {expandedFile !== entry.filename && entry.preview && (
                  <div className="px-4 pb-3">
                    <p className="text-xs truncate" style={{ color: '#555' }}>
                      {entry.preview.slice(0, 120)}...
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
