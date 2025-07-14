import { z } from "zod";

export const emailFormSchema = z.object({
  // Email details
  to: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),

  // Template variables
  sponsorName: z.string().min(1, "Sponsor name is required"),
  yourName: z.string().min(1, "Your name is required"),
  companyName: z.string().min(1, "Company name is required"),
});

export type EmailFormData = z.infer<typeof emailFormSchema>;

export interface EmailFormState {
  isLoading: boolean;
  isPreviewLoading: boolean;
  previewHtml: string | null;
  error: string | null;
}
