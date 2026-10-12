export interface R2File {
  key: string;
  name: string;
  folder: string;
  ext: string;
  size: number;
  uploaded: string | null;
  etag: string;
  url: string;
}

export interface R2ConfigResponse {
  success: boolean;
  configured: boolean;
  accountId: string;
  bucketName: string;
  publicDomain: string;
  hasToken: boolean;
  hasS3Keys: boolean;
}

export interface R2FileListResponse {
  success: boolean;
  files: R2File[];
  folders: string[];
  cursor: string | null;
  hasMore: boolean;
  totalReturned: number;
  publicDomain: string;
  bucketName?: string;
  error?: string;
}

export interface R2FolderNode {
  name: string;
  path: string; // e.g. "posts/aiauto/"
  depth: number;
  fileCount: number;
  directFileCount: number;
  totalBytes: number;
  children: R2FolderNode[];
}

export interface R2FolderTreeResponse {
  success: boolean;
  tree: R2FolderNode[];
  allFolders: string[];
  totalFiles: number;
  totalFolders: number;
  error?: string;
}
