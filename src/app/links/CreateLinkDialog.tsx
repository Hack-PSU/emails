"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ShlinkShortUrl } from "@/common/shlink/types";
import ShlinkService from "@/common/shlink/service";
import { toast } from "sonner";

interface CreateLinkDialogProps {
  links: ShlinkShortUrl[];
  onLinksChange: (newLinks: ShlinkShortUrl[]) => void;
}

const urlSchema = z.string().url("Please enter a valid URL");
const customSlugSchema = z
  .string()
  .regex(
    /^[a-zA-Z0-9_-]*$/,
    "Custom slug can only contain letters, numbers, hyphens, and underscores",
  )
  .optional();

export default function CreateLinkDialog({
  links,
  onLinksChange,
}: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    longUrl: "",
    customSlug: "",
    title: "",
    tags: "",
  });
  const [errors, setErrors] = useState<{
    longUrl?: string;
    customSlug?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const urlResult = urlSchema.safeParse(formData.longUrl);
    if (!urlResult.success) {
      newErrors.longUrl = urlResult.error.errors[0].message;
    }

    if (formData.customSlug) {
      const slugResult = customSlugSchema.safeParse(formData.customSlug);
      if (!slugResult.success) {
        newErrors.customSlug = slugResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear specific field error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        longUrl: formData.longUrl,
        ...(formData.customSlug && { customSlug: formData.customSlug }),
        ...(formData.title && { title: formData.title }),
        ...(formData.tags && {
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      };

      await ShlinkService.createShortUrl(payload);

      // Refresh the list
      const result = await ShlinkService.listShortUrls({
        orderBy: { field: "dateCreated", dir: "DESC" },
      });
      onLinksChange(result.data);

      // Reset form and close dialog
      setFormData({
        longUrl: "",
        customSlug: "",
        title: "",
        tags: "",
      });
      setOpen(false);
      toast.success("Short URL created successfully!");
    } catch (err: unknown) {
      console.error("Failed to create short URL", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to create short URL",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" disabled={loading}>
          Create Short URL
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[500px] p-6">
        <DialogHeader>
          <DialogTitle>Create Short URL</DialogTitle>
          <DialogDescription>
            Create a new short URL to redirect to your destination.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="longUrl" className="text-sm font-medium">
              Long URL *
            </Label>
            <Input
              id="longUrl"
              placeholder="https://example.com/very/long/url"
              value={formData.longUrl}
              onChange={(e) => handleInputChange("longUrl", e.target.value)}
              className={errors.longUrl ? "border-red-500" : ""}
            />
            {errors.longUrl && (
              <p className="mt-1 text-sm text-red-600">{errors.longUrl}</p>
            )}
          </div>

          <div>
            <Label htmlFor="customSlug" className="text-sm font-medium">
              Custom Short Code (optional)
            </Label>
            <Input
              id="customSlug"
              placeholder="my-custom-link"
              value={formData.customSlug}
              onChange={(e) => handleInputChange("customSlug", e.target.value)}
              className={errors.customSlug ? "border-red-500" : ""}
            />
            {errors.customSlug && (
              <p className="mt-1 text-sm text-red-600">{errors.customSlug}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to auto-generate a short code
            </p>
          </div>

          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Title (optional)
            </Label>
            <Input
              id="title"
              placeholder="My Awesome Link"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-sm font-medium">
              Tags (optional)
            </Label>
            <Input
              id="tags"
              placeholder="marketing, campaign, social"
              value={formData.tags}
              onChange={(e) => handleInputChange("tags", e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!formData.longUrl || loading}
          >
            {loading ? "Creating..." : "Create Short URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
