import { BlobServiceClient, ContainerClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  success: boolean;
  url?: string;
  blobName?: string;
  error?: string;
}

export interface FileMetadata {
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: Date;
}

class BlobStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;

  constructor() {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    this.containerName = process.env.BLOB_CONTAINER || 'fire-door-documents';

    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');
    }

    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * Upload a file to Azure Blob Storage
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<UploadResult> {
    try {
      // Generate unique blob name
      const fileExtension = originalName.split('.').pop() || '';
      const blobName = folder ? `${folder}/${uuidv4()}-${Date.now()}.${fileExtension}` : `${uuidv4()}-${Date.now()}.${fileExtension}`;
      
      // Get blob client
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      // Upload file
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
          blobContentDisposition: `attachment; filename="${originalName}"`
        },
        metadata: {
          originalName,
          uploadedAt: new Date().toISOString(),
          size: fileBuffer.length.toString()
        }
      });

      // Get the URL
      const url = blockBlobClient.url;

      return {
        success: true,
        url,
        blobName
      };
    } catch (error) {
      console.error('Blob upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown upload error'
      };
    }
  }

  /**
   * Delete a file from Azure Blob Storage
   */
  async deleteFile(blobName: string): Promise<boolean> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.delete();
      return true;
    } catch (error) {
      console.error('Blob delete error:', error);
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(blobName: string): Promise<FileMetadata | null> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const properties = await blockBlobClient.getProperties();
      
      return {
        originalName: properties.metadata?.originalName || blobName,
        contentType: properties.contentType || 'application/octet-stream',
        size: properties.contentLength || 0,
        uploadedAt: properties.lastModified || new Date()
      };
    } catch (error) {
      console.error('Get blob metadata error:', error);
      return null;
    }
  }

  /**
   * Generate a shared access signature for temporary access
   */
  async generateSasUrl(blobName: string, expiresInMinutes: number = 60): Promise<string | null> {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      const sasToken = await blockBlobClient.generateSasUrl({
        permissions: 'r' as any, // Type assertion for Azure SDK compatibility
        expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000)
      });
      
      return sasToken;
    } catch (error) {
      console.error('Generate SAS URL error:', error);
      return null;
    }
  }

  /**
   * Check if container exists, create if not
   */
  async ensureContainerExists(): Promise<boolean> {
    try {
      const exists = await this.containerClient.exists();
      if (!exists) {
        await this.containerClient.create();
        console.log(`✅ Created Azure Blob Storage container: ${this.containerName}`);
      }
      return true;
    } catch (error) {
      console.error('Container creation error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const blobStorageService = new BlobStorageService();
export default blobStorageService;
