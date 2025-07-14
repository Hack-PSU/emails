/* eslint-disable @typescript-eslint/no-explicit-any */

// entity.ts
export interface SendMailBody {
  to: string[];
  template: string;
  subject: string;
  data: Record<string, any>;
  from?: string;
}

export interface SendBatchReceiver {
  email: string;
  data: Record<string, any>;
}

export interface SendBatchMailBody {
  to: SendBatchReceiver[];
  template: string;
  subject: string;
  from?: string;
}

export interface UploadTemplateBody {
  name: string;
  template: File;
  previewText?: string;
}

export interface TemplateMetadata {
  name: string;
  context: string[];
}

export interface PreviewMailBody {
  data: Record<string, any>;
}

export interface PreviewMailResponse {
  html: string;
}
