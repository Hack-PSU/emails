/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Mail,
  MousePointer,
  AlertTriangle,
  Users,
  CalendarIcon,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { SendGridStats, DashboardFilters } from "@/common/sendgrid/types";
import {
  aggregateMetrics,
  calculateRates,
  formatNumber,
  formatPercentage,
} from "@/common/sendgrid/sendgrid-utils";

export default function SendGridDashboard() {
  const [stats, setStats] = useState<SendGridStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    aggregatedBy: "day",
    limit: 100,
    offset: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        aggregated_by: filters.aggregatedBy,
        limit: filters.limit.toString(),
        offset: filters.offset.toString(),
      });

      const response = await fetch(`/api/sendgrid/stats?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch statistics");
      }

      const data = await response.json();
      setStats(data);
      toast.success("Statistics updated successfully");
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalMetrics = aggregateMetrics(stats);
  const rates = calculateRates(totalMetrics);

  // Prepare chart data
  const timeSeriesData = stats.map((stat) => {
    const metrics = stat.stats[0]?.metrics || {};
    return {
      date: format(new Date(stat.date), "MMM dd"),
      fullDate: stat.date,
      delivered: metrics.delivered || 0,
      opens: metrics.unique_opens || 0,
      clicks: metrics.unique_clicks || 0,
      bounces: metrics.bounces || 0,
      requests: metrics.requests || 0,
      spam: metrics.spam_reports || 0,
      unsubscribes: metrics.unsubscribes || 0,
      openRate:
        metrics.delivered > 0
          ? ((metrics.unique_opens || 0) / metrics.delivered) * 100
          : 0,
      clickRate:
        metrics.delivered > 0
          ? ((metrics.unique_clicks || 0) / metrics.delivered) * 100
          : 0,
      bounceRate:
        metrics.requests > 0
          ? ((metrics.bounces || 0) / metrics.requests) * 100
          : 0,
    };
  });

  // Pie chart data for email status breakdown
  const statusBreakdownData = [
    { name: "Delivered", value: totalMetrics.delivered, color: "#22c55e" },
    { name: "Bounced", value: totalMetrics.bounces, color: "#ef4444" },
    { name: "Deferred", value: totalMetrics.deferred, color: "#f59e0b" },
    { name: "Blocked", value: totalMetrics.blocks, color: "#dc2626" },
  ].filter((item) => item.value > 0);

  // Engagement breakdown
  const engagementData = [
    { name: "Opened", value: totalMetrics.unique_opens, color: "#3b82f6" },
    { name: "Clicked", value: totalMetrics.unique_clicks, color: "#8b5cf6" },
    {
      name: "Not Engaged",
      value: Math.max(0, totalMetrics.delivered - totalMetrics.unique_opens),
      color: "#6b7280",
    },
  ].filter((item) => item.value > 0);

  // Issues breakdown
  const issuesData = [
    {
      name: "Spam Reports",
      value: totalMetrics.spam_reports,
      color: "#dc2626",
    },
    {
      name: "Unsubscribes",
      value: totalMetrics.unsubscribes,
      color: "#f59e0b",
    },
    {
      name: "Invalid Emails",
      value: totalMetrics.invalid_emails,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    description,
    color = "default",
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: number;
    description?: string;
    color?: "default" | "success" | "warning" | "destructive";
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === "number" ? formatNumber(value) : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center mt-1">
            {trend > 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs ${trend > 0 ? "text-green-500" : "text-red-500"}`}
            >
              {Math.abs(trend)}%
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}:{" "}
              {typeof entry.value === "number" && entry.name.includes("Rate")
                ? `${entry.value.toFixed(2)}%`
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Toaster />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SendGrid Email Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive email statistics and performance metrics
          </p>
        </div>
        <Button onClick={fetchStats} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Enhanced Filters with DatePicker */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Configure your data view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <Label>Aggregation</Label>
              <Select
                value={filters.aggregatedBy}
                onValueChange={(value: "day" | "week" | "month") =>
                  setFilters((prev) => ({ ...prev, aggregatedBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="limit">Limit</Label>
              <Input
                id="limit"
                type="number"
                value={filters.limit}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    limit: Number.parseInt(e.target.value) || 100,
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchStats}
                disabled={loading}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Emails Sent"
          value={totalMetrics.requests}
          icon={Mail}
          description="Total email requests processed"
        />
        <MetricCard
          title="Delivered"
          value={totalMetrics.delivered}
          icon={TrendingUp}
          description={`${formatPercentage(rates.deliveryRate)} delivery rate`}
          color="success"
        />
        <MetricCard
          title="Opens"
          value={totalMetrics.unique_opens}
          icon={MousePointer}
          description={`${formatPercentage(rates.openRate)} open rate`}
        />
        <MetricCard
          title="Clicks"
          value={totalMetrics.unique_clicks}
          icon={MousePointer}
          description={`${formatPercentage(rates.clickRate)} click rate`}
        />
      </div>

      {/* Performance Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Delivery Rate"
          value={formatPercentage(rates.deliveryRate)}
          icon={TrendingUp}
          color="success"
        />
        <MetricCard
          title="Open Rate"
          value={formatPercentage(rates.openRate)}
          icon={MousePointer}
        />
        <MetricCard
          title="Click Rate"
          value={formatPercentage(rates.clickRate)}
          icon={MousePointer}
        />
        <MetricCard
          title="Bounce Rate"
          value={formatPercentage(rates.bounceRate)}
          icon={AlertTriangle}
          color="warning"
        />
        <MetricCard
          title="Spam Rate"
          value={formatPercentage(rates.spamRate)}
          icon={AlertTriangle}
          color="destructive"
        />
        <MetricCard
          title="Unsubscribe Rate"
          value={formatPercentage(rates.unsubscribeRate)}
          icon={Users}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Volume Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Email Volume Trend</CardTitle>
            <CardDescription>
              Daily email sending and delivery trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="requests" fill="#3b82f6" name="Sent" />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  stroke="#22c55e"
                  name="Delivered"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend</CardTitle>
            <CardDescription>
              Opens and clicks over time (absolute numbers)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="opens"
                  stroke="#3b82f6"
                  name="Opens"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#8b5cf6"
                  name="Clicks"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Rates Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Rates</CardTitle>
            <CardDescription>
              Open, click, and bounce rates over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="openRate"
                  stroke="#22c55e"
                  name="Open Rate %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="clickRate"
                  stroke="#3b82f6"
                  name="Click Rate %"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="bounceRate"
                  stroke="#ef4444"
                  name="Bounce Rate %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Email Status Breakdown</CardTitle>
            <CardDescription>
              Distribution of email delivery statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>
              How recipients interact with delivered emails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatNumber(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Issues Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Issues Over Time</CardTitle>
            <CardDescription>
              Bounces, spam reports, and unsubscribes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="bounces"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  name="Bounces"
                />
                <Area
                  type="monotone"
                  dataKey="spam"
                  stackId="1"
                  stroke="#dc2626"
                  fill="#dc2626"
                  name="Spam Reports"
                />
                <Area
                  type="monotone"
                  dataKey="unsubscribes"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  name="Unsubscribes"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Volume Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Requests</span>
                    <Badge variant="outline">
                      {formatNumber(totalMetrics.requests)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Processed</span>
                    <Badge variant="outline">
                      {formatNumber(totalMetrics.processed)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivered</span>
                    <Badge variant="default">
                      {formatNumber(totalMetrics.delivered)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Deferred</span>
                    <Badge variant="secondary">
                      {formatNumber(totalMetrics.deferred)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issue Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Bounces</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.bounces)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Blocks</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.blocks)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Invalid Emails</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.invalid_emails)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Spam Reports</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.spam_reports)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Opens</span>
                    <Badge variant="outline">
                      {formatNumber(totalMetrics.opens)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Opens</span>
                    <Badge variant="default">
                      {formatNumber(totalMetrics.unique_opens)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Clicks</span>
                    <Badge variant="outline">
                      {formatNumber(totalMetrics.clicks)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unique Clicks</span>
                    <Badge variant="default">
                      {formatNumber(totalMetrics.unique_clicks)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unsubscribe Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Unsubscribes</span>
                    <Badge variant="secondary">
                      {formatNumber(totalMetrics.unsubscribes)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unsubscribe Drops</span>
                    <Badge variant="secondary">
                      {formatNumber(totalMetrics.unsubscribe_drops)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Unsubscribe Rate</span>
                    <Badge variant="outline">
                      {formatPercentage(rates.unsubscribeRate)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deliverability" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Bounce Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Hard Bounces</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.bounces)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Drops</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.bounce_drops)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Bounce Rate</span>
                    <Badge variant="outline">
                      {formatPercentage(rates.bounceRate)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spam Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Spam Reports</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.spam_reports)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Spam Report Drops</span>
                    <Badge variant="destructive">
                      {formatNumber(totalMetrics.spam_report_drops)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Spam Rate</span>
                    <Badge variant="outline">
                      {formatPercentage(rates.spamRate)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="raw-data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Raw Statistics Data</CardTitle>
              <CardDescription>Detailed breakdown by date</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Delivered</TableHead>
                      <TableHead>Opens</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Bounces</TableHead>
                      <TableHead>Spam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((stat, index) => {
                      const metrics = stat.stats[0]?.metrics || {};
                      return (
                        <TableRow key={index}>
                          <TableCell>{stat.date}</TableCell>
                          <TableCell>
                            {formatNumber(metrics.requests || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(metrics.delivered || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(metrics.unique_opens || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(metrics.unique_clicks || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(metrics.bounces || 0)}
                          </TableCell>
                          <TableCell>
                            {formatNumber(metrics.spam_reports || 0)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
