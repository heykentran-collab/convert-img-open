'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  HardDrive,
  Cloud,
  Download,
  FolderCheck,
  Check,
  AlertCircle,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Save,
  Key,
  Globe,
  FolderOpen,
  Info,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  UnifiedStorageSettings,
  CloudStorageProvider,
  StorageDestinationType,
} from '@/types/storage';
import {
  getStorageSettings,
  saveStorageSettings,
  pickLocalDirectory,
  getStoredDirectoryHandle,
  clearStoredDirectoryHandle,
  isFileSystemAccessSupported,
  saveFileToLocalDirectory,
  DEFAULT_CLOUD_CONFIG,
} from '@/lib/storage-settings';
import { useI18n } from '@/lib/i18n-context';

export default function SettingsPage() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<UnifiedStorageSettings>(getStorageSettings);
  const [activeTab, setActiveTab] = useState<StorageDestinationType>('download');
  const [hasFileSystemApi, setHasFileSystemApi] = useState<boolean>(true);
  const [localDirName, setLocalDirName] = useState<string>('');
  const [pickingFolder, setPickingFolder] = useState<boolean>(false);
  const [testLocalResult, setTestLocalResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Cloud testing & UI states
  const [showSecretKey, setShowSecretKey] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [testingCloud, setTestingCloud] = useState<boolean>(false);
  const [cloudTestResult, setCloudTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  useEffect(() => {
    setHasFileSystemApi(isFileSystemAccessSupported());
    const loaded = getStorageSettings();
    setSettings(loaded);
    setActiveTab(loaded.activeDestination || 'download');

    // Check stored local handle
    getStoredDirectoryHandle().then((handle) => {
      if (handle) {
        setLocalDirName(handle.name);
      }
    });
  }, []);

  // Update active destination
  const handleSetActiveDestination = (dest: StorageDestinationType) => {
    const updated: UnifiedStorageSettings = {
      ...settings,
      activeDestination: dest,
    };
    setSettings(updated);
    saveStorageSettings(updated);
  };

  // Local folder handlers
  const handlePickFolder = async () => {
    setPickingFolder(true);
    setTestLocalResult(null);
    try {
      const res = await pickLocalDirectory();
      if (res.success && res.folderName) {
        setLocalDirName(res.folderName);
        const updated = getStorageSettings();
        setSettings(updated);
        setTestLocalResult({
          success: true,
          message: t.settingsPage.linkSuccessToast.replace('{folder}', res.folderName),
        });
      } else if (res.error) {
        setTestLocalResult({
          success: false,
          message: res.error,
        });
      }
    } finally {
      setPickingFolder(false);
    }
  };

  const handleTestWriteLocal = async () => {
    setTestLocalResult({
      success: true,
      message: t.settingsPage.checkWritePermToast,
    });
    const testBlob = new Blob(['volticen_local_write_test_' + Date.now()], {
      type: 'text/plain',
    });
    const res = await saveFileToLocalDirectory('.test_write_access.txt', testBlob);
    if (res.success) {
      setTestLocalResult({
        success: true,
        message: t.settingsPage.testWriteSuccessToast,
      });
    } else {
      setTestLocalResult({
        success: false,
        message: t.settingsPage.testWriteErrorToast.replace('{error}', res.error || ''),
      });
    }
  };

  const handleClearLocalFolder = async () => {
    await clearStoredDirectoryHandle();
    setLocalDirName('');
    const updated: UnifiedStorageSettings = {
      ...settings,
      activeDestination: settings.activeDestination === 'local_folder' ? 'download' : settings.activeDestination,
      localFolder: {
        enabled: false,
        folderName: '',
        autoSaveOnDone: false,
        createSubfolders: false,
      },
    };
    setSettings(updated);
    saveStorageSettings(updated);
    setTestLocalResult({
      success: true,
      message: t.settingsPage.disconnectedFolderToast,
    });
  };

  const handleToggleAutoSave = (checked: boolean) => {
    const updated: UnifiedStorageSettings = {
      ...settings,
      localFolder: {
        ...settings.localFolder,
        autoSaveOnDone: checked,
      },
    };
    setSettings(updated);
    saveStorageSettings(updated);
  };

  const handleToggleSubfolders = (checked: boolean) => {
    const updated: UnifiedStorageSettings = {
      ...settings,
      localFolder: {
        ...settings.localFolder,
        createSubfolders: checked,
      },
    };
    setSettings(updated);
    saveStorageSettings(updated);
  };

  // Cloud config handlers
  const handleCloudChange = (key: string, value: any) => {
    setSettings((prev: UnifiedStorageSettings) => ({
      ...prev,
      cloudStorage: {
        ...prev.cloudStorage,
        [key]: value,
      },
    }));
  };

  const handleSaveCloudConfig = () => {
    saveStorageSettings(settings);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleResetCloudConfig = () => {
    if (confirm(t.settingsPage.clearCloudConfirm)) {
      const updated: UnifiedStorageSettings = {
        ...settings,
        activeDestination: settings.activeDestination === 'cloud_s3' ? 'download' : settings.activeDestination,
        cloudStorage: DEFAULT_CLOUD_CONFIG,
      };
      setSettings(updated);
      saveStorageSettings(updated);
      setCloudTestResult(null);
    }
  };

  const handleTestCloudConnection = async () => {
    setTestingCloud(true);
    setCloudTestResult(null);
    try {
      const res = await fetch('/api/r2/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.cloudStorage),
      });
      const data = await res.json();
      setCloudTestResult({
        success: data.success,
        message: data.message || data.error || t.settingsPage.testCloudCompleteToast,
      });
    } catch (err: any) {
      setCloudTestResult({
        success: false,
        message: err.message || t.settingsPage.testCloudNetworkErrorToast,
      });
    } finally {
      setTestingCloud(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Settings className="w-4 h-4" />
            </div>
            <span>{t.settingsPage.title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.settingsPage.subtitle}
          </p>
        </div>

        {/* Live Active Pill Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">{t.settingsPage.activeDestinationLabel}</span>
          <span className="text-xs font-semibold flex items-center gap-1.5">
            {settings.activeDestination === 'local_folder' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-mono">
                  {settings.localFolder.folderName || t.settingsPage.tabLocalFolderTitle}
                </span>
              </>
            ) : settings.activeDestination === 'cloud_s3' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-300 font-mono">
                  {settings.cloudStorage.bucketName || t.settingsPage.tabCloudTitle}
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">{t.settingsPage.tabDownloadTitle}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-1.5">
        {/* Tab 1: Download */}
        <button
          type="button"
          onClick={() => setActiveTab('download')}
          className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'download'
              ? 'bg-slate-900 border border-slate-700/80 shadow-md shadow-black/40 ring-1 ring-white/5'
              : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                activeTab === 'download'
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  activeTab === 'download' ? 'text-white' : 'text-slate-300'
                }`}
              >
                {t.settingsPage.tabDownloadTitle}
              </div>
              <div className="text-[11px] text-slate-400 truncate">{t.settingsPage.tabDownloadDesc}</div>
            </div>
          </div>
          {settings.activeDestination === 'download' && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 shrink-0">
              {t.settingsPage.inUseBadge}
            </span>
          )}
        </button>

        {/* Tab 2: Local Folder */}
        <button
          type="button"
          onClick={() => setActiveTab('local_folder')}
          className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'local_folder'
              ? 'bg-slate-900 border border-slate-700/80 shadow-md shadow-black/40 ring-1 ring-white/5'
              : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                activeTab === 'local_folder'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  activeTab === 'local_folder' ? 'text-white' : 'text-slate-300'
                }`}
              >
                {t.settingsPage.tabLocalFolderTitle}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {localDirName || t.settingsPage.notLinked}
              </div>
            </div>
          </div>
          {settings.activeDestination === 'local_folder' && (
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
              {t.settingsPage.inUseBadge}
            </span>
          )}
        </button>

        {/* Tab 3: Cloud Storage */}
        <button
          type="button"
          onClick={() => setActiveTab('cloud_s3')}
          className={`p-3.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
            activeTab === 'cloud_s3'
              ? 'bg-slate-900 border border-slate-700/80 shadow-md shadow-black/40 ring-1 ring-white/5'
              : 'hover:bg-slate-900/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                activeTab === 'cloud_s3'
                  ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-xs font-bold truncate ${
                  activeTab === 'cloud_s3' ? 'text-white' : 'text-slate-300'
                }`}
              >
                {t.settingsPage.tabCloudTitle}
              </div>
              <div className="text-[11px] text-slate-400 truncate font-mono">
                {settings.cloudStorage.bucketName || t.settingsPage.notConfigured}
              </div>
            </div>
          </div>
          {settings.activeDestination === 'cloud_s3' && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shrink-0">
              {t.settingsPage.inUseBadge}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* PANEL 1: DOWNLOAD PREFERENCES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'download' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{t.settingsPage.downloadPanelTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.settingsPage.downloadPanelDesc}
                </p>
              </div>
            </div>

            {settings.activeDestination !== 'download' ? (
              <button
                type="button"
                onClick={() => handleSetActiveDestination('download')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer shrink-0"
              >
                {t.settingsPage.selectAsDestination}
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.settingsPage.isPrimaryDestination}
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              {t.settingsPage.downloadFeaturesTitle}
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 ml-1">
              <li>{t.settingsPage.downloadFeature1}</li>
              <li>{t.settingsPage.downloadFeature2}</li>
              <li>{t.settingsPage.downloadFeature3}</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-800/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-blue-400">{t.settingsPage.downloadTipLabel}</span> {t.settingsPage.downloadTipText}{' '}
              <button
                type="button"
                onClick={() => setActiveTab('local_folder')}
                className="text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                {t.settingsPage.downloadTipLocalLink}
              </button>{' '}
              {t.settingsPage.downloadTipSuffix}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('local_folder')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>{t.settingsPage.exploreNow}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 2: LOCAL FOLDER ACCESS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'local_folder' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg space-y-5 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{t.settingsPage.localFolderPanelTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.settingsPage.localFolderPanelDesc}
                </p>
              </div>
            </div>

            {settings.activeDestination !== 'local_folder' ? (
              <button
                type="button"
                onClick={() => handleSetActiveDestination('local_folder')}
                disabled={!localDirName}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {t.settingsPage.selectAsDestination}
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.settingsPage.isPrimaryDestination}
              </span>
            )}
          </div>

          {!hasFileSystemApi && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{t.settingsPage.localFolderNotSupported}</span>
            </div>
          )}

          {/* Drive Status Widget */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">{t.settingsPage.selectedFolderLabel}</span>
                  {localDirName ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {t.settingsPage.permissionsReady}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">{t.settingsPage.noFolderSelected}</span>
                  )}
                </div>
                <div className="text-sm sm:text-base font-bold text-white font-mono truncate mt-0.5">
                  {localDirName || t.settingsPage.noFolderLinkedOnDevice}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handlePickFolder}
                disabled={pickingFolder || !hasFileSystemApi}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>{localDirName ? t.settingsPage.changeFolder : t.settingsPage.chooseFolder}</span>
              </button>

              {localDirName && (
                <>
                  <button
                    type="button"
                    onClick={handleTestWriteLocal}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition flex items-center gap-1 cursor-pointer"
                    title={t.settingsPage.testWriteButton}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t.settingsPage.testWriteButton}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLocalFolder}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 transition cursor-pointer"
                    title={t.settingsPage.disconnectFolderTooltip}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {testLocalResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                testLocalResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {testLocalResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{testLocalResult.message}</span>
            </div>
          )}

          {/* Toggles & Preferences Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {t.settingsPage.automationTitle}
            </h3>

            {/* Toggle 1: Auto-save on done */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white">
                  {t.settingsPage.autoSaveTitle}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t.settingsPage.autoSaveDesc}
                </div>
              </div>

              {/* iOS-style Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={settings.localFolder.autoSaveOnDone}
                onClick={() => handleToggleAutoSave(!settings.localFolder.autoSaveOnDone)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.localFolder.autoSaveOnDone ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.localFolder.autoSaveOnDone ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="border-t border-slate-900" />

            {/* Toggle 2: Subfolder organization */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-white">
                  {t.settingsPage.subfoldersTitle}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t.settingsPage.subfoldersDesc}
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={!!settings.localFolder.createSubfolders}
                onClick={() => handleToggleSubfolders(!settings.localFolder.createSubfolders)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.localFolder.createSubfolders ? 'bg-emerald-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.localFolder.createSubfolders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PANEL 3: CLOUD S3 / CLOUDFLARE R2                                         */}
      {/* ========================================================================= */}
      {activeTab === 'cloud_s3' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/90 shadow-lg space-y-6 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">{t.settingsPage.cloudPanelTitle}</h2>
                  <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    BYOS Safe
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t.settingsPage.cloudPanelDesc}
                </p>
              </div>
            </div>

            {settings.activeDestination !== 'cloud_s3' ? (
              <button
                type="button"
                onClick={() => handleSetActiveDestination('cloud_s3')}
                disabled={!settings.cloudStorage.bucketName}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {t.settingsPage.selectAsDestination}
              </button>
            ) : (
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.settingsPage.isPrimaryDestination}
              </span>
            )}
          </div>

          {/* Privacy Banner */}
          <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/30 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong>{t.settingsPage.privacyTitle}</strong> {t.settingsPage.privacyText}
            </div>
          </div>

          {/* Cloud Test Feedback */}
          {cloudTestResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
                cloudTestResult.success
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/40 border-red-800/60 text-red-300'
              }`}
            >
              {cloudTestResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{cloudTestResult.message}</span>
            </div>
          )}

          {/* Provider Selector Cards */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-semibold">{t.settingsPage.providerSelectorTitle}</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  id: 'cloudflare_r2',
                  label: 'Cloudflare R2',
                  badge: t.settingsPage.providerR2Badge,
                  badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                  desc: t.settingsPage.providerR2Desc,
                },
                {
                  id: 'aws_s3',
                  label: 'Amazon AWS S3',
                  badge: t.settingsPage.providerS3Badge,
                  badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                  desc: t.settingsPage.providerS3Desc,
                },
                {
                  id: 'custom_s3',
                  label: 'Custom S3 / MinIO',
                  badge: t.settingsPage.providerCustomBadge,
                  badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                  desc: t.settingsPage.providerCustomDesc,
                },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => handleCloudChange('provider', prov.id as CloudStorageProvider)}
                  className={`p-3.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    settings.cloudStorage.provider === prov.id
                      ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500/40 shadow-sm'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{prov.label}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${prov.badgeColor}`}>
                      {prov.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{prov.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields Divided Into 2 Clean Sections */}
          <div className="space-y-4">
            {/* Section A: Bucket & CDN URLs */}
            <div className="p-4.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                {t.settingsPage.bucketCdnTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Account ID or Endpoint */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">
                    {settings.cloudStorage.provider === 'cloudflare_r2'
                      ? t.settingsPage.accountIdLabel
                      : t.settingsPage.endpointUrlLabel}
                  </label>
                  <input
                    type="text"
                    value={
                      settings.cloudStorage.provider === 'cloudflare_r2'
                        ? settings.cloudStorage.accountId
                        : settings.cloudStorage.endpoint || ''
                    }
                    onChange={(e) =>
                      handleCloudChange(
                        settings.cloudStorage.provider === 'cloudflare_r2' ? 'accountId' : 'endpoint',
                        e.target.value
                      )
                    }
                    placeholder={
                      settings.cloudStorage.provider === 'cloudflare_r2'
                        ? 'e.g. 54f590408544e7c37463f2530...'
                        : 'https://s3.ap-southeast-1.amazonaws.com'
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Bucket Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">{t.settingsPage.bucketNameLabel}</label>
                  <input
                    type="text"
                    value={settings.cloudStorage.bucketName}
                    onChange={(e) => handleCloudChange('bucketName', e.target.value)}
                    placeholder="e.g. my-ecommerce-assets"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Public CDN Domain */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs text-slate-400 font-medium">
                    {t.settingsPage.publicDomainLabel}
                  </label>
                  <input
                    type="text"
                    value={settings.cloudStorage.publicDomain}
                    onChange={(e) => handleCloudChange('publicDomain', e.target.value)}
                    placeholder="e.g. https://img-cdn.volticen.com"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Authentication Keys */}
            <div className="p-4.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                {t.settingsPage.credentialsTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* S3 Access Key ID */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">{t.settingsPage.accessKeyLabel}</label>
                  <input
                    type="text"
                    value={settings.cloudStorage.accessKeyId}
                    onChange={(e) => handleCloudChange('accessKeyId', e.target.value)}
                    placeholder="e.g. 963fa1280bfae..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* S3 Secret Access Key with Show/Hide toggle */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-400 font-medium">{t.settingsPage.secretKeyLabel}</label>
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showSecretKey ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>{t.settingsPage.hideKey}</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>{t.settingsPage.showKey}</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={settings.cloudStorage.secretAccessKey}
                    onChange={(e) => handleCloudChange('secretAccessKey', e.target.value)}
                    placeholder="e.g. 817bcde69213..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Cloudflare API Token (Optional) */}
                {settings.cloudStorage.provider === 'cloudflare_r2' && (
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs text-slate-400 font-medium">
                      {t.settingsPage.apiTokenLabel}
                    </label>
                    <input
                      type="password"
                      value={settings.cloudStorage.apiToken}
                      onChange={(e) => handleCloudChange('apiToken', e.target.value)}
                      placeholder={t.settingsPage.apiTokenPlaceholder}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Setup Guide Accordion */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="w-full p-3.5 text-left text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>{t.settingsPage.guideAccordionTitle}</span>
              </div>
              {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showGuide && (
              <div className="p-4 pt-0 border-t border-slate-800/60 text-xs text-slate-400 space-y-2 leading-relaxed">
                <ol className="list-decimal list-inside space-y-1.5 ml-1 text-slate-300">
                  <li>
                    {t.settingsPage.guideStep1Pre}{' '}
                    <a
                      href="https://dash.cloudflare.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline inline-flex items-center gap-0.5"
                    >
                      Cloudflare Dashboard <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    $\rightarrow$ {t.settingsPage.guideStep1Post}
                  </li>
                  <li>
                    {t.settingsPage.guideStep2}
                  </li>
                  <li>
                    {t.settingsPage.guideStep3}
                  </li>
                  <li>
                    {t.settingsPage.guideStep4}
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveCloudConfig}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savedFeedback ? t.settingsPage.savedFeedback : t.settingsPage.saveCloudButton}</span>
              </button>

              <button
                type="button"
                onClick={handleTestCloudConnection}
                disabled={testingCloud}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingCloud ? 'animate-spin text-blue-400' : ''}`} />
                <span>{t.settingsPage.testConnectionButton}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetCloudConfig}
              className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-red-500/15 text-slate-400 hover:text-red-400 text-xs transition border border-slate-800 hover:border-red-500/30 cursor-pointer"
            >
              {t.settingsPage.clearCloudConfigButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
