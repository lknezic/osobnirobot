'use client';

import { useEffect, useState } from 'react';

interface DailyEntry {
  date: string;
  content: string | null;
}

interface ActivityData {
  heartbeatLog: string | null;
  dailyEntries: DailyEntry[];
  engagementStats: string | null;
}

interface WorkLogProps {
  employeeId: string;
  employeeName: string;
  containerStatus: string;
}

export function WorkLog({ employeeId, employeeName, containerStatus }: WorkLogProps) {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (containerStatus !== 'running') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const fetchActivity = async () => {
      try {
        const res = await fetch(`/api/employees/${employeeId}/activity`);
        if (res.ok && !cancelled) {
          setData(await res.json());
        } else if (!cancelled) {
          setError('Failed to load activity');
        }
      } catch {
        if (!cancelled) setError('Failed to load activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 60000); // Refresh every minute
    return () => { cancelled = true; clearInterval(interval); };
  }, [employeeId, containerStatus]);

  if (containerStatus !== 'running') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">📋</div>
        <h2 className="text-base font-semibold">Work Log not available</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {employeeName} needs to be online to view their work log.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-8 h-8 border-3 border-[#333] border-t-[#3b82f6] rounded-full animate-spin" />
        <p className="text-sm" style={{ color: '#888' }}>Loading work log...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">⚠️</div>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  const hasContent = data && (data.heartbeatLog || data.dailyEntries.length > 0 || data.engagementStats);

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
        <div className="text-4xl">📋</div>
        <h2 className="text-base font-semibold">No activity yet</h2>
        <p className="text-sm" style={{ color: '#888' }}>
          {employeeName} hasn&apos;t completed any auto-pilot sessions yet. Activity will appear here after their first heartbeat run.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full flex flex-col gap-4 max-w-[800px] mx-auto">
      {/* Engagement Stats */}
      {data?.engagementStats && (
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <h3 className="text-sm font-semibold mb-3">Engagement Stats</h3>
          <pre className="text-xs whitespace-pre-wrap" style={{ color: '#ccc' }}>
            {data.engagementStats}
          </pre>
        </div>
      )}

      {/* Heartbeat Log */}
      {data?.heartbeatLog && (
        <div
          className="p-5 rounded-2xl border"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.06)',
          }}
        >
          <h3 className="text-sm font-semibold mb-3">Recent Heartbeat</h3>
          <pre className="text-xs whitespace-pre-wrap" style={{ color: '#ccc' }}>
            {data.heartbeatLog.slice(0, 3000)}
          </pre>
        </div>
      )}

      {/* Daily Logs */}
      {data?.dailyEntries && data.dailyEntries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Daily Reports</h3>
          {data.dailyEntries.map((entry) => (
            <details
              key={entry.date}
              className="rounded-2xl border"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
            >
              <summary className="px-5 py-3 cursor-pointer text-sm font-medium hover:text-white transition-colors" style={{ color: '#ccc' }}>
                {entry.date}
              </summary>
              <div className="px-5 pb-4">
                <pre className="text-xs whitespace-pre-wrap" style={{ color: '#aaa' }}>
                  {entry.content}
                </pre>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
