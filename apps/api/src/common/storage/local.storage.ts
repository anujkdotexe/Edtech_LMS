import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { IStorageService, UploadFileOptions, UploadResult } from './storage.interface';
import { serverEnv } from '../../config';

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = path.resolve(process.cwd(), uploadDir || serverEnv.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(options: UploadFileOptions): Promise<UploadResult> {
    const ext = path.extname(options.filename) || '.pdf';
    const prefix = options.prefix ? `${options.prefix}_` : '';
    const key = `${prefix}${crypto.randomBytes(4).toString('hex')}${ext}`;
    const destinationPath = path.join(this.uploadDir, key);

    await pipeline(options.stream, fs.createWriteStream(destinationPath));

    return {
      key,
      url: `/public/uploads/${key}`,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const sanitizedKey = path.basename(key);
      const filePath = path.join(this.uploadDir, sanitizedKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    const sanitizedKey = path.basename(key);
    return `/public/uploads/${sanitizedKey}`;
  }
}
