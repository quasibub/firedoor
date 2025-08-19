"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blobStorageService = void 0;
const storage_blob_1 = require("@azure/storage-blob");
const uuid_1 = require("uuid");
class BlobStorageService {
    constructor() {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        this.containerName = process.env.BLOB_CONTAINER || 'fire-door-documents';
        if (!connectionString) {
            throw new Error('AZURE_STORAGE_CONNECTION_STRING is required');
        }
        this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    }
    async uploadFile(fileBuffer, originalName, contentType, folder = 'uploads') {
        try {
            const fileExtension = originalName.split('.').pop() || '';
            const blobName = `${folder}/${(0, uuid_1.v4)()}-${Date.now()}.${fileExtension}`;
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
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
            const url = blockBlobClient.url;
            return {
                success: true,
                url,
                blobName
            };
        }
        catch (error) {
            console.error('Blob upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown upload error'
            };
        }
    }
    async deleteFile(blobName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.delete();
            return true;
        }
        catch (error) {
            console.error('Blob delete error:', error);
            return false;
        }
    }
    async getFileMetadata(blobName) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            const properties = await blockBlobClient.getProperties();
            return {
                originalName: properties.metadata?.originalName || blobName,
                contentType: properties.contentType || 'application/octet-stream',
                size: properties.contentLength || 0,
                uploadedAt: properties.lastModified || new Date()
            };
        }
        catch (error) {
            console.error('Get blob metadata error:', error);
            return null;
        }
    }
    async generateSasUrl(blobName, expiresInMinutes = 60) {
        try {
            const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
            const sasToken = await blockBlobClient.generateSasUrl({
                permissions: 'r',
                expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000)
            });
            return sasToken;
        }
        catch (error) {
            console.error('Generate SAS URL error:', error);
            return null;
        }
    }
    async ensureContainerExists() {
        try {
            const exists = await this.containerClient.exists();
            if (!exists) {
                await this.containerClient.create();
                console.log(`✅ Created Azure Blob Storage container: ${this.containerName}`);
            }
            return true;
        }
        catch (error) {
            console.error('Container creation error:', error);
            return false;
        }
    }
}
exports.blobStorageService = new BlobStorageService();
exports.default = exports.blobStorageService;
//# sourceMappingURL=blobStorage.js.map