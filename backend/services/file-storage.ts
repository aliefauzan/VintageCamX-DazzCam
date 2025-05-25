import fs from 'fs';
import path from 'path';

// Define metadata storage paths
const META_DIR = path.join(__dirname, '../metadata');

// Ensure the directory exists
if (!fs.existsSync(META_DIR)) {
  fs.mkdirSync(META_DIR, { recursive: true });
}

// Define interface for storage options
export interface StorageOptions {
  EX?: number;
}

// Define interface for a storage client
export interface StorageClient {
  set(key: string, value: string, options?: StorageOptions): Promise<string | null>;
  get(key: string): Promise<string | null>;
  connect(): Promise<any>;
  disconnect(): Promise<void>;
  on(event: string, callback: (err: Error) => void): StorageClient;
}

/**
 * A simple file-based storage to replace Redis for development
 */
export class FileStorage implements StorageClient {
  private metaDir: string;

  constructor(baseDir?: string) {
    this.metaDir = baseDir || META_DIR;
    if (!fs.existsSync(this.metaDir)) {
      fs.mkdirSync(this.metaDir, { recursive: true });
    }
  }
  /**
   * Store data in a file with the given key
   */
  async set(key: string, value: string, options?: StorageOptions): Promise<string | null> {
    try {
      const filePath = path.join(this.metaDir, this.sanitizeKey(key) + '.json');
      
      // If expiry is provided, add it to the data
      const data = options?.EX 
        ? { data: value, expiry: Date.now() + options.EX * 1000 }
        : { data: value };
      
      fs.writeFileSync(filePath, JSON.stringify(data));
      console.log(`FileStorage: Data saved for key: ${key}`);
      return 'OK';
    } catch (error) {
      console.error(`FileStorage error in set() for key ${key}:`, error);
      throw error;
    }
  }
  /**
   * Retrieve data from a file with the given key
   */
  async get(key: string): Promise<string | null> {
    try {
      const filePath = path.join(this.metaDir, this.sanitizeKey(key) + '.json');
      
      if (!fs.existsSync(filePath)) {
        console.log(`FileStorage: Key not found: ${key}`);
        return null;
      }
      
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(rawData);
      
      // Check if the data has expired
      if (data.expiry && data.expiry < Date.now()) {
        // Data expired, remove it
        console.log(`FileStorage: Expired data removed for key: ${key}`);
        fs.unlinkSync(filePath);
        return null;
      }
      
      console.log(`FileStorage: Data retrieved for key: ${key}`);
      return typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
    } catch (error) {
      console.error(`FileStorage error in get() for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Disconnect (no-op for file storage)
   */
  async disconnect(): Promise<void> {
    // Nothing to do for file storage
  }

  /**
   * Connect (no-op for file storage)
   */
  async connect(): Promise<void> {
    // Nothing to do for file storage
  }
  
  /**
   * Event emitter (no-op for file storage)
   */
  on(event: string, callback: (err: Error) => void): StorageClient {
    // Nothing to do for file storage
    return this;
  }

  /**
   * Sanitize a key to be used as a filename
   */
  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_]/g, '_');
  }
}
