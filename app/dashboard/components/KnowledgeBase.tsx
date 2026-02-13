'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { Employee, KnowledgeFile, EmployeeKnowledge } from '@/lib/types';
import { listFiles, uploadFile, deleteFile, getKnowledge } from '@/lib/api/employees';
import { FILE_UPLOAD_MAX_SIZE, FILE_UPLOAD_ALLOWED_TYPES } from '@/lib/constants';

interface KnowledgeBaseProps {
  employee: Employee;
}

export function KnowledgeBase({ employee }: KnowledgeBaseProps) {
  const [knowledge, setKnowledge] = useState<EmployeeKnowledge | null>(null);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(true);
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
    fetchFiles();
  }, [fetchKnowledge, fetchFiles]);

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
      {/* What employee knows */}
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
                  <span className="text-xs">📄</span>
                  <span className="text-xs truncate">{file.name}</span>
                  <span className="text-[10px] text-[var(--muted)]">{(file.size / 1024).toFixed(1)}KB</span>
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

function KnowledgeSection({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 200);
  const hasMore = content.length > 200;

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="text-xs font-semibold text-[var(--accent2)] mb-1 flex items-center gap-1">
        <span className="transition-transform" style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}>▸</span>
        {title}
      </button>
      <p className="text-xs text-[var(--dim)] leading-relaxed whitespace-pre-wrap">
        {expanded ? content : preview}{hasMore && !expanded ? '...' : ''}
      </p>
    </div>
  );
}
