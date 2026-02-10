'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

type ContainerStatus = 'none' | 'creating' | 'running' | 'stopped' | 'error';

interface ContainerState {
  exists: boolean;
  status: ContainerStatus;
  gatewayPort?: number;
  novncPort?: number;
  gatewayToken?: string;
  assistantName?: string;
  plan?: string;
  trialEndsAt?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function Dashboard() {
  const [cs, setCs] = useState<ContainerState>({ exists: false, status: 'none' });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const router = useRouter();
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const currentAssistantMsgRef = useRef<string>('');
  const seqRef = useRef(0);

  const HOST = process.env.NEXT_PUBLIC_CONTAINER_HOST || 'osobnirobot.com';

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch container status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/containers/status');
      const data = await res.json();
      setCs(data);
      if (!data.exists || data.status === 'none') router.push('/onboarding');
    } catch {
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
    const i = setInterval(() => {
      if (cs.status === 'creating') fetchStatus();
    }, 5000);
    return () => clearInterval(i);
  }, [fetchStatus, cs.status]);

  // Load chat history when WebSocket connects
  const loadHistory = useCallback((ws: WebSocket) => {
    const reqId = crypto.randomUUID();
    ws.send(JSON.stringify({
      type: 'req',
      id: reqId,
      method: 'chat.history',
      params: { sessionKey: 'agent:main:main', limit: 100 }
    }));
  }, []);

  // Connect WebSocket
  useEffect(() => {
    if (cs.status !== 'running' || !cs.gatewayPort || !cs.gatewayToken) return;

    const connect = () => {
      const wsUrl = `wss://${cs.gatewayPort}.gw.${HOST}/?token=${cs.gatewayToken}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WS connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWsMessage(data, ws);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('WS closed:', event.code, event.reason);
        setConnected(false);
        wsRef.current = null;
        // Reconnect after 3s unless intentional close
        if (event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('WS error:', err);
      };
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000);
        wsRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cs.status, cs.gatewayPort, cs.gatewayToken, HOST]);

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((data: any, ws: WebSocket) => {
    // Connection challenge - respond to establish connection
    if (data.type === 'event' && data.event === 'connect.challenge') {
      ws.send(JSON.stringify({
        type: 'event',
        event: 'connect.response',
        payload: { nonce: data.payload.nonce }
      }));
      return;
    }

    // Health event - we're connected
    if (data.type === 'event' && data.event === 'health') {
      setConnected(true);
      loadHistory(ws);
      return;
    }

    // Chat history response
    if (data.type === 'res' && data.ok) {
      if (data.payload?.messages) {
        const historyMsgs: ChatMessage[] = data.payload.messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .filter((m: any) => m.content && m.content.length > 0)
          .map((m: any) => ({
            id: m.id || crypto.randomUUID(),
            role: m.role,
            content: Array.isArray(m.content)
              ? m.content.map((c: any) => c.text || '').join('')
              : m.content,
            timestamp: new Date(m.timestamp || Date.now()),
          }))
          .filter((m: ChatMessage) => m.content.trim() !== '');
        if (historyMsgs.length > 0) {
          setMessages(historyMsgs);
        }
      }
      // chat.send response - run started
      if (data.payload?.status === 'started') {
        currentAssistantMsgRef.current = '';
      }
      return;
    }

    // Agent lifecycle events
    if (data.type === 'event' && data.event === 'agent') {
      const { stream, data: eventData } = data.payload || {};

      // Text streaming
      if (stream === 'text' && eventData?.text) {
        currentAssistantMsgRef.current += eventData.text;
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.id === 'streaming') {
            return [...prev.slice(0, -1), { ...last, content: currentAssistantMsgRef.current }];
          } else {
            return [...prev, {
              id: 'streaming',
              role: 'assistant',
              content: currentAssistantMsgRef.current,
              timestamp: new Date(),
            }];
          }
        });
      }

      // Lifecycle end - finalize message
      if (stream === 'lifecycle' && eventData?.phase === 'end') {
        setSending(false);
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.id === 'streaming') {
            return [...prev.slice(0, -1), { ...last, id: data.payload.runId || crypto.randomUUID() }];
          }
          return prev;
        });
        // Reload history to get the actual stored messages
        if (wsRef.current) {
          setTimeout(() => loadHistory(wsRef.current!), 500);
        }
      }
      return;
    }

    // Chat event with final state
    if (data.type === 'event' && data.event === 'chat') {
      if (data.payload?.state === 'final') {
        setSending(false);
      }
      return;
    }
  }, [loadHistory]);

  // Send message
  const sendMessage = useCallback(() => {
    if (!input.trim() || !wsRef.current || !connected || sending) return;

    const text = input.trim();
    setInput('');
    setSending(true);
    currentAssistantMsgRef.current = '';

    // Add user message to UI immediately
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }]);

    // Send via WebSocket
    const reqId = crypto.randomUUID();
    wsRef.current.send(JSON.stringify({
      type: 'req',
      id: reqId,
      method: 'chat.send',
      params: {
        sessionKey: 'agent:main:main',
        message: text,
        deliver: false,
        idempotencyKey: reqId,
      }
    }));

    inputRef.current?.focus();
  }, [input, connected, sending]);

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle restart
  const handleRestart = async () => {
    await fetch('/api/containers/restart', { method: 'POST' });
    window.location.reload();
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Učitavanje...</p>
        </div>
      </div>
    );
  }

  // --- Provisioning ---
  if (cs.status === 'creating') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4]">
        <div className="text-center max-w-md px-8">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Postavljam {cs.assistantName || 'asistenta'}...
          </h2>
          <p className="text-gray-500 text-sm">To može potrajati do minute.</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (cs.status === 'error' || cs.status === 'stopped') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8f7f4]">
        <div className="text-center max-w-md px-8">
          <p className="text-4xl mb-4">😔</p>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Nešto je pošlo po krivu
          </h2>
          <p className="text-gray-500 text-sm mb-6">Problem s pokretanjem asistenta.</p>
          <button
            onClick={handleRestart}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm hover:bg-blue-600 transition-colors"
          >
            Ponovno pokreni
          </button>
        </div>
      </div>
    );
  }

  // --- Settings panel ---
  if (showSettings) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8f7f4]">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setShowSettings(false)} className="text-gray-600 hover:text-gray-800 p-1">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-800">Postavke</h1>
          <div className="w-8" />
        </header>

        <div className="flex-1 p-4 max-w-lg mx-auto w-full">
          <div className="bg-white rounded-xl p-5 shadow-sm space-y-5">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Asistent</p>
              <p className="text-gray-800">{cs.assistantName || 'Asistent'}</p>
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Plan</p>
              <p className="text-gray-800">
                {cs.plan === 'trial' ? 'Probno razdoblje (7 dana)' : cs.plan || 'Besplatno'}
              </p>
              {cs.plan === 'trial' && (
                <a href="/api/stripe/checkout" className="text-blue-500 text-sm mt-1 inline-block">
                  Nadogradi →
                </a>
              )}
            </div>
            <div className="border-t border-gray-100" />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Kanali</p>
              <p className="text-gray-600 text-sm">✅ Web chat</p>
              <p className="text-gray-400 text-sm">📱 Telegram — uskoro</p>
              <p className="text-gray-400 text-sm">💬 WhatsApp — uskoro</p>
            </div>
            <div className="border-t border-gray-100" />
            <button
              onClick={handleRestart}
              className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              🔄 Ponovno pokreni asistenta
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                const supabase = createBrowserClient(
                  process.env.NEXT_PUBLIC_SUPABASE_URL!,
                  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
                );
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-gray-400 text-sm hover:text-gray-600"
            >
              Odjava
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Chat UI ---
  return (
    <div className="flex flex-col h-screen bg-[#f8f7f4]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
            {(cs.assistantName || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-800 leading-tight">
              {cs.assistantName || 'Asistent'}
            </h1>
            <p className={`text-xs ${connected ? 'text-green-500' : 'text-gray-400'}`}>
              {connected ? 'Online' : 'Spajanje...'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Postavke"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && connected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold shadow-lg mb-4">
              {(cs.assistantName || 'A').charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              {cs.assistantName || 'Asistent'}
            </h2>
            <p className="text-gray-400 text-sm">Pošalji poruku za početak razgovora</p>
          </div>
        )}

        <div className="max-w-2xl mx-auto space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && !currentAssistantMsgRef.current && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-400 shadow-sm border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Napiši poruku...' : 'Spajanje...'}
            disabled={!connected}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:opacity-50 transition-all"
            style={{ maxHeight: '120px' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !connected || sending}
            className="shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-30 disabled:hover:bg-blue-500 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
