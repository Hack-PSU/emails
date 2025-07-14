"use client";

import { useEffect, useState } from "react";
import type { Entry } from "./types";
import EntriesTable from "./EntriesTable";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmailForwardingPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/email");
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        setEntries(data.ok);
        // eslint-disable-next-line
      } catch (err: any) {
        setError(err.message);
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
      <EntriesTable entries={entries} onEntriesChange={setEntries} />
    </div>
  );
}
