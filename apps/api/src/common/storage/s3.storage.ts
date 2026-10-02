import { IStorageService, UploadFileOptions, UploadResult } from './storage.interface';

export class S3StorageService implements IStorageService {
  private bucket: string;
  private region: string;

  constructor(bucket = process.env.S3_BUCKET || '', region = process.env.AWS_REGION || 'us-east-1') {
    this.bucket = bucket;
    this.region = region;
  }

  async uploadFile(_options: UploadFileOptions): Promise<UploadResult> {
    if (!this.bucket) {
      throw new Error('[STORAGE] S3 bucket is not configured. Set S3_BUCKET in your environment.');
    }
    // Ready for @aws-sdk/client-s3 Upload
    throw new Error('[STORAGE] S3 driver ready for AWS SDK credentials integration.');
  }

  async deleteFile(_key: string): Promise<boolean> {
    if (!this.bucket) return false;
    // Ready for DeleteObjectCommand
    return true;
  }

  getUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
