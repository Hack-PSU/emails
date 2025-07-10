"use client";

import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import type { Entry } from "./types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDownIcon, TrashIcon } from "lucide-react";
import ForwardingDialog from "./ForwardingDialog";
import { useAllOrganizers } from "@/common/api/organizer/hook";

interface Props {
  entries: Entry[];
  onEntriesChange: (newEntries: Entry[]) => void;
}

const defaultAddress = "hackpsudev@gmail.com";

export default function EntriesTable({ entries, onEntriesChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleting, setDeleting] = useState(false);

  const { data: organizers = [] } = useAllOrganizers();
  const nameLookup = useMemo(() => {
    return organizers.reduce<Record<string, string>>((acc, org) => {
      acc[org.email] = `${org.firstName} ${org.lastName}`;
      return acc;
    }, {});
  }, [organizers]);

  const statusLookup = useMemo(() => {
    return organizers.reduce<Record<string, boolean>>((acc, org) => {
      acc[org.email] = org.isActive ? true : false;
      return acc;
    }, {});
  }, [organizers]);

  const handleDelete = async (mailbox: string, forwardTo: string) => {
    setDeleting(true);
    try {
      await fetch(
        `/api/email?mailbox=${encodeURIComponent(mailbox)}&forwardTo=${encodeURIComponent(forwardTo)}`,
        { method: "DELETE" },
      );
      const res = await fetch("/api/email");
      const data = await res.json();
      if (data.ok) onEntriesChange(data.ok);
    } catch (err) {
      console.error("Failed to delete forward", err);
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Entry>[]>(
    () => [
      {
        accessorKey: "mailbox",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mailbox <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-lg">{getValue<string>()}</span>
        ),
      },
      {
        accessorKey: "forwardTo",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Forward To (Email) <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ getValue }) => (
          <span className="text-lg">{getValue<string>()}</span>
        ),
      },
      {
        id: "forwardToName",
        header: "Name",
        cell: ({ row }) => {
          const email = row.original.forwardTo;
          const name = nameLookup[email];
          if (email === defaultAddress) {
            return <span className="text-lg">Default Forward</span>;
          }
          if (!name) {
            return <span className="text-lg text-red-600">{email}</span>;
          }
          if (!statusLookup[email]) {
            return <span className="text-lg text-red-600">{name}</span>;
          }
          return <span className="text-lg">{name ?? ""}</span>;
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const { mailbox, forwardTo } = row.original;
          const forwardsForMailbox = entries.filter(
            (e) => e.mailbox === mailbox,
          );
          const disableDelete =
            (forwardTo === defaultAddress && forwardsForMailbox.length > 1) ||
            mailbox === "*";

          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(mailbox, forwardTo)}
              disabled={disableDelete || deleting}
              className="text-error"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [entries, deleting, nameLookup],
  );

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="flex items-center space-x-4 mb-4">
        <ForwardingDialog entries={entries} onEntriesChange={onEntriesChange} />
        <Input
          className="h-12 text-lg flex-1"
          placeholder="Filter mailbox…"
          value={(table.getColumn("mailbox")?.getFilterValue() as string) || ""}
          onChange={(e) =>
            table.getColumn("mailbox")?.setFilterValue(e.target.value)
          }
        />
        <Input
          className="h-12 text-lg flex-1"
          placeholder="Filter forward-to…"
          value={
            (table.getColumn("forwardTo")?.getFilterValue() as string) || ""
          }
          onChange={(e) =>
            table.getColumn("forwardTo")?.setFilterValue(e.target.value)
          }
        />
      </div>

      {/* Data Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="h-12">
                {hg.headers.map((header) => (
                  <TableHead key={header.id} className="text-lg">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="h-14">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-lg">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-lg"
                >
                  No entries.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
