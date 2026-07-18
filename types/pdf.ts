export type PdfUploadBoxProps = {
  isAuthenticated: boolean;
  className?: string;
};

export type ExplainWorkflowProps = {
  existingSessionId?: string;
};

export type StagedPdfRecord = {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
};

export type ExtractionResult = {
  filename: string;
  pageCount: number;
  documentId: string;
  learningSessionId: string;
};
