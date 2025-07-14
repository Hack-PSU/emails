import { useMutation, useQuery } from "@tanstack/react-query";
import {
  sendMail,
  sendBatchMail,
  uploadTemplate,
  getTemplateMetadata,
  getTemplatePreview,
} from "./provider";
import {
  SendMailBody,
  SendBatchMailBody,
  UploadTemplateBody,
  TemplateMetadata,
  PreviewMailBody,
  PreviewMailResponse,
} from "./entity";

export const mailQueryKeys = {
  metadata: (templateId: string) => ["mail", "metadata", templateId] as const,
};

export function useSendMail() {
  return useMutation<void, Error, SendMailBody>({
    mutationFn: (data) => sendMail(data),
  });
}

export function useSendBatchMail() {
  return useMutation<string[], Error, SendBatchMailBody>({
    mutationFn: (data) => sendBatchMail(data),
  });
}

export function useUploadTemplate() {
  return useMutation<void, Error, UploadTemplateBody>({
    mutationFn: (body) => {
      const form = new FormData();
      form.append("name", body.name);
      form.append("template", body.template);
      if (body.previewText) form.append("previewText", body.previewText);
      return uploadTemplate(form);
    },
  });
}

export function useTemplateMetadata(templateId: string) {
  return useQuery<TemplateMetadata, Error>({
    queryKey: mailQueryKeys.metadata(templateId),
    queryFn: () => getTemplateMetadata(templateId),
    enabled: Boolean(templateId),
  });
}

export function useTemplatePreview(templateId: string) {
  return useMutation<PreviewMailResponse, Error, PreviewMailBody>({
    mutationFn: (data) => getTemplatePreview(templateId, data),
  });
}
