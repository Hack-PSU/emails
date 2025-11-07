"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ShlinkShortUrl } from "@/common/shlink/types";
import ShlinkService from "@/common/shlink/service";
import { toast } from "sonner";

interface EditLinkDialogProps {
  link: ShlinkShortUrl | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinksChange: (newLinks: ShlinkShortUrl[]) => void;
}

const urlSchema = z.string().url("Please enter a valid URL");

export default function EditLinkDialog({
  link,
  open,
  onOpenChange,
  onLinksChange,
}: EditLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    longUrl: "",
    title: "",
    tags: "",
    maxVisits: "",
  });
  const [errors, setErrors] = useState<{
    longUrl?: string;
    maxVisits?: string;
  }>({});

  // Populate form when link changes
  useEffect(() => {
    if (link) {
      setFormData({
        longUrl: link.longUrl || "",
        title: link.title || "",
        tags: link.tags?.join(", ") || "",
        maxVisits: link.meta?.maxVisits?.toString() || "",
      });
      setErrors({});
    }
  }, [link]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    const urlResult = urlSchema.safeParse(formData.longUrl);
    if (!urlResult.success) {
      newErrors.longUrl = urlResult.error.errors[0].message;
    }

    if (formData.maxVisits && isNaN(Number(formData.maxVisits))) {
      newErrors.maxVisits = "Max visits must be a number";
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
    if (!link || !validateForm()) return;

    setLoading(true);
    try {
      const updates = {
        longUrl: formData.longUrl,
        ...(formData.title !== undefined && { title: formData.title }),
        ...(formData.tags && {
          tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
        ...(formData.maxVisits && { maxVisits: Number(formData.maxVisits) }),
      };

      await ShlinkService.editShortUrl(
        link.shortCode,
        updates,
        link.domain || undefined,
      );

      // Refresh the list
      const result = await ShlinkService.listShortUrls({
        orderBy: { field: "dateCreated", dir: "DESC" },
      });
      onLinksChange(result.data);

      onOpenChange(false);
      toast.success("Short URL updated successfully!");
    } catch (err: unknown) {
      console.error("Failed to update short URL", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update short URL",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!link) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[500px] p-6">
        <DialogHeader>
          <DialogTitle>Edit Short URL</DialogTitle>
          <DialogDescription>
            Update the destination and metadata for your short URL.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-sm font-medium text-gray-500">
              Short Code (cannot be changed)
            </Label>
            <div className="mt-1 p-2 bg-gray-100 rounded-md">
              <span className="font-mono text-sm">{link.shortCode}</span>
            </div>
          </div>

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

          <div>
            <Label htmlFor="maxVisits" className="text-sm font-medium">
              Max Visits (optional)
            </Label>
            <Input
              id="maxVisits"
              type="number"
              placeholder="100"
              value={formData.maxVisits}
              onChange={(e) => handleInputChange("maxVisits", e.target.value)}
              className={errors.maxVisits ? "border-red-500" : ""}
            />
            {errors.maxVisits && (
              <p className="mt-1 text-sm text-red-600">{errors.maxVisits}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Leave empty for unlimited visits
            </p>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!formData.longUrl || loading}
          >
            {loading ? "Updating..." : "Update Short URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
