'use client';

import React, { useState } from 'react';
import {
  FolderPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  UploadCloud,
  Check,
  X,
  RefreshCw,
  Folder,
} from 'lucide-react';
import { r2Fetch } from '@/lib/r2-api-client';
import { useI18n } from '@/lib/i18n-context';

interface CreateFolderModalProps {
  isOpen: boolean;
  parentPath: string;
  onClose: () => void;
  onSuccess: (newPath: string) => void;
}

export function CreateFolderModal({
  isOpen,
  parentPath,
  onClose,
  onSuccess,
}: CreateFolderModalProps) {
  const { t } = useI18n();
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sanitized = folderName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');

  const fullPath = parentPath ? `${parentPath}${sanitized}/` : `${sanitized}/`;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitized) {
      setError(t.modals.createValidNameError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await r2Fetch('/api/r2/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: fullPath }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(fullPath);
        onClose();
        setFolderName('');
      } else {
        setError(data.error || t.modals.createFailError);
      }
    } catch (err: any) {
      setError(err.message || t.modals.createNetworkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">{t.modals.createFolderTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.createFolderParent}</label>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{parentPath || t.modals.rootFolderFallback}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.createFolderSubName}</label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder={t.modals.createFolderPlaceholder}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {sanitized && (
            <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs">
              <span className="text-slate-400">{t.modals.createFullPath} </span>
              <span className="font-mono text-blue-300 font-semibold">{fullPath}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !sanitized}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{t.modals.createFolderButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RenameFolderModalProps {
  isOpen: boolean;
  currentPath: string;
  onClose: () => void;
  onSuccess: (newPath: string) => void;
}

export function RenameFolderModal({
  isOpen,
  currentPath,
  onClose,
  onSuccess,
}: RenameFolderModalProps) {
  const { t } = useI18n();
  // Extract old folder leaf name
  const clean = currentPath.replace(/\/+$/, '');
  const parts = clean.split('/');
  const leafName = parts[parts.length - 1];
  const parentPrefix = parts.length > 1 ? parts.slice(0, parts.length - 1).join('/') + '/' : '';

  const [newName, setNewName] = useState(leafName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sanitized = newName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-');

  const fullNewPath = `${parentPrefix}${sanitized}/`;

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sanitized || sanitized === leafName) {
      setError(t.modals.renameDiffError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await r2Fetch('/api/r2/folders/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: currentPath, newPath: fullNewPath }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(fullNewPath);
        onClose();
      } else {
        setError(data.error || t.modals.renameFailError);
      }
    } catch (err: any) {
      setError(err.message || t.modals.renameNetworkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">{t.modals.renameFolderTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleRename} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.renameFolderCurrent}</label>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              {currentPath}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.renameFolderNew}</label>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
            />
          </div>

          {sanitized && (
            <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/40 text-xs">
              <span className="text-slate-400">{t.modals.newPathAfterRename} </span>
              <span className="font-mono text-amber-300 font-semibold">{fullNewPath}</span>
            </div>
          )}

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
            {t.modals.renameNote}
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={loading || !sanitized || sanitized === leafName}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{t.modals.renameFolderButton}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteFolderModalProps {
  isOpen: boolean;
  folderPath: string;
  fileCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteFolderModal({
  isOpen,
  folderPath,
  fileCount,
  onClose,
  onSuccess,
}: DeleteFolderModalProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await r2Fetch('/api/r2/folders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || t.modals.deleteFailError);
      }
    } catch (err: any) {
      setError(err.message || t.modals.deleteNetworkError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-red-900/60 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-red-400">
            <Trash2 className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold text-white">{t.modals.deleteFolderTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            {t.modals.deleteFolderPrompt}
          </p>

          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-red-300 font-semibold">
            {folderPath}
          </div>

          <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              {t.modals.deleteFolderWarning.replace('{count}', String(fileCount))}
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{t.modals.deleteFolderButton}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UploadToFolderModalProps {
  isOpen: boolean;
  folderPath: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadToFolderModal({
  isOpen,
  folderPath,
  onClose,
  onSuccess,
}: UploadToFolderModalProps) {
  const { t } = useI18n();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetFolder = folderPath === 'all' ? '' : folderPath;

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const progressMsg = t.modals.uploadUploadingProgress
          .replace('{current}', String(i + 1))
          .replace('{total}', String(selectedFiles.length))
          .replace('{name}', file.name);
        setProgress(progressMsg);

        const sanitizedName = file.name
          .toLowerCase()
          .replace(/[^a-z0-9.-]/g, '-')
          .replace(/-+/g, '-');

        const key = targetFolder ? `${targetFolder}${sanitizedName}` : sanitizedName;

        const res = await r2Fetch('/api/r2/upload', {
          method: 'POST',
          headers: {
            'x-r2-key': encodeURIComponent(key),
            'x-r2-content-type': file.type || 'image/webp',
          },
          body: file,
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || `Upload failed: ${file.name}`);
        }
      }

      onSuccess();
      onClose();
      setSelectedFiles([]);
    } catch (err: any) {
      setError(err.message || t.modals.uploadFailError);
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">{t.modals.uploadModalTitle}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.uploadModalTarget}</label>
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-blue-300 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{targetFolder || t.modals.rootFolderFallback}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">{t.modals.uploadDropzoneLabel}</label>
            <input
              type="file"
              multiple
              accept="image/*,.webp,.png,.jpg,.jpeg,.svg,.gif"
              onChange={handleFiles}
              className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-700"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
              {t.modals.uploadSelectedCount
                .replace('{count}', String(selectedFiles.length))
                .replace(
                  '{size}',
                  (selectedFiles.reduce((acc, f) => acc + f.size, 0) / 1024).toFixed(1)
                )}
            </div>
          )}

          {progress && (
            <div className="text-xs text-blue-400 font-mono flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{progress}</span>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/60 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs font-semibold text-white transition flex items-center gap-1.5"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{t.modals.uploadingButton}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{t.modals.uploadButton}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
