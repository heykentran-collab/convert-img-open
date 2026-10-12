/**
 * Types for Multi-Destination Storage: Local Folder, Cloud S3/R2, and Download
 */

export type StorageDestinationType = 'download' | 'local_folder' | 'cloud_s3';

export type CloudStorageProvider = 'cloudflare_r2' | 'aws_s3' | 'custom_s3';

export interface CloudStorageConfig {
  provider: CloudStorageProvider;
  accountId: string;
  apiToken: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain: string;
  endpoint?: string;
  region?: string;
}

export interface LocalFolderConfig {
  enabled: boolean;
  folderName: string;
  autoSaveOnDone: boolean;
  createSubfolders?: boolean;
}

export interface UnifiedStorageSettings {
  activeDestination: StorageDestinationType;
  localFolder: LocalFolderConfig;
  cloudStorage: CloudStorageConfig;
}
