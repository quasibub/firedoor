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
declare class BlobStorageService {
    private blobServiceClient;
    private containerClient;
    private containerName;
    constructor();
    uploadFile(fileBuffer: Buffer, originalName: string, contentType: string, folder?: string): Promise<UploadResult>;
    deleteFile(blobName: string): Promise<boolean>;
    getFileMetadata(blobName: string): Promise<FileMetadata | null>;
    generateSasUrl(blobName: string, expiresInMinutes?: number): Promise<string | null>;
    ensureContainerExists(): Promise<boolean>;
}
export declare const blobStorageService: BlobStorageService;
export default blobStorageService;
//# sourceMappingURL=blobStorage.d.ts.map