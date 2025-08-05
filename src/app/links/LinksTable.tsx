"use client";

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import type { ShlinkShortUrl } from "@/common/shlink/types";
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
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpDownIcon,
  TrashIcon,
  ExternalLinkIcon,
  CopyIcon,
} from "lucide-react";
import CreateLinkDialog from "./CreateLinkDialog";
import ShlinkService from "@/common/shlink/service";
import { toast } from "sonner";
import { format } from "date-fns";

interface Props {
  links: ShlinkShortUrl[];
  onLinksChange: (newLinks: ShlinkShortUrl[]) => void;
}

export default function LinksTable({ links, onLinksChange }: Props) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (shortCode: string, domain?: string) => {
    setDeleting(shortCode);
    try {
      await ShlinkService.deleteShortUrl(shortCode, domain);

      // Refresh the list
      const result = await ShlinkService.listShortUrls({
        orderBy: { field: "dateCreated", dir: "DESC" },
      });
      onLinksChange(result.data);
      toast.success("Short URL deleted successfully");
    } catch (err) {
      console.error("Failed to delete short URL", err);
      toast.error("Failed to delete short URL");
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const columns = useMemo<ColumnDef<ShlinkShortUrl>[]>(
    () => [
      {
        accessorKey: "shortUrl",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Short URL <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const url = getValue<string>();
          return (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-mono text-blue-600">{url}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(url)}
                className="h-6 w-6 p-0"
              >
                <CopyIcon className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(url, "_blank")}
                className="h-6 w-6 p-0"
              >
                <ExternalLinkIcon className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "longUrl",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Long URL <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const url = getValue<string>();
          const maxLength = 40;
          const truncatedUrl =
            url.length > maxLength ? `${url.slice(0, maxLength)}...` : url;

          return (
            <div className="max-w-xs">
              <span className="text-lg cursor-help" title={url}>
                {truncatedUrl}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ getValue }) => {
          const title = getValue<string>();
          if (!title) {
            return <span className="text-lg text-gray-400">No title</span>;
          }

          const maxLength = 30;
          const truncatedTitle =
            title.length > maxLength
              ? `${title.slice(0, maxLength)}...`
              : title;

          return (
            <span className="text-lg cursor-help" title={title}>
              {truncatedTitle}
            </span>
          );
        },
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ getValue }) => {
          const tags = getValue<string[]>();
          return (
            <div className="flex flex-wrap gap-1">
              {tags?.length > 0 ? (
                tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-400">No tags</span>
              )}
            </div>
          );
        },
      },
      {
        id: "visits",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Visits <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ row }) => {
          const visits =
            row.original.visitsSummary?.total || row.original.visitsCount || 0;
          return <span className="text-lg font-semibold">{visits}</span>;
        },
      },
      {
        accessorKey: "dateCreated",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="lg"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created <ArrowUpDownIcon className="ml-1 h-5 w-5" />
          </Button>
        ),
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return (
            <span className="text-lg">
              {format(new Date(date), "MMM dd, yyyy")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const { shortCode, domain } = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(shortCode, domain || undefined)}
              disabled={deleting === shortCode}
              className="text-red-600 hover:text-red-700"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [deleting],
  );

  const table = useReactTable({
    data: links,
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
        <CreateLinkDialog links={links} onLinksChange={onLinksChange} />
        <Input
          className="h-12 text-lg flex-1"
          placeholder="Filter by short URL or long URL..."
          value={
            (table.getColumn("shortUrl")?.getFilterValue() as string) || ""
          }
          onChange={(e) => {
            const value = e.target.value;
            table.getColumn("shortUrl")?.setFilterValue(value);
            table.getColumn("longUrl")?.setFilterValue(value);
          }}
        />
      </div>

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
                  No short URLs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
