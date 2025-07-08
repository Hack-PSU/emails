// src/app/email/ForwardingDialog.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Entry } from "./types";
import { cn } from "@/lib/utils";

interface ForwardingDialogProps {
  entries: Entry[];
  onEntriesChange: (newEntries: Entry[]) => void;
}

export default function ForwardingDialog({
  entries,
  onEntriesChange,
}: ForwardingDialogProps) {
  const [open, setOpen] = useState(false);
  // filter serves as both search and free-text mailbox input
  const [filter, setFilter] = useState("");
  const [mailbox, setMailbox] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [loading, setLoading] = useState(false);

  // Default address always ensured
  const defaultAddress = "hackpsudev@gmail.com";

  // Unique mailbox identifiers
  const mailboxKeys = useMemo(
    () => Array.from(new Set(entries.map((e) => e.mailbox))),
    [entries],
  );

  // Filtered mailbox suggestions
  const filteredMailboxes = useMemo(
    () =>
      filter
        ? mailboxKeys.filter((m) =>
            m.toLowerCase().includes(filter.toLowerCase()),
          )
        : mailboxKeys,
    [mailboxKeys, filter],
  );

  // Sync upstream entries on open
  useEffect(() => {
    if (open) onEntriesChange(entries);
  }, [open]);

  const handleAdd = async () => {
    // mailbox can be new (filter) or selected
    const chosen = mailbox || filter;
    if (!chosen || !forwardTo) return;
    setLoading(true);

    // Get existing forwards for chosen mailbox
    const existing = entries
      .filter((e) => e.mailbox === chosen)
      .map((e) => e.forwardTo);

    const toAdd: string[] = [];
    if (!existing.includes(defaultAddress)) toAdd.push(defaultAddress);
    if (!existing.includes(forwardTo)) toAdd.push(forwardTo);

    try {
      for (const addr of toAdd) {
        await fetch(
          `/api/email?mailbox=${encodeURIComponent(
            chosen,
          )}&forwardTo=${encodeURIComponent(addr)}`,
          { method: "POST" },
        );
      }
      const res = await fetch("/api/email");
      const data = await res.json();
      if (data.ok) onEntriesChange(data.ok);

      // reset
      setFilter("");
      setMailbox(null);
      setForwardTo("");
      setOpen(false);
    } catch (err) {
      console.error("Failed to update forwards", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="bg-gray-800"
          disabled={loading}
        >
          New Forward
        </Button>
      </DialogTrigger>

      <DialogContent className="w-96 p-6">
        <DialogHeader>
          <DialogTitle>Add Forwarding Rule</DialogTitle>
          <DialogDescription>
            Type or select a mailbox key and an address to forward to.
          </DialogDescription>
        </DialogHeader>

        {/* Mailbox combobox */}
        <div className="mt-4">
          <Command>
            <CommandInput
              placeholder="Search or type mailbox…"
              value={filter}
              onValueChange={(val) => {
                setFilter(val);
                setMailbox(null);
              }}
            />
            <CommandEmpty>No mailboxes found.</CommandEmpty>
            <ScrollArea className="max-h-40 mt-2">
              <CommandList>
                <CommandGroup heading="Existing Mailboxes">
                  {filteredMailboxes.map((m) => (
                    <CommandItem
                      key={m}
                      onSelect={() => {
                        setMailbox(m);
                        setFilter(m);
                      }}
                      className={cn(
                        "px-3 py-2 cursor-pointer",
                        mailbox === m && "bg-muted font-medium",
                      )}
                    >
                      {m}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {filter && !mailboxKeys.includes(filter) && (
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => setMailbox(filter)}
                      className="px-3 py-2 cursor-pointer italic"
                    >
                      Create mailbox &quot;{filter}&quot;
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </ScrollArea>
          </Command>
        </div>

        {/* Forward-to input */}
        <div className="mt-4">
          <Input
            placeholder="Forward to…"
            value={forwardTo}
            onChange={(e) => setForwardTo(e.target.value)}
            className="w-full"
          />
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleAdd}
            disabled={!(mailbox || filter) || !forwardTo || loading}
          >
            {loading ? "Saving…" : "Add Forward"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
