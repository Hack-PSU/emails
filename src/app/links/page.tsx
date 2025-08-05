"use client";

import { useEffect, useState } from "react";
import type { ShlinkShortUrl } from "@/common/shlink/types";
import LinksTable from "./LinksTable";
import { Skeleton } from "@/components/ui/skeleton";
import ShlinkService from "@/common/shlink/service";

export default function LinksPage() {
  const [links, setLinks] = useState<ShlinkShortUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const result = await ShlinkService.listShortUrls({
          orderBy: { field: "dateCreated", dir: "DESC" },
        });
        setLinks(result.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col space-y-2 p-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );

  if (error) return <p className="text-lg text-red-600">Error: {error}</p>;

  return (
    <div className="p-8 space-y-6 text-lg">
      <LinksTable links={links} onLinksChange={setLinks} />
    </div>
  );
}
