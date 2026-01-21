/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Loader2, Mail, Eye, Send, Upload } from "lucide-react";
import { Toaster, toast } from "sonner";

import { sendMail, getTemplatePreview } from "@/common/api/mail";
import { getOrganizer } from "@/common/api/organizer";
import { useFirebase } from "@/common/context/FirebaseProvider";

/* ----------------------- TEMPLATE CONFIG ----------------------- */

type FieldType = "text" | "email";

interface FieldConfig {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  type?: FieldType;
}

interface TemplateConfig {
  id: string;
  label: string;
  defaultSubject: string;
  defaultFrom?: string;
  fields: FieldConfig[];
}

const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: "sponsorship",
    label: "Sponsorship Outreach",
    defaultSubject: "Sponsorship Opportunity with HackPSU",
    defaultFrom: "sponsorship@hackpsu.org",
    fields: [
      {
        name: "sponsorName",
        label: "Sponsor Name",
        placeholder: "John Smith",
        required: true,
      },
      {
        name: "companyName",
        label: "Company Name",
        placeholder: "Tech Corp",
        required: true,
      },
      { name: "yourName", label: "Your Name", placeholder: "Your full name" },
    ],
  },
  {
    id: "organizer-invite",
    label: "Organizer Application Invite",
    defaultSubject: "Join the HackPSU Organizer Team",
    defaultFrom: "team@hackpsu.org",
    fields: [
      {
        name: "firstName",
        label: "Recipient First Name",
        placeholder: "Alex",
        required: true,
      },
    ],
  },
  {
    id: "organizer-reject",
    label: "Organizer Application Rejection",
    defaultSubject: "HackPSU Organizer Application Update",
    defaultFrom: "team@hackpsu.org",
    fields: [
      {
        name: "firstName",
        label: "Recipient First Name",
        placeholder: "Lucas",
        required: true,
      },
      {
        name: "team",
        label: "Team Name",
        placeholder: "Logistics",
        required: true,
      },
      {
        name: "fromPerson",
        label: "From Person",
        placeholder: "Joe Boppell",
        required: true,
      }
    ],
  },
  {
    id: "repeat-sponsor",
    label: "Repeat Sponsor Outreach",
    defaultSubject: "Sponsorship Opportunity with HackPSU",
    defaultFrom: "sponsorship@hackpsu.org",
    fields: [
      {
        name: "sponsor_name_or_company",
        label: "Sponsor Name or Company",
        placeholder: "Tech Corp",
        required: true,
      },
      {
        name: "company_name",
        label: "Company Name",
        placeholder: "Tech Corp",
        required: true,
      },
      {
        name: "sponsorship_packet_url",
        label: "Sponsorship Packet URL",
        placeholder: "https://hackpsu.org/sponsorship-packet.pdf",
      },
      { name: "yourName", label: "Your Name", placeholder: "Your full name" },
    ],
  },
  {
    id: "login-update",
    label: "Login System and Tools Access",
    defaultSubject: "New Login System and Tools Access",
    defaultFrom: "technology@hackpsu.org",
    fields: [
      {
        name: "firstName",
        label: "Recipient First Name",
        placeholder: "Alex",
        required: true,
        type: "text",
      },
    ],
  },
  {
    id: "outreach",
    label: "Outreach to other Universities",
    defaultSubject: "Help spread the word about HackPSU October 25-26!",
    defaultFrom: "team@hackpsu.org",
    fields: [
      { name: "yourName", label: "Your Name", placeholder: "Your full name" },
    ],
  },
];

/* ----------------------- TYPES & HELPERS ----------------------- */

type CoreFields = {
  to: string;
  from?: string;
  subject: string;
  templateId: string;
};

export type EmailFormData = CoreFields & Record<string, string>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildDefaultValues(template: TemplateConfig): EmailFormData {
  const defaults: EmailFormData = {
    to: "",
    from: template.defaultFrom || "",
    subject: template.defaultSubject,
    templateId: template.id,
  };

  template.fields.forEach((f) => {
    defaults[f.name] = f.defaultValue ?? "";
  });

  return defaults;
}

function pickTemplateData(data: EmailFormData, fields: FieldConfig[]) {
  const out: Record<string, string> = {};
  fields.forEach((f) => {
    const val = data[f.name];
    if (typeof val === "string") out[f.name] = val;
  });
  return out;
}

/** Super small CSV parser (no quotes/commas-in-field support). Good enough for simple input. */
function parseCSV(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cols[i] ?? ""));
    return row;
  });

  return { headers, rows };
}

/* ----------------------- COMPONENT ----------------------- */

export default function EmailForm() {
  const { user } = useFirebase();

  const [state, setState] = useState({
    isLoading: false,
    isPreviewLoading: false,
    previewHtml: null as string | null,
    error: null as string | null,
  });

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    TEMPLATE_CONFIGS[0].id,
  );
  const [bulkMode, setBulkMode] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvParsed, setCsvParsed] = useState<{
    headers: string[];
    rows: Record<string, string>[];
  } | null>(null);

  const [bulkResults, setBulkResults] = useState<
    { index: number; to: string; status: "success" | "error"; error?: string }[]
  >([]);

  const selectedTemplate = useMemo(
    () => TEMPLATE_CONFIGS.find((t) => t.id === selectedTemplateId)!,
    [selectedTemplateId],
  );

  const defaultVals = useMemo(
    () => buildDefaultValues(selectedTemplate),
    [selectedTemplate],
  );

  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EmailFormData>({
    defaultValues: defaultVals,
    mode: "onSubmit",
  });

  // reset when template changes
  useEffect(() => {
    reset(buildDefaultValues(selectedTemplate));
    setCsvText("");
    setCsvParsed(null);
    setBulkResults([]);
  }, [selectedTemplate, reset]);

  // autofill yourName if present
  useEffect(() => {
    const loadOrganizerData = async () => {
      if (user?.uid) {
        try {
          const organizer = await getOrganizer(user.uid);
          const fullName = `${organizer.firstName} ${organizer.lastName}`;
          if (selectedTemplate.fields.some((f) => f.name === "yourName")) {
            setValue("yourName", fullName, { shouldDirty: true });
          }
        } catch (error) {
          console.error("Failed to load organizer data:", error);
          toast.error("Failed to load your organizer information");
        }
      }
    };
    loadOrganizerData();
  }, [user?.uid, selectedTemplate.fields, setValue]);

  /* ----------------------- Single Send ----------------------- */

  const handlePreview = async () => {
    const valid = await trigger(); // run RHF validations
    if (!valid) {
      toast.error("Fix validation errors before previewing");
      return;
    }

    setState((p) => ({ ...p, isPreviewLoading: true, error: null }));
    try {
      const formData = getValues();
      const templateData = pickTemplateData(formData, selectedTemplate.fields);
      const preview = await getTemplatePreview(selectedTemplate.id, {
        data: templateData,
      });
      setState((p) => ({
        ...p,
        previewHtml: preview.html,
        isPreviewLoading: false,
      }));
      toast.success("Preview generated!");
    } catch (error) {
      setState((p) => ({
        ...p,
        error: "Failed to generate preview",
        isPreviewLoading: false,
      }));
      toast.error("Preview failed");
    }
  };

  const onSubmit: SubmitHandler<EmailFormData> = async (data) => {
    setState((p) => ({ ...p, isLoading: true, error: null }));
    try {
      const templateData = pickTemplateData(data, selectedTemplate.fields);

      await sendMail({
        to: [data.to],
        template: selectedTemplate.id,
        subject: data.subject,
        data: templateData,
        from:
          data.from || selectedTemplate.defaultFrom || "noreply@hackpsu.org",
      });

      setState((p) => ({ ...p, isLoading: false }));
      toast.success("Email sent!");
      reset(buildDefaultValues(selectedTemplate));
    } catch (error) {
      setState((p) => ({
        ...p,
        error: "Failed to send email",
        isLoading: false,
      }));
      toast.error("Send failed");
    }
  };

  /* ----------------------- Bulk Send ----------------------- */

  const handleCSVParse = () => {
    if (!csvText.trim()) {
      toast.error("CSV text is empty");
      return;
    }

    const parsed = parseCSV(csvText);
    if (parsed.headers.length === 0) {
      toast.error("No headers found in CSV");
      return;
    }

    // Validate required headers
    const required = [
      "to",
      // allow subject/from override per row but not required
      ...selectedTemplate.fields.filter((f) => f.required).map((f) => f.name),
    ];

    const missing = required.filter((h) => !parsed.headers.includes(h));
    if (missing.length > 0) {
      toast.error(`Missing required columns: ${missing.join(", ")}`);
      return;
    }

    setCsvParsed(parsed);
    setBulkResults([]);
    toast.success(`Parsed ${parsed.rows.length} rows`);
  };

  const handleBulkSend = async () => {
    if (!csvParsed) {
      toast.error("Parse CSV first");
      return;
    }

    setBulkResults([]);
    setState((p) => ({ ...p, isLoading: true }));
    const results: {
      index: number;
      to: string;
      status: "success" | "error";
      error?: string;
    }[] = [];

    for (let i = 0; i < csvParsed.rows.length; i++) {
      const row = csvParsed.rows[i];

      // Validate email + required dynamic fields for this row
      const to = row.to;
      if (!to || !EMAIL_REGEX.test(to)) {
        results.push({
          index: i + 1,
          to: to || "",
          status: "error",
          error: "Invalid or missing 'to'",
        });
        continue;
      }

      let missingField = "";
      for (const f of selectedTemplate.fields) {
        if (f.required && !row[f.name]) {
          missingField = f.name;
          break;
        }
      }
      if (missingField) {
        results.push({
          index: i + 1,
          to,
          status: "error",
          error: `Missing required field '${missingField}'`,
        });
        continue;
      }

      // Build data
      const templateData: Record<string, string> = {};
      selectedTemplate.fields.forEach(
        (f) => (templateData[f.name] = row[f.name] ?? ""),
      );

      try {
        await sendMail({
          to: [to],
          template: selectedTemplate.id,
          subject: row.subject || defaultVals.subject,
          data: templateData,
          from:
            row.from ||
            defaultVals.from ||
            selectedTemplate.defaultFrom ||
            "noreply@hackpsu.org",
        });
        results.push({ index: i + 1, to, status: "success" });
      } catch (err: any) {
        results.push({
          index: i + 1,
          to,
          status: "error",
          error: err?.message || "Send failed",
        });
      }
    }

    setBulkResults(results);
    setState((p) => ({ ...p, isLoading: false }));
    const successCount = results.filter((r) => r.status === "success").length;
    toast.success(
      `Bulk send completed. Success: ${successCount}/${results.length}`,
    );
  };

  /* ----------------------- Render ----------------------- */

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Toaster />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            HackPSU Email Sender
          </CardTitle>
          <CardDescription>
            Choose a template and personalize your email. Switch to bulk mode
            for CSV sends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toggle Bulk Mode */}
          <div className="flex items-center gap-3 mb-6">
            <Label htmlFor="bulk-toggle" className="cursor-pointer">
              Bulk Mode
            </Label>
            <Button
              id="bulk-toggle"
              type="button"
              variant={bulkMode ? "default" : "outline"}
              onClick={() => setBulkMode((b) => !b)}
              className="h-8 px-3"
            >
              {bulkMode ? "On" : "Off"}
            </Button>
          </div>

          {/* Template Selector */}
          <div className="space-y-2 mb-6">
            <Label htmlFor="template">Template *</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={(val) => setSelectedTemplateId(val)}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CONFIGS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="mb-6" />

          {!bulkMode && (
            /* ---------------- SINGLE MODE ---------------- */
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Email Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* To */}
                  <div className="space-y-2">
                    <Label htmlFor="to">Recipient Email *</Label>
                    <Input
                      id="to"
                      type="email"
                      placeholder="sponsor@company.com"
                      {...register("to", {
                        required: "Recipient email is required",
                        pattern: {
                          value: EMAIL_REGEX,
                          message: "Invalid email",
                        },
                      })}
                    />
                    {errors.to && (
                      <p className="text-sm text-red-600">
                        {errors.to.message}
                      </p>
                    )}
                  </div>

                  {/* From */}
                  <div className="space-y-2">
                    <Label htmlFor="from">From Email</Label>
                    <Input
                      id="from"
                      type="email"
                      placeholder={
                        selectedTemplate.defaultFrom || "your@email.com"
                      }
                      {...register("from", {
                        pattern: {
                          value: EMAIL_REGEX,
                          message: "Invalid email",
                        },
                      })}
                    />
                    {errors.from && (
                      <p className="text-sm text-red-600">
                        {errors.from.message}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      placeholder={selectedTemplate.defaultSubject}
                      {...register("subject", {
                        required: "Subject is required",
                      })}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dynamic Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Template Variables</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div className="space-y-2" key={field.name}>
                      <Label htmlFor={field.name}>
                        {field.label}
                        {field.required && " *"}
                      </Label>
                      <Input
                        id={field.name}
                        placeholder={field.placeholder}
                        type={field.type === "email" ? "email" : "text"}
                        {...register(field.name, {
                          required: field.required
                            ? `${field.label} is required`
                            : false,
                          ...(field.type === "email"
                            ? {
                                pattern: {
                                  value: EMAIL_REGEX,
                                  message: "Invalid email",
                                },
                              }
                            : {}),
                        })}
                      />
                      {errors[field.name] && (
                        <p className="text-sm text-red-600">
                          {(errors as any)[field.name]?.message as string}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hidden templateId */}
              <input
                type="hidden"
                value={selectedTemplate.id}
                {...register("templateId")}
              />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  disabled={state.isPreviewLoading}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {state.isPreviewLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  Preview Email
                </Button>

                <Button
                  type="submit"
                  disabled={state.isLoading}
                  className="flex items-center gap-2"
                >
                  {state.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Email
                </Button>
              </div>

              {state.error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {state.error}
                </div>
              )}
            </form>
          )}

          {bulkMode && (
            /* ---------------- BULK MODE ---------------- */
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="csv">CSV (first row = headers)</Label>
                <Textarea
                  id="csv"
                  placeholder={`to,${selectedTemplate.fields.map((f) => f.name).join(",")}\njane@corp.com,Jane,Tech Corp,Your Name Here\n...`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={10}
                />
                <p className="text-sm text-gray-500">
                  Required headers: <code>to</code>
                  {", "}
                  {selectedTemplate.fields
                    .filter((f) => f.required)
                    .map((f) => f.name)
                    .join(", ")}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCSVParse}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Upload className="h-4 w-4" />
                  Parse CSV
                </Button>

                <Button
                  type="button"
                  disabled={!csvParsed || state.isLoading}
                  onClick={handleBulkSend}
                  className="flex items-center gap-2"
                >
                  {state.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send Bulk Emails
                </Button>
              </div>

              {/* Results */}
              {bulkResults.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3">
                    Bulk Send Results
                  </h3>
                  <div className="overflow-x-auto border rounded-md">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">
                            To
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkResults.map((r) => (
                          <tr key={r.index} className="border-t">
                            <td className="px-3 py-2">{r.index}</td>
                            <td className="px-3 py-2">{r.to}</td>
                            <td
                              className={`px-3 py-2 ${
                                r.status === "success"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {r.status}
                            </td>
                            <td className="px-3 py-2">{r.error || ""}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview (single mode only) */}
      {!bulkMode && state.previewHtml && (
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
              dangerouslySetInnerHTML={{ __html: state.previewHtml }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
