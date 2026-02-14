'use client';

import { useEffect, useState, useCallback } from 'react';

interface ContentItem {
  id: string;
  type: string;
  status: 'draft' | 'pending' | 'approved' | 'posted' | 'rejected';
  content: string;
  target?: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
  postedUrl?: string;
  feedback?: string;
}

interface ContentPipelineProps {
  employeeId: string;
  employeeName: string;
  containerStatus: string;
}

const COLUMNS: { key: ContentItem['status']; label: string; color: string }[] = [
  { key: 'draft', label: 'Draft', color: '#888' },
  { key: 'pending', label: 'Pending Approval', color: '#facc15' },
  { key: 'approved', label: 'Approved', color: '#4ade80' },
  { key: 'posted', label: 'Posted', color: '#3b82f6' },
  { key: 'rejected', label: 'Rejected', color: '#ef4444' },
];

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  comment: { label: 'Comment', color: '#7c6bf0' },
  tweet: { label: 'Tweet', color: '#1d9bf0' },
  thread: { label: 'Thread', color: '#fb923c' },
  article: { label: 'Article', color: '#4ade80' },
};

export function ContentPipeline({ employeeId, employeeName, containerStatus }: ContentPipelineProps) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<ContentItem['status'] | 'all'>('all');

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`/api/employees/${employeeId}/content`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [employeeId]);

  useEffect(() => {
    if (containerStatus !== 'running') {
      setLoading(false);
      return;
    }
    fetchContent();
    const interval = setInterval(fetchContent, 30000);
    return () => clearInterval(interval);
  }, [containerStatus, fetchContent]);

  const handleAction = async (itemId: string, action: 'approve' | 'reject', feedback?: string) => {
    setActing(itemId);
    try {
      const res = await fetch(`/api/employees/${employeeId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, itemId, feedback }),
      });
      if (res.ok) {
        await fetchContent();
      }
    } catch { /* ignore */ }
    finally { setActing(null); }
  };

  if (containerStatus !== 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">📝</div>
        <h2 className="text-base font-semibold">Content Pipeline not available</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {employeeName} needs to be online to view the content pipeline.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
        <p className="text-sm" style={{ color: '#888' }}>Loading content...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">📝</div>
        <h2 className="text-base font-semibold">No content yet</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {employeeName} hasn&apos;t created any content for review yet. Content will appear here when {employeeName} drafts tweets, comments, or threads.
        </p>
        <p className="text-xs" style={{ color: '#555' }}>
          Tip: Ask {employeeName} in the Chat tab to draft some content and put it in the queue for your approval.
        </p>
      </div>
    );
  }

  // Count per column
  const counts: Record<string, number> = {};
  for (const col of COLUMNS) {
    counts[col.key] = items.filter(i => i.status === col.key).length;
  }

  const filteredItems = activeColumn === 'all' ? items : items.filter(i => i.status === activeColumn);

  // Sort: pending first, then by date
  const sorted = [...filteredItems].sort((a, b) => {
    const statusOrder: Record<string, number> = { pending: 0, draft: 1, approved: 2, posted: 3, rejected: 4 };
    const orderDiff = (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
    if (orderDiff !== 0) return orderDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-4 max-w-[800px] mx-auto">
      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-2">
        {COLUMNS.map(col => (
          <button
            key={col.key}
            onClick={() => setActiveColumn(activeColumn === col.key ? 'all' : col.key)}
            className="p-3 rounded-2xl border text-center transition-colors"
            style={{
              background: activeColumn === col.key ? 'rgba(124,107,240,0.1)' : 'rgba(255,255,255,0.03)',
              borderColor: activeColumn === col.key ? 'rgba(124,107,240,0.3)' : 'rgba(255,255,255,0.06)',
            }}
          >
            <div className="text-lg font-bold" style={{ color: col.color }}>
              {counts[col.key] || 0}
            </div>
            <div className="text-[10px]" style={{ color: '#888' }}>{col.label}</div>
          </button>
        ))}
      </div>

      {/* Content cards */}
      <div className="flex flex-col gap-3">
        {sorted.map(item => {
          const typeBadge = TYPE_BADGES[item.type] || { label: item.type, color: '#888' };
          const statusCol = COLUMNS.find(c => c.key === item.status);
          const isActing = acting === item.id;
          const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
          });

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl border"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: `${typeBadge.color}20`, color: typeBadge.color }}
                  >
                    {typeBadge.label}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: `${statusCol?.color || '#888'}20`, color: statusCol?.color || '#888' }}
                  >
                    {statusCol?.label || item.status}
                  </span>
                  {item.target && (
                    <span className="text-xs" style={{ color: '#555' }}>
                      → {item.target}
                    </span>
                  )}
                </div>
                <span className="text-[10px]" style={{ color: '#555' }}>{date}</span>
              </div>

              {/* Content preview */}
              <div className="text-sm mb-3 whitespace-pre-wrap" style={{ color: '#ccc' }}>
                {item.content.length > 500 ? item.content.slice(0, 500) + '...' : item.content}
              </div>

              {/* Posted URL */}
              {item.postedUrl && (
                <div className="text-xs mb-2">
                  <a
                    href={item.postedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    style={{ color: '#3b82f6' }}
                  >
                    View live post
                  </a>
                </div>
              )}

              {/* Feedback */}
              {item.feedback && (
                <div className="text-xs px-3 py-2 rounded-lg mb-3" style={{ background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                  Feedback: {item.feedback}
                </div>
              )}

              {/* Actions — only for pending items */}
              {item.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approve')}
                    disabled={isActing}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{
                      background: isActing ? '#333' : '#16a34a',
                      opacity: isActing ? 0.6 : 1,
                      cursor: isActing ? 'wait' : 'pointer',
                    }}
                  >
                    {isActing ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => {
                      const fb = prompt('Optional feedback for rejection:');
                      handleAction(item.id, 'reject', fb || undefined);
                    }}
                    disabled={isActing}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{
                      background: 'transparent',
                      borderColor: '#7f1d1d',
                      color: '#ef4444',
                      opacity: isActing ? 0.6 : 1,
                      cursor: isActing ? 'wait' : 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
