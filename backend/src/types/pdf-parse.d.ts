declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    info: {
      PDFFormatVersion: string;
      IsAcroFormPresent: boolean;
      IsXFAPresent: boolean;
      [key: string]: any;
    };
    metadata: any;
    version: string;
  }

  function pdf(dataBuffer: Buffer): Promise<PDFData>;
  export = pdf;
} 