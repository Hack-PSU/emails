"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { useAllOrganizers } from "@/common/api/organizer/hook";

interface ForwardingDialogProps {
  entries: Entry[];
  onEntriesChange: (newEntries: Entry[]) => void;
}

export default function ForwardingDialog({
  entries,
  onEntriesChange,
}: ForwardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [mailbox, setMailbox] = useState<string | null>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<{
    chosen: string;
    forwardTo: string;
  } | null>(null);

  const emailSchema = useMemo(
    () => z.string().email("Please enter a valid email address"),
    []
  );

  const { data: organizers = [] } = useAllOrganizers();
  const organizerEmails = useMemo(
    () => organizers.map((o) => o.email),
    [organizers]
  );

  const defaultAddress = "hackpsudev@gmail.com";

  const mailboxKeys = useMemo(
    () => Array.from(new Set(entries.map((e) => e.mailbox))),
    [entries]
  );

  const filteredMailboxes = useMemo(
    () =>
      filter
        ? mailboxKeys.filter((m) =>
            m.toLowerCase().includes(filter.toLowerCase())
          )
        : mailboxKeys,
    [mailboxKeys, filter]
  );

  useEffect(() => {
    if (open) onEntriesChange(entries);
  }, [open]);

  const handleForwardToChange = (val: string) => {
    setForwardTo(val);
    const result = emailSchema.safeParse(val);
    setEmailError(result.success ? null : result.error.errors[0].message);
  };

  const actuallyAdd = async (chosen: string, forwardToAddr: string) => {
    const existing = entries
      .filter((e) => e.mailbox === chosen)
      .map((e) => e.forwardTo);
    const toAdd: string[] = [];
    if (!existing.includes(defaultAddress)) toAdd.push(defaultAddress);
    if (!existing.includes(forwardToAddr)) toAdd.push(forwardToAddr);

    for (const addr of toAdd) {
      await fetch(
        `/api/email?mailbox=${encodeURIComponent(
          chosen
        )}&forwardTo=${encodeURIComponent(addr)}`,
        { method: "POST" }
      );
    }
    const res = await fetch("/api/email");
    const data = await res.json();
    if (data.ok) onEntriesChange(data.ok);
  };

  const handleAddClick = () => {
    const chosen = mailbox || filter;
    if (!chosen || !forwardTo || emailError) return;

    if (!organizerEmails.includes(forwardTo)) {
      setPending({ chosen, forwardTo });
      setConfirmOpen(true);
    } else {
      setLoading(true);
      actuallyAdd(chosen, forwardTo)
        .then(() => {
          setFilter("");
          setMailbox(null);
          setForwardTo("");
          setOpen(false);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  // confirm non-organizer
  const handleConfirm = async () => {
    if (!pending) return;
    setConfirmOpen(false);
    setLoading(true);
    try {
      await actuallyAdd(pending.chosen, pending.forwardTo);
      setFilter("");
      setMailbox(null);
      setForwardTo("");
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setPending(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="lg" disabled={loading}>
            New Forward
          </Button>
        </DialogTrigger>

        <DialogContent className="w-96 p-6">
          <DialogHeader>
            <DialogTitle>Add Forwarding Rule</DialogTitle>
            <DialogDescription>
              Type or select a mailbox and an address to forward to.
            </DialogDescription>
          </DialogHeader>

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
                          mailbox === m && "bg-muted font-medium"
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
                        Create mailbox "{filter}"
                      </CommandItem>
                    </CommandGroup>
                  )}
                </CommandList>
              </ScrollArea>
            </Command>
          </div>

          <div className="mt-4">
            <Input
              placeholder="Forward to…"
              value={forwardTo}
              onChange={(e) => handleForwardToChange(e.target.value)}
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && (
              <p className="mt-1 text-sm text-red-600">{emailError}</p>
            )}
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
              onClick={handleAddClick}
              disabled={
                !(mailbox || filter) || !forwardTo || !!emailError || loading
              }
            >
              {loading ? "Saving…" : "Add Forward"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="w-80 p-4">
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              “{pending?.forwardTo}” is not a HackPSU organizer. Proceed anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false);
                setPending(null);
              }}
              disabled={loading}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading}
            >
              Yes, add anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
