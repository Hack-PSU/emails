'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
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
} from 'recharts';
import { DmarcReportStats } from '@/common/dmarc/types';

const COLORS = {
  compliant: '#22c55e',
  nonCompliant: '#ef4444',
  none: '#3b82f6',
  quarantine: '#f59e0b',
  reject: '#dc2626',
};

interface DomainSummary {
  domain: string;
  totalMessages: number;
  dmarcPass: number;
  spfPass: number;
  dkimPass: number;
  passRate: number;
}

export function DmarcStatsView() {
  const [stats, setStats] = useState<DmarcReportStats | null>(null);
  const [domainSummary, setDomainSummary] = useState<DomainSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const fetchStats = React.useCallback(async () => {
    setIsLoading(true);
    try {
      let url = '/api/dmarc/stats';
      if (startDate && endDate) {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setDomainSummary(data.domainSummary || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearDates = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">No data available. Fetch some reports to see statistics.</p>
        </CardContent>
      </Card>
    );
  }

  const dispositionData = [
    { name: 'None', value: stats.dispositionBreakdown.none },
    { name: 'Quarantine', value: stats.dispositionBreakdown.quarantine },
    { name: 'Reject', value: stats.dispositionBreakdown.reject },
  ];

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
          <CardDescription>Select a date range to filter reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(startDate || endDate) && (
              <Button variant="outline" onClick={handleClearDates}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DMARC Pass Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dmarcPassRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.compliantMessages.toLocaleString()} compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.nonCompliantMessages.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Pass Rates */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SPF Pass Rate</CardTitle>
            <CardDescription>Sender Policy Framework authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.spfPassRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DKIM Pass Rate</CardTitle>
            <CardDescription>DomainKeys Identified Mail authentication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.dkimPassRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Timeline</CardTitle>
          <CardDescription>Daily breakdown of compliant vs non-compliant messages</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="compliant"
                stroke={COLORS.compliant}
                name="Compliant"
              />
              <Line
                type="monotone"
                dataKey="nonCompliant"
                stroke={COLORS.nonCompliant}
                name="Non-Compliant"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Disposition Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Policy Disposition</CardTitle>
            <CardDescription>Actions taken on failed messages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dispositionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dispositionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === 'None'
                          ? COLORS.none
                          : entry.name === 'Quarantine'
                          ? COLORS.quarantine
                          : COLORS.reject
                      }
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Failed IPs */}
        <Card>
          <CardHeader>
            <CardTitle>Top Failed Source IPs</CardTitle>
            <CardDescription>Sources with most authentication failures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.topFailedIPs.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ip" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS.nonCompliant} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Domain Summary */}
      {domainSummary && domainSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Domain Summary</CardTitle>
            <CardDescription>Authentication results by sending domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Domain</th>
                    <th className="text-right p-2">Messages</th>
                    <th className="text-right p-2">DMARC Pass</th>
                    <th className="text-right p-2">SPF Pass</th>
                    <th className="text-right p-2">DKIM Pass</th>
                    <th className="text-right p-2">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {domainSummary.slice(0, 10).map((domain, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-xs">{domain.domain}</td>
                      <td className="text-right p-2">{domain.totalMessages.toLocaleString()}</td>
                      <td className="text-right p-2">{domain.dmarcPass.toLocaleString()}</td>
                      <td className="text-right p-2">{domain.spfPass.toLocaleString()}</td>
                      <td className="text-right p-2">{domain.dkimPass.toLocaleString()}</td>
                      <td className="text-right p-2">
                        <span className={domain.passRate >= 80 ? 'text-green-600 font-semibold' : domain.passRate >= 50 ? 'text-yellow-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {domain.passRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Failed IPs Table */}
      {stats.topFailedIPs && stats.topFailedIPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Failed Source IPs (Detailed)</CardTitle>
            <CardDescription>Complete list of IP addresses with authentication failures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Rank</th>
                    <th className="text-left p-2">IP Address</th>
                    <th className="text-right p-2">Failed Count</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topFailedIPs.slice(0, 20).map((ip, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="p-2">{idx + 1}</td>
                      <td className="p-2 font-mono text-xs">{ip.ip}</td>
                      <td className="text-right p-2">{ip.count.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
