'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Employee, KnowledgeFile, EmployeeKnowledge, EmployeeDoc } from '@/lib/types';
import { listFiles, uploadFile, deleteFile, getKnowledge, getDocs, updateDoc } from '@/lib/api/employees';
import { FILE_UPLOAD_MAX_SIZE, FILE_UPLOAD_ALLOWED_TYPES } from '@/lib/constants';

interface KnowledgeBaseProps {
  employee: Employee;
}

export function KnowledgeBase({ employee }: KnowledgeBaseProps) {
  const [knowledge, setKnowledge] = useState<EmployeeKnowledge | null>(null);
  const [docs, setDocs] = useState<EmployeeDoc[]>([]);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchKnowledge = useCallback(async () => {
    try {
      const data = await getKnowledge(employee.id);
      setKnowledge(data);
    } catch {
      // Knowledge not available yet
    } finally {
      setLoadingKnowledge(false);
    }
  }, [employee.id]);

  const fetchDocs = useCallback(async () => {
    try {
      const data = await getDocs(employee.id);
      setDocs(data);
    } catch {
      // Docs not available yet
    } finally {
      setLoadingDocs(false);
    }
  }, [employee.id]);

  const fetchFiles = useCallback(async () => {
    try {
      const data = await listFiles(employee.id);
      setFiles(data);
    } catch {
      // Files not available yet
    } finally {
      setLoadingFiles(false);
    }
  }, [employee.id]);

  useEffect(() => {
    fetchKnowledge();
    fetchDocs();
    fetchFiles();
  }, [fetchKnowledge, fetchDocs, fetchFiles]);

  const handleUpload = async (file: File) => {
    if (file.size > FILE_UPLOAD_MAX_SIZE) {
      setError(`File too large. Max ${FILE_UPLOAD_MAX_SIZE / (1024 * 1024)}MB.`);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!FILE_UPLOAD_ALLOWED_TYPES.includes(ext)) {
      setError(`File type .${ext} not allowed.`);
      return;
    }
    setUploading(true);
    setError('');
    try {
      await uploadFile(employee.id, file);
      await fetchFiles();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    try {
      await deleteFile(employee.id, filename);
      setFiles(files.filter(f => f.name !== filename));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      {/* Your Documents — editable */}
      <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
        <h2 className="text-sm font-semibold mb-1">Your Documents</h2>
        <p className="text-xs text-[var(--muted)] mb-3">
          Tell {employee.name} about your business. Edit these documents — {employee.name} reads them before every task.
        </p>
        {loadingDocs ? (
          <p className="text-xs text-[var(--muted)]">Loading documents...</p>
        ) : docs.length > 0 ? (
          <div className="space-y-2">
            {docs.map(doc => (
              <DocCard key={doc.filename} doc={doc} employeeId={employee.id} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Documents will be available once the container is running.
          </p>
        )}
      </div>

      {/* What employee knows — read-only */}
      <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
        <h2 className="text-sm font-semibold mb-3">What {employee.name} knows</h2>
        {loadingKnowledge ? (
          <p className="text-xs text-[var(--muted)]">Loading knowledge...</p>
        ) : knowledge?.companyProfile ? (
          <div className="space-y-3">
            {knowledge.companyProfile && (
              <KnowledgeSection title="Company Profile" content={knowledge.companyProfile} />
            )}
            {knowledge.researchFindings && (
              <KnowledgeSection title="Research Findings" content={knowledge.researchFindings} />
            )}
            {knowledge.pendingQuestions && (
              <KnowledgeSection title="Pending Questions" content={knowledge.pendingQuestions} />
            )}
            {knowledge.suggestions && (
              <KnowledgeSection title="Suggestions" content={knowledge.suggestions} />
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            {employee.name} hasn&apos;t built their knowledge base yet. They will start learning once their container is running.
          </p>
        )}
      </div>

      {/* Reference files */}
      <div className="p-5 rounded-[10px] border border-[var(--border)]" style={{ background: '#151515' }}>
        <h2 className="text-sm font-semibold mb-3">Reference Files</h2>
        <p className="text-xs text-[var(--muted)] mb-3">
          Upload files for {employee.name} to read and learn from. Supported: {FILE_UPLOAD_ALLOWED_TYPES.join(', ')}.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center cursor-pointer hover:border-[var(--accent)] transition-colors mb-3"
        >
          <p className="text-xs text-[var(--muted)]">
            {uploading ? 'Uploading...' : 'Drag & drop a file here, or click to browse'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={FILE_UPLOAD_ALLOWED_TYPES.map(t => `.${t}`).join(',')}
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

        {/* File list */}
        {loadingFiles ? (
          <p className="text-xs text-[var(--muted)]">Loading files...</p>
        ) : files.length > 0 ? (
          <div className="space-y-2">
            {files.map(file => (
              <div key={file.name} className="flex items-center justify-between p-2.5 rounded border border-[var(--border)]" style={{ background: '#0a0a0a' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs truncate">{file.name}</span>
                  {file.size > 0 && <span className="text-[10px] text-[var(--muted)]">{(file.size / 1024).toFixed(1)}KB</span>}
                </div>
                <button
                  onClick={() => handleDelete(file.name)}
                  className="text-xs text-red-400 hover:text-red-300 px-2 shrink-0"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">No reference files uploaded yet.</p>
        )}
      </div>
    </div>
  );
}

function DocCard({ doc, employeeId }: { doc: EmployeeDoc; employeeId: string }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(doc.content);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasContent = doc.content.trim().length > 0;
  // Check if the doc has been filled in (more than just the template headers)
  const lines = doc.content.split('\n').filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('<!--') && !l.startsWith('-') && !l.startsWith('**'));
  const isFilled = lines.length > 2;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(employeeId, doc.filename, content);
      setSaved(true);
      setEditing(false);
      // Update local doc state
      doc.content = content;
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Error handled silently
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(doc.content);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded border border-[var(--accent)] p-3" style={{ background: '#0a0a0a' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">{doc.title}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="text-xs text-[var(--muted)] hover:text-[var(--text)] px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs bg-[var(--accent)] text-black px-3 py-1 rounded hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-[#151515] border border-[var(--border)] rounded p-3 text-xs text-[var(--text)] leading-relaxed resize-y focus:outline-none focus:border-[var(--accent)]"
          rows={12}
          style={{ fontFamily: 'monospace', minHeight: '200px' }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between p-3 rounded border border-[var(--border)] cursor-pointer hover:border-[var(--accent)] transition-colors"
      style={{ background: '#0a0a0a' }}
      onClick={() => setEditing(true)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{doc.title}</span>
          {saved && <span className="text-[10px] text-green-400">Saved</span>}
          {!isFilled && hasContent && (
            <span className="text-[10px] text-yellow-400/70">Not filled in</span>
          )}
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-0.5">{doc.description}</p>
      </div>
      <span className="text-xs text-[var(--muted)] shrink-0 ml-2">Edit</span>
    </div>
  );
}

function KnowledgeSection({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 200);
  const hasMore = content.length > 200;

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs font-semibold text-[var(--accent2)] mb-1 flex items-center gap-1">
        <span className="transition-transform" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>&#9654;</span>
        {title}
      </button>
      <p className="text-xs text-[var(--dim)] leading-relaxed whitespace-pre-wrap">
        {expanded ? content : preview}{hasMore && !expanded ? '...' : ''}
      </p>
    </div>
  );
}
