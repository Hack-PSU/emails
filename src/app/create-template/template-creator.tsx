"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Mail, Eye, Send, FileText } from "lucide-react";
import { Toaster, toast } from "sonner";

import {
  useUploadTemplate,
  useSendMail,
  useTemplatePreview,
} from "@/common/api/mail";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TemplateUploadData {
  templateContent: string;
}

interface EmailSendData {
  to: string;
  from?: string;
  subject: string;
}

type AppPhase = "upload" | "send";

export default function TemplateCreator() {
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [uploadedTemplateId, setUploadedTemplateId] = useState<string | null>(
    null,
  );
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const uploadMutation = useUploadTemplate();
  const sendMutation = useSendMail();
  const previewMutation = useTemplatePreview(uploadedTemplateId || "");

  const uploadForm = useForm<TemplateUploadData>({
    defaultValues: {
      templateContent: "",
    },
  });

  const emailForm = useForm<EmailSendData>({
    defaultValues: {
      to: "",
      from: "",
      subject: "",
    },
  });

  const generateTemplateId = () => {
    return `temporary_${crypto.randomUUID()}`;
  };

  const escapeHtml = (text: string): string => {
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  };

  const convertTextToFile = (content: string, filename: string): File => {
    // First escape HTML special characters to prevent MJML structure issues
    const escapedContent = escapeHtml(content);
    
    // Convert newlines to HTML line breaks for proper email formatting
    const htmlContent = escapedContent.replace(/\n/g, '<br>');
    
    // Wrap user content in proper MJML structure for injection into base template
    const wrappedContent = `<mj-section>
      <mj-column>
        <mj-text>${htmlContent}</mj-text>
      </mj-column>
    </mj-section>`;
    const blob = new Blob([wrappedContent], { type: "text/html" });
    return new File([blob], filename, { type: "text/html" });
  };

  const handleTemplateUpload: SubmitHandler<TemplateUploadData> = async (
    data,
  ) => {
    if (!data.templateContent.trim()) {
      toast.error("Template content is required");
      return;
    }

    const templateId = generateTemplateId();
    const templateFile = convertTextToFile(
      data.templateContent,
      `${templateId}.html`,
    );

    try {
      await uploadMutation.mutateAsync({
        name: templateId,
        template: templateFile,
      });

      setUploadedTemplateId(templateId);
      setPhase("send");
      toast.success("Template uploaded successfully!");
    } catch (error) {
      toast.error("Failed to upload template");
    }
  };

  const handlePreview = async () => {
    if (!uploadedTemplateId) return;

    try {
      const result = await previewMutation.mutateAsync({
        data: {},
      });
      setPreviewHtml(result.html);
      toast.success("Preview generated!");
    } catch (error) {
      toast.error("Failed to generate preview");
    }
  };

  const handleEmailSend: SubmitHandler<EmailSendData> = async (data) => {
    if (!uploadedTemplateId) return;

    try {
      await sendMutation.mutateAsync({
        to: [data.to],
        template: uploadedTemplateId,
        subject: data.subject,
        data: {},
        from: data.from || "noreply@hackpsu.org",
      });

      toast.success("Email sent successfully!");
      emailForm.reset();
    } catch (error) {
      toast.error("Failed to send email");
    }
  };

  const handleStartOver = () => {
    setPhase("upload");
    setUploadedTemplateId(null);
    setPreviewHtml(null);
    uploadForm.reset();
    emailForm.reset();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Toaster />

      {phase === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Template
            </CardTitle>
            <CardDescription>
              Create your email template by entering plain text content below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={uploadForm.handleSubmit(handleTemplateUpload)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="templateContent">
                  Email Template Content *
                </Label>
                <Textarea
                  id="templateContent"
                  placeholder="Enter your email content here (plain text only)..."
                  rows={15}
                  className="text-sm"
                  {...uploadForm.register("templateContent", {
                    required: "Template content is required",
                    minLength: {
                      value: 10,
                      message: "Template must be at least 10 characters",
                    },
                  })}
                />
                {uploadForm.formState.errors.templateContent && (
                  <p className="text-sm text-red-600">
                    {uploadForm.formState.errors.templateContent.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Enter plain text content only. The template will be
                  automatically formatted and uploaded as a temporary file.
                </p>
              </div>

              <Button
                type="submit"
                disabled={uploadMutation.isPending}
                className="flex items-center gap-2"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Template
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {phase === "send" && uploadedTemplateId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email
            </CardTitle>
            <CardDescription>
              Template uploaded successfully. Now compose and send your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="text-green-600">
                  ✓ Template ID: {uploadedTemplateId}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartOver}
                  className="ml-auto"
                >
                  Upload New Template
                </Button>
              </div>

              <form
                onSubmit={emailForm.handleSubmit(handleEmailSend)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="to">Recipient Email *</Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="recipient@company.com"
                      {...emailForm.register("to", {
                        required: "Recipient email is required",
                        pattern: {
                          value: EMAIL_REGEX,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {emailForm.formState.errors.to && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.to.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from">From Email</Label>
                    <Input
                      id="from"
                      type="email"
                      placeholder="your@hackpsu.org"
                      {...emailForm.register("from", {
                        pattern: {
                          value: EMAIL_REGEX,
                          message: "Invalid email address",
                        },
                      })}
                    />
                    {emailForm.formState.errors.from && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.from.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder="Email subject"
                      {...emailForm.register("subject", {
                        required: "Subject is required",
                      })}
                    />
                    {emailForm.formState.errors.subject && (
                      <p className="text-sm text-red-600">
                        {emailForm.formState.errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewMutation.isPending}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    {previewMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    Preview Email
                  </Button>

                  <Button
                    type="submit"
                    disabled={sendMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Email
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {previewHtml && (
        <Card>
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              This is how your email will appear to the recipient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg p-4 bg-white"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
