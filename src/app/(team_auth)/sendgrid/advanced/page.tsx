"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RefreshCw,
  Globe,
  Monitor,
  Server,
  CalendarIcon,
  ArrowLeft,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  AdvancedStat,
  AggregatedAdvancedStat,
} from "@/common/sendgrid/types";
import { formatNumber } from "@/common/sendgrid/sendgrid-utils";
import Link from "next/link";
import GeographicHeatmap from "@/components/geographic-heatmap";

// Helper function to aggregate advanced stats
const aggregateAdvancedStats = (
  data: AdvancedStat[],
): AggregatedAdvancedStat[] => {
  const aggregation: { [key: string]: Record<string, number> } = {};

  data.forEach((day) => {
    day.stats.forEach((stat) => {
      const key = stat.name;
      if (!aggregation[key]) {
        aggregation[key] = {};
      }
      Object.entries(stat.metrics).forEach(([metricKey, value]) => {
        aggregation[key][metricKey] =
          (aggregation[key][metricKey] || 0) + (value || 0);
      });
    });
  });

  return Object.entries(aggregation)
    .map(([name, metrics]) => ({ name, metrics }))
    .sort((a, b) => {
      const aValue =
        b.metrics.requests ||
        b.metrics.unique_clicks ||
        b.metrics.unique_opens ||
        0;
      const bValue =
        a.metrics.requests ||
        a.metrics.unique_clicks ||
        a.metrics.unique_opens ||
        0;
      return aValue - bValue;
    });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdvancedDashboard() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [limit, setLimit] = useState(100);
  const [offset] = useState(0);

  // State for advanced stats
  const [browserStats, setBrowserStats] = useState<AdvancedStat[]>([]);
  const [geoStats, setGeoStats] = useState<AdvancedStat[]>([]);
  const [providerStats, setProviderStats] = useState<AdvancedStat[]>([]);

  const fetchAdvancedStats = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const [browsers, geo, providers] = await Promise.all([
        fetch(`/api/sendgrid/advanced-stats?type=browsers&${queryParams}`).then(
          (res) => res.json(),
        ),
        fetch(`/api/sendgrid/advanced-stats?type=geo&${queryParams}`).then(
          (res) => res.json(),
        ),
        fetch(
          `/api/sendgrid/advanced-stats?type=mailbox_providers&${queryParams}`,
        ).then((res) => res.json()),
      ]);
      setBrowserStats(browsers);
      setGeoStats(geo);
      setProviderStats(providers);
      toast.success("Advanced statistics updated");
    } catch (error) {
      console.error("Error fetching advanced stats:", error);
      toast.error("Failed to fetch advanced statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvancedStats();
  }, []);

  const aggregatedBrowserStats = useMemo(
    () => aggregateAdvancedStats(browserStats),
    [browserStats],
  );
  const aggregatedGeoStats = useMemo(
    () => aggregateAdvancedStats(geoStats),
    [geoStats],
  );
  const aggregatedProviderStats = useMemo(
    () => aggregateAdvancedStats(providerStats),
    [providerStats],
  );

  // Add this after the aggregatedGeoStats useMemo
  console.log("Raw geo stats:", geoStats);
  console.log("Aggregated geo stats:", aggregatedGeoStats);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/sendgrid">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Advanced Email Analytics</h1>
            <p className="text-muted-foreground">
              Segmented statistics for deeper insights
            </p>
          </div>
        </div>
        <Button onClick={fetchAdvancedStats} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Configure your data view. Advanced stats are limited to the last 7
            days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? (
                      format(endDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={limit}
                onChange={(e) =>
                  setLimit(Number.parseInt(e.target.value) || 100)
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchAdvancedStats}
                disabled={loading}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="mailbox-providers" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mailbox-providers">
            <Server className="w-4 h-4 mr-2" />
            Mailbox Providers
          </TabsTrigger>
          <TabsTrigger value="browsers">
            <Monitor className="w-4 h-4 mr-2" />
            Browsers
          </TabsTrigger>
          <TabsTrigger value="geo">
            <Globe className="w-4 h-4 mr-2" />
            Geography
          </TabsTrigger>
        </TabsList>
        <TabsContent value="mailbox-providers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance by Mailbox Provider</CardTitle>
              <CardDescription>
                Comparison of deliverability and engagement across different
                email providers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={aggregatedProviderStats.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="metrics.delivered"
                    fill="#22c55e"
                    name="Delivered"
                  />
                  <Bar
                    dataKey="metrics.bounces"
                    fill="#ef4444"
                    name="Bounces"
                  />
                  <Bar
                    dataKey="metrics.spam_reports"
                    fill="#dc2626"
                    name="Spam Reports"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="browsers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Clicks by Browser</CardTitle>
              <CardDescription>
                Unique clicks segmented by the recipient&apos;s browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={aggregatedBrowserStats.slice(0, 10)}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="metrics.unique_clicks"
                    fill="#3b82f6"
                    name="Unique Clicks"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="geo" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Opens by Country</CardTitle>
                <CardDescription>
                  Geographic distribution of unique email opens worldwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeographicHeatmap
                  data={aggregatedGeoStats}
                  metric="unique_opens"
                  title="Unique Opens Heatmap"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Email Clicks by Country</CardTitle>
                <CardDescription>
                  Geographic distribution of unique email clicks worldwide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GeographicHeatmap
                  data={aggregatedGeoStats}
                  metric="unique_clicks"
                  title="Unique Clicks Heatmap"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Geographic Data</CardTitle>
                <CardDescription>
                  Opens and clicks segmented by country and state/province (US &
                  CA only).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Unique Opens</TableHead>
                      <TableHead>Unique Clicks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregatedGeoStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell>{stat.name}</TableCell>
                        <TableCell>
                          {formatNumber(stat.metrics.unique_opens || 0)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(stat.metrics.unique_clicks || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
