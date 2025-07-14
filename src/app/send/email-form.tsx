/* eslint-disable @typescript-eslint/no-unused-vars */

"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Loader2, Mail, Eye, Send } from "lucide-react";
import { Toaster, toast } from "sonner";
import { sendMail, getTemplatePreview } from "@/common/api/mail";
import { getOrganizer } from "@/common/api/organizer";
import { useFirebase } from "@/common/context/FirebaseProvider";
import {
  emailFormSchema,
  type EmailFormData,
  type EmailFormState,
} from "./email-forms";

const TEMPLATE_ID = "sponsorship";

export default function EmailForm() {
  const { user } = useFirebase();
  const [state, setState] = useState<EmailFormState>({
    isLoading: false,
    isPreviewLoading: false,
    previewHtml: null,
    error: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
    setValue,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      to: "",
      subject: "Sponsorship Opportunity with HackPSU",
      sponsorName: "",
      yourName: "",
      companyName: "",
    },
  });

  // Load organizer data when user is available
  useEffect(() => {
    const loadOrganizerData = async () => {
      if (user?.uid) {
        try {
          const organizer = await getOrganizer(user.uid);
          const fullName = `${organizer.firstName} ${organizer.lastName}`;
          setValue("yourName", fullName);
        } catch (error) {
          console.error("Failed to load organizer data:", error);
          toast.error("Failed to load your organizer information");
        }
      }
    };

    loadOrganizerData();
  }, [user?.uid, setValue]);

  const handlePreview = async () => {
    const formData = getValues();

    // Validate form before preview
    const result = emailFormSchema.safeParse(formData);
    if (!result.success) {
      console.error("Form validation failed", result.error);
      toast.error("Please fill in all required fields before previewing");
      return;
    }

    setState((prev) => ({ ...prev, isPreviewLoading: true, error: null }));

    try {
      const templateData = {
        sponsorName: formData.sponsorName,
        yourName: formData.yourName,
        companyName: formData.companyName,
      };

      const preview = await getTemplatePreview(TEMPLATE_ID, {
        data: templateData,
      });
      setState((prev) => ({
        ...prev,
        previewHtml: preview.html,
        isPreviewLoading: false,
      }));
      toast.success("Email preview generated successfully");
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to generate preview",
        isPreviewLoading: false,
      }));
      toast.error("Failed to generate email preview");
    }
  };

  const onSubmit = async (data: EmailFormData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const templateData = {
        sponsorName: data.sponsorName,
        yourName: data.yourName,
        companyName: data.companyName,
      };

      await sendMail({
        to: [data.to],
        template: TEMPLATE_ID,
        subject: data.subject,
        data: templateData,
        from: "sponsorship@hackpsu.org",
      });

      setState((prev) => ({ ...prev, isLoading: false }));
      toast.success("Email sent successfully!");
      reset();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to send email",
        isLoading: false,
      }));
      toast.error("Failed to send email");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Toaster />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            HackPSU Sponsorship Email
          </CardTitle>
          <CardDescription>
            Send personalized sponsorship invitations to potential sponsors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Details Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Email Details</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">Recipient Email *</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="sponsor@company.com"
                    {...register("to")}
                  />
                  {errors.to && (
                    <p className="text-sm text-red-600">{errors.to.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from">From Email</Label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                    sponsorship@hackpsu.org
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Sponsorship Opportunity with HackPSU"
                    {...register("subject")}
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

            {/* Template Variables Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Template Variables</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sponsorName">Sponsor Name *</Label>
                  <Input
                    id="sponsorName"
                    placeholder="John Smith"
                    {...register("sponsorName")}
                  />
                  {errors.sponsorName && (
                    <p className="text-sm text-red-600">
                      {errors.sponsorName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Tech Corp"
                    {...register("companyName")}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-red-600">
                      {errors.companyName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="yourName">Your Name</Label>
                <Input
                  id="yourName"
                  placeholder="Loading..."
                  {...register("yourName")}
                  disabled
                  className="bg-gray-50 text-gray-700"
                />
                <p className="text-sm text-gray-500">
                  This is automatically populated from your organizer profile
                </p>
                {errors.yourName && (
                  <p className="text-sm text-red-600">
                    {errors.yourName.message}
                  </p>
                )}
              </div>
            </div>

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
        </CardContent>
      </Card>

      {/* Email Preview Section */}
      {state.previewHtml && (
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
