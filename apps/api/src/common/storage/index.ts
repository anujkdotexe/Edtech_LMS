import { IStorageService } from './storage.interface';
import { LocalStorageService } from './local.storage';
import { S3StorageService } from './s3.storage';

export * from './storage.interface';
export * from './local.storage';
export * from './s3.storage';

function createStorageService(): IStorageService {
  const driver = (process.env.STORAGE_DRIVER || 'local').toLowerCase();

  switch (driver) {
    case 's3':
      return new S3StorageService();
    case 'local':
    default:
      return new LocalStorageService();
  }
}

export const storageService = createStorageService();
