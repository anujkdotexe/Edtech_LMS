import { Readable } from 'stream';

export interface UploadFileOptions {
  filename: string;
  stream: Readable;
  mimeType?: string;
  prefix?: string;
}

export interface UploadResult {
  url: string;
  key: string;
}

export interface IStorageService {
  uploadFile(options: UploadFileOptions): Promise<UploadResult>;
  deleteFile(key: string): Promise<boolean>;
  getUrl(key: string): string;
}
