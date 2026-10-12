'use client';

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { R2FolderNode } from '@/types/r2';
import { useI18n } from '@/lib/i18n-context';

interface FolderTreeProps {
  tree: R2FolderNode[];
  selectedFolder: string;
  totalFiles: number;
  loading: boolean;
  onSelectFolder: (path: string) => void;
  onCreateFolder: (parentPath?: string) => void;
  onRenameFolder: (currentPath: string) => void;
  onDeleteFolder: (currentPath: string, fileCount: number) => void;
  onRefresh: () => void;
}

interface TreeNodeProps {
  node: R2FolderNode;
  selectedFolder: string;
  onSelectFolder: (path: string) => void;
  onCreateFolder: (parentPath?: string) => void;
  onRenameFolder: (currentPath: string) => void;
  onDeleteFolder: (currentPath: string, fileCount: number) => void;
}

function TreeNode({
  node,
  selectedFolder,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: TreeNodeProps) {
  const isSelected = selectedFolder === node.path;
  const isAncestor = selectedFolder.startsWith(node.path);
  const [isOpen, setIsOpen] = useState<boolean>(isAncestor || node.depth <= 1);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none text-xs">
      <div
        className={`group flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition ${
          isSelected
            ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
            : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
        }`}
        onClick={() => onSelectFolder(node.path)}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-0.5 hover:bg-slate-700/60 rounded text-slate-400 hover:text-slate-200 transition"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {isOpen ? (
            <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-amber-400'}`} />
          ) : (
            <Folder className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-400' : 'text-amber-400'}`} />
          )}

          <span className="truncate font-mono" title={node.path}>
            {node.name}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {node.fileCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isSelected
                  ? 'bg-blue-500/30 text-blue-300 font-bold'
                  : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'
              }`}
            >
              {node.fileCount}
            </span>
          )}

          {/* Quick Action buttons on hover */}
          <div className="hidden group-hover:flex items-center gap-0.5 bg-slate-900/90 rounded px-1 py-0.5 border border-slate-700/60">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCreateFolder(node.path);
              }}
              className="p-0.5 hover:text-blue-400 text-slate-400 rounded"
              title={`Tạo thư mục con trong ${node.path}`}
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRenameFolder(node.path);
              }}
              className="p-0.5 hover:text-amber-400 text-slate-400 rounded"
              title={`Đổi tên thư mục ${node.path}`}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder(node.path, node.fileCount);
              }}
              className="p-0.5 hover:text-red-400 text-slate-400 rounded"
              title={`Xóa thư mục ${node.path}`}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="pl-4 ml-1.5 border-l border-slate-800 space-y-0.5 mt-0.5">
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              onCreateFolder={onCreateFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({
  tree,
  selectedFolder,
  totalFiles,
  loading,
  onSelectFolder,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRefresh,
}: FolderTreeProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            {t.explorer.treeHeader}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onCreateFolder('')}
            className="p-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition"
            title={t.explorer.createRootFolder}
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t.explorer.refreshTree}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="p-2 overflow-y-auto max-h-[calc(100vh-280px)] space-y-1">
        {/* Root folder option (Root of bucket) */}
        <div
          onClick={() => onSelectFolder('')}
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer text-xs transition ${
            selectedFolder === ''
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.explorer.rootFolder}</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              selectedFolder === '' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {t.explorer.rootShort}
          </span>
        </div>

        {/* All files option (Recursive scan) */}
        <div
          onClick={() => onSelectFolder('all')}
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg cursor-pointer text-xs transition ${
            selectedFolder === 'all'
              ? 'bg-blue-600 text-white font-semibold'
              : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{t.explorer.allFiles}</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              selectedFolder === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {totalFiles}
          </span>
        </div>

        {/* Tree Nodes */}
        {tree.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            selectedFolder={selectedFolder}
            onSelectFolder={onSelectFolder}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
          />
        ))}

        {tree.length === 0 && !loading && (
          <div className="p-4 text-center text-xs text-slate-500">
            {t.explorer.treeEmpty}
          </div>
        )}
      </div>
    </div>
  );
}
