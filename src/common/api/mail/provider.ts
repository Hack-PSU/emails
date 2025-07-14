import { apiFetch } from "@/common/api/apiClient";
import {
  SendMailBody,
  SendBatchMailBody,
  TemplateMetadata,
  PreviewMailBody,
  PreviewMailResponse,
} from "./entity";

export async function sendMail(data: SendMailBody): Promise<void> {
  await apiFetch<void>("/mail/send", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendBatchMail(
  data: SendBatchMailBody,
): Promise<string[]> {
  return apiFetch<string[]>("/mail/send/batch", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function uploadTemplate(form: FormData): Promise<void> {
  await apiFetch<void>("/mail/template", {
    method: "POST",
    body: form,
  });
}

export async function getTemplateMetadata(
  templateId: string,
): Promise<TemplateMetadata> {
  return apiFetch<TemplateMetadata>(`/mail/template/${templateId}/metadata`, {
    method: "GET",
  });
}

export async function getTemplatePreview(
  templateId: string,
  data: PreviewMailBody,
): Promise<PreviewMailResponse> {
  return apiFetch<PreviewMailResponse>(`/mail/template/${templateId}/preview`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
