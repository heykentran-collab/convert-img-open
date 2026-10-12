'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Database,
  Search,
  RefreshCw,
  Copy,
  Wand2,
  Trash2,
  ExternalLink,
  Check,
  AlertTriangle,
  Folder,
  FolderPlus,
  FolderOpen,
  Pencil,
  UploadCloud,
  ChevronRight,
  Home,
  Settings,
  Cloud,
} from 'lucide-react';
import { R2File, R2FolderNode, R2FolderTreeResponse } from '@/types/r2';
import { r2Fetch } from '@/lib/r2-api-client';
import { getStorageSettings } from '@/lib/storage-settings';
import FolderTree from '@/components/r2/FolderTree';
import {
  CreateFolderModal,
  RenameFolderModal,
  DeleteFolderModal,
  UploadToFolderModal,
} from '@/components/r2/FolderModals';
import { useI18n } from '@/lib/i18n-context';

export default function CloudExplorerPage() {
  const { t } = useI18n();
  const [tree, setTree] = useState<R2FolderNode[]>([]);
  const [files, setFiles] = useState<R2File[]>([]);
  const [immediateSubfolders, setImmediateSubfolders] = useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(''); // '' represents root bucket folder
  const [recursive, setRecursive] = useState<boolean>(false); // default non-recursive to load only direct root items
  const [search, setSearch] = useState<string>('');
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [loadingTree, setLoadingTree] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<string>('');
  const [isCloudConfigured, setIsCloudConfigured] = useState<boolean | null>(null);

  const checkConfiguration = useCallback(() => {
    const s = getStorageSettings();
    const configured = !!(
      s.cloudStorage?.bucketName &&
      (s.cloudStorage?.apiToken || (s.cloudStorage?.accessKeyId && s.cloudStorage?.secretAccessKey))
    );
    setIsCloudConfigured(configured);
    if (s.cloudStorage?.bucketName) {
      setActiveBucket(s.cloudStorage.bucketName);
    } else {
      setActiveBucket('');
    }
    return configured;
  }, []);

  useEffect(() => {
    checkConfiguration();
    const handleStorageChange = () => checkConfiguration();
    window.addEventListener('storage_settings_updated', handleStorageChange);
    return () => window.removeEventListener('storage_settings_updated', handleStorageChange);
  }, [checkConfiguration]);

  // Modals state
  const [createModal, setCreateModal] = useState<{ isOpen: boolean; parentPath: string }>({
    isOpen: false,
    parentPath: '',
  });
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; currentPath: string }>({
    isOpen: false,
    currentPath: '',
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    folderPath: string;
    fileCount: number;
  }>({
    isOpen: false,
    folderPath: '',
    fileCount: 0,
  });
  const [uploadModal, setUploadModal] = useState<boolean>(false);

  // Fetch full folder tree (uses server in-memory cache by default for instant loads)
  const fetchTree = useCallback(async (forceRefresh = false) => {
    setLoadingTree(true);
    try {
      const res = await r2Fetch(`/api/r2/folders${forceRefresh ? '?refresh=true' : ''}`);
      const data: R2FolderTreeResponse = await res.json();
      if (data.success) {
        setTree(data.tree);
      }
    } catch (err: any) {
      console.error('Lỗi tải cây thư mục:', err);
    } finally {
      setLoadingTree(false);
    }
  }, []);

  // Fetch files based on selected folder & recursive mode
  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    setError(null);
    try {
      const prefixParam = selectedFolder === 'all' ? '' : selectedFolder;
      const url = `/api/r2/files?prefix=${encodeURIComponent(prefixParam)}&recursive=${recursive}&limit=500`;
      const res = await r2Fetch(url);
      const data = await res.json();

      if (data.success) {
        setFiles(data.files);
        setImmediateSubfolders(data.immediateSubfolders || []);
        if (data.bucketName) {
          setActiveBucket(data.bucketName);
        }
      } else {
        setError(data.error || 'Không thể tải danh sách tệp từ R2');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng khi kết nối R2');
    } finally {
      setLoadingFiles(false);
    }
  }, [selectedFolder, recursive]);

  // Initial load
  useEffect(() => {
    if (isCloudConfigured) {
      fetchTree();
    } else if (isCloudConfigured === false) {
      setLoadingTree(false);
    }
  }, [isCloudConfigured, fetchTree]);

  useEffect(() => {
    if (isCloudConfigured) {
      fetchFiles();
    } else if (isCloudConfigured === false) {
      setLoadingFiles(false);
    }
  }, [isCloudConfigured, fetchFiles]);

  const handleDeleteFile = async (key: string) => {
    const confirmMsg = t.explorer.deleteConfirm.replace('{key}', key);
    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await r2Fetch('/api/r2/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.success) {
        setFiles((prev) => prev.filter((f) => f.key !== key));
        fetchTree(); // refresh counts
      } else {
        alert('Lỗi xóa tệp: ' + data.error);
      }
    } catch (err: any) {
      alert('Lỗi xóa tệp: ' + err.message);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filter files by search term
  const filteredFiles = useMemo(() => {
    if (!search) return files;
    const lower = search.toLowerCase();
    return files.filter(
      (file) =>
        file.key.toLowerCase().includes(lower) ||
        file.name.toLowerCase().includes(lower)
    );
  }, [files, search]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Build breadcrumbs for currently selected folder
  const breadcrumbs = useMemo(() => {
    if (selectedFolder === 'all') {
      return [{ name: t.explorer.scanAllName, path: 'all' }];
    }
    if (!selectedFolder || selectedFolder === '') {
      return [{ name: t.explorer.rootName, path: '' }];
    }
    const clean = selectedFolder.replace(/\/+$/, '');
    const parts = clean.split('/');
    const crumbs = [{ name: t.explorer.rootName, path: '' }];

    let current = '';
    for (let i = 0; i < parts.length; i++) {
      current += parts[i] + '/';
      crumbs.push({ name: parts[i], path: current });
    }
    return crumbs;
  }, [selectedFolder, t]);

  // Total size of displayed files
  const totalDisplayBytes = useMemo(() => {
    return filteredFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  }, [filteredFiles]);

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500 shrink-0" />
            {t.explorer.title}
          </h1>
          {activeBucket ? (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[11px] font-mono font-medium">
              {t.explorer.bucketBadge} {activeBucket}
            </span>
          ) : (
            <Link
              href="/settings"
              className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-[11px] font-medium transition flex items-center gap-1"
            >
              <span>{t.explorer.unconfigured}</span>
              <Settings className="w-3 h-3" />
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isCloudConfigured ? (
            <>
              <button
                onClick={() => setUploadModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t.explorer.uploadToFolder}</span>
              </button>
              <button
                onClick={() => {
                  fetchTree(true);
                  fetchFiles();
                }}
                disabled={loadingFiles || loadingTree}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingFiles || loadingTree ? 'animate-spin' : ''}`}
                />
                <span>{t.explorer.refreshTree}</span>
              </button>
            </>
          ) : (
            <Link
              href="/settings"
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{t.explorer.onboardingCta}</span>
            </Link>
          )}
        </div>
      </div>

      {!isCloudConfigured ? (
        <div className="max-w-3xl mx-auto py-10 px-4">
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
              <Cloud className="w-8 h-8" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-medium">
                <Settings className="w-3.5 h-3.5" />
                <span>{t.explorer.onboardingBadge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t.explorer.onboardingTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {t.explorer.onboardingDesc}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <div className="text-blue-400 font-semibold text-xs flex items-center gap-1.5">
                  <Folder className="w-4 h-4 shrink-0" />
                  <span>{t.explorer.onboardingFeature1Title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {t.explorer.onboardingFeature1Desc}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <div className="text-indigo-400 font-semibold text-xs flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 shrink-0" />
                  <span>{t.explorer.onboardingFeature2Title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {t.explorer.onboardingFeature2Desc}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1">
                <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{t.explorer.onboardingFeature3Title}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {t.explorer.onboardingFeature3Desc}
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
              >
                <Settings className="w-4 h-4" />
                <span>{t.explorer.onboardingCta}</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Main 2-Column Layout: Left Folder Tree + Right File Explorer */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Folder Tree Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <FolderTree
            tree={tree}
            selectedFolder={selectedFolder}
            totalFiles={tree.reduce((acc, n) => acc + n.fileCount, 0)}
            loading={loadingTree}
            onSelectFolder={(path) => setSelectedFolder(path)}
            onCreateFolder={(parentPath) =>
              setCreateModal({ isOpen: true, parentPath: parentPath || '' })
            }
            onRenameFolder={(currentPath) =>
              setRenameModal({ isOpen: true, currentPath })
            }
            onDeleteFolder={(currentPath, fileCount) =>
              setDeleteModal({ isOpen: true, folderPath: currentPath, fileCount })
            }
            onRefresh={() => fetchTree(true)}
          />
        </div>

        {/* Right Column: Files & Folder Content */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-3">
          {/* Breadcrumb & Folder Action Bar */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Breadcrumb Trail */}
              <div className="flex items-center flex-wrap gap-1 text-xs">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.path}>
                      {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
                      <button
                        type="button"
                        onClick={() => setSelectedFolder(crumb.path)}
                        className={`flex items-center gap-1 px-2 py-1 rounded transition font-mono ${
                          isLast
                            ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        {idx === 0 ? <Home className="w-3 h-3 text-slate-400" /> : <Folder className="w-3 h-3 text-amber-400" />}
                        <span>{crumb.name}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Folder Actions if a specific subfolder is selected (not root and not all) */}
              {selectedFolder && selectedFolder !== 'all' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      setCreateModal({ isOpen: true, parentPath: selectedFolder })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                    title={t.explorer.createChildFolder}
                  >
                    <FolderPlus className="w-3 h-3 text-blue-400" />
                    <span>{t.explorer.createChildFolder}</span>
                  </button>
                  <button
                    onClick={() =>
                      setRenameModal({ isOpen: true, currentPath: selectedFolder })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                    title={t.explorer.renameFolder}
                  >
                    <Pencil className="w-3 h-3 text-amber-400" />
                    <span>{t.explorer.renameFolder}</span>
                  </button>
                  <button
                    onClick={() =>
                      setDeleteModal({
                        isOpen: true,
                        folderPath: selectedFolder,
                        fileCount: filteredFiles.length,
                      })
                    }
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-[11px] font-medium transition flex items-center gap-1"
                    title={t.explorer.deleteFolder}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{t.explorer.deleteFolder}</span>
                  </button>
                </div>
              )}
              {(!selectedFolder || selectedFolder === '') && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setCreateModal({ isOpen: true, parentPath: '' })}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center gap-1"
                    title={t.explorer.createRootFolder}
                  >
                    <FolderPlus className="w-3 h-3 text-blue-400" />
                    <span>{t.explorer.createRootFolder}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Folder Stats & View Options */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <span>
                  {t.explorer.folderTitle}{' '}
                  <strong className="text-slate-200 font-mono">
                    {selectedFolder === 'all'
                      ? t.explorer.allFiles
                      : !selectedFolder
                      ? t.explorer.rootFolder
                      : selectedFolder}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  <strong className="text-slate-200">{filteredFiles.length}</strong> {t.common.files}
                </span>
                <span>•</span>
                <span>
                  {t.common.size}:{' '}
                  <strong className="text-slate-200 font-mono">
                    {formatSize(totalDisplayBytes)}
                  </strong>
                </span>
              </div>

              {/* View options: Recursive toggle */}
              {selectedFolder !== 'all' && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-300 hover:text-white">
                  <input
                    type="checkbox"
                    checked={recursive}
                    onChange={(e) => setRecursive(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>{t.explorer.recursiveCheckbox}</span>
                </label>
              )}
            </div>
          </div>

          {/* Subfolders Quick Cards (if viewing a folder with subfolders) */}
          {immediateSubfolders.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.explorer.subfolders} ({immediateSubfolders.length})</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {immediateSubfolders.map((sub) => {
                  const clean = sub.replace(/\/+$/, '');
                  const leaf = clean.split('/').pop() || clean;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSelectedFolder(sub)}
                      className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-left border border-slate-700/60 hover:border-blue-500/50 transition flex items-center gap-2 group"
                    >
                      <Folder className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-mono text-slate-200 truncate group-hover:text-blue-300">
                        {leaf}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search bar */}
          <div className="relative w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.explorer.searchPlaceholder}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Error / Not Configured Banner */}
          {error && (
            <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5 text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">{t.explorer.unconfiguredBannerTitle}</div>
                  <div className="text-slate-400 mt-0.5">{error}</div>
                </div>
              </div>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs whitespace-nowrap transition shadow-sm"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t.explorer.unconfiguredBannerAction}</span>
              </Link>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingFiles && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 animate-pulse space-y-2"
                >
                  <div className="aspect-video bg-slate-800 rounded-lg"></div>
                  <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-2 bg-slate-800 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loadingFiles && filteredFiles.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                {t.explorer.emptyTitle}
              </p>
              <p className="text-xs text-slate-500">
                {t.explorer.emptySubtitle}
              </p>
              <button
                onClick={() => setUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{t.explorer.emptyAction}</span>
              </button>
            </div>
          )}

          {/* Media Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredFiles.map((file) => (
              <div
                key={file.key}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 group transition flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-video bg-slate-950 rounded-lg overflow-hidden relative mb-2 border border-slate-800">
                    <img
                      src={file.url}
                      alt={file.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300 truncate max-w-[80%]">
                      {file.folder || 'root/'}
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-600/80 text-white font-semibold uppercase">
                      {file.ext}
                    </span>
                  </div>

                  <h4
                    className="text-xs font-semibold text-slate-200 truncate font-mono"
                    title={file.name}
                  >
                    {file.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formatSize(file.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => copyToClipboard(file.url, file.key)}
                    className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition flex items-center justify-center gap-1"
                    title={t.explorer.copyUrl}
                  >
                    {copiedKey === file.key ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">{t.common.success}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-slate-400" />
                        <span>{t.explorer.copyUrl}</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/studio?imageUrl=${encodeURIComponent(file.url)}`}
                    onClick={() => {
                      sessionStorage.setItem('studio_active_image', file.url);
                      sessionStorage.setItem('studio_image_key', file.key);
                    }}
                    className="p-1 px-2 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 transition flex items-center gap-1 text-[11px] font-medium"
                    title={t.explorer.openStudio}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>{t.explorer.openStudio}</span>
                  </Link>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                    title={t.explorer.openNewTab}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleDeleteFile(file.key)}
                    className="p-1 rounded bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition"
                    title={t.explorer.deletePermanently}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Modals */}
      <CreateFolderModal
        isOpen={createModal.isOpen}
        parentPath={createModal.parentPath}
        onClose={() => setCreateModal({ isOpen: false, parentPath: '' })}
        onSuccess={(newPath) => {
          // Optimistically insert new node into tree so user sees it instantly
          const clean = newPath.replace(/\/+$/, '');
          const parts = clean.split('/');
          const leafName = parts[parts.length - 1];
          const depth = parts.length;
          const newNode: R2FolderNode = {
            name: leafName,
            path: newPath,
            depth,
            fileCount: 0,
            directFileCount: 0,
            totalBytes: 0,
            children: [],
          };

          const insertNode = (nodes: R2FolderNode[]): R2FolderNode[] => {
            if (depth === 1) {
              return [...nodes, newNode].sort((a, b) => a.name.localeCompare(b.name));
            }
            const parentPath = parts.slice(0, -1).join('/') + '/';
            return nodes.map((node) => {
              if (node.path === parentPath) {
                return {
                  ...node,
                  children: [...node.children, newNode].sort((a, b) =>
                    a.name.localeCompare(b.name)
                  ),
                };
              }
              if (node.children && node.children.length > 0) {
                return { ...node, children: insertNode(node.children) };
              }
              return node;
            });
          };

          setTree((prev) => insertNode(prev));
          setSelectedFolder(newPath);
          fetchTree(true);
        }}
      />

      <RenameFolderModal
        isOpen={renameModal.isOpen}
        currentPath={renameModal.currentPath}
        onClose={() => setRenameModal({ isOpen: false, currentPath: '' })}
        onSuccess={(newPath) => {
          fetchTree(true);
          setSelectedFolder(newPath);
        }}
      />

      <DeleteFolderModal
        isOpen={deleteModal.isOpen}
        folderPath={deleteModal.folderPath}
        fileCount={deleteModal.fileCount}
        onClose={() =>
          setDeleteModal({ isOpen: false, folderPath: '', fileCount: 0 })
        }
        onSuccess={() => {
          fetchTree(true);
          setSelectedFolder('all');
        }}
      />

      <UploadToFolderModal
        isOpen={uploadModal}
        folderPath={selectedFolder}
        onClose={() => setUploadModal(false)}
        onSuccess={() => {
          fetchFiles();
          fetchTree();
        }}
      />
    </div>
  );
}
