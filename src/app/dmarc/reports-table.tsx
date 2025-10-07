'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ParsedDmarcReport } from '@/common/dmarc/types';
import { format } from 'date-fns';
import { ReportDetailDialog } from './report-detail-dialog';
import { Eye } from 'lucide-react';

export function DmarcReportsTable() {
  const [reports, setReports] = useState<ParsedDmarcReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ParsedDmarcReport | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/dmarc/reports');
      if (response.ok) {
        const data = await response.json();
        // Sort by date range end, newest first
        const sortedReports = data.reports.sort((a: ParsedDmarcReport, b: ParsedDmarcReport) => {
          return b.reportMetadata.date_range.end - a.reportMetadata.date_range.end;
        });
        setReports(sortedReports);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (report: ParsedDmarcReport) => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = [
      'Report ID',
      'Organization',
      'Domain',
      'Date Range Start',
      'Date Range End',
      'Policy',
      'Total Records',
      'Processed At',
    ];

    const rows = filteredReports.map((report) => [
      report.id,
      report.reportMetadata.org_name,
      report.policyPublished.domain,
      new Date(report.reportMetadata.date_range.begin * 1000).toISOString(),
      new Date(report.reportMetadata.date_range.end * 1000).toISOString(),
      report.policyPublished.p,
      report.records.length,
      report.processedAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dmarc-reports-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredReports = reports.filter(
    (report) =>
      report.reportMetadata.org_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.policyPublished.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>DMARC Reports</CardTitle>
            <CardDescription>View and export all processed DMARC reports</CardDescription>
          </div>
          <Button onClick={exportToCSV} disabled={filteredReports.length === 0}>
            Export to CSV
          </Button>
        </div>
        <div className="mt-4">
          <Input
            placeholder="Search by organization, domain, or report ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredReports.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {searchTerm ? 'No reports match your search' : 'No reports available'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processed</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Report ID</TableHead>
                <TableHead>Policy</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">
                    {format(new Date(report.processedAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.reportMetadata.date_range.begin * 1000), 'MMM d')} -{' '}
                    {format(new Date(report.reportMetadata.date_range.end * 1000), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {report.reportMetadata.org_name}
                  </TableCell>
                  <TableCell>{report.policyPublished.domain}</TableCell>
                  <TableCell className="font-mono text-xs">{report.id}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {report.policyPublished.p}
                    </span>
                  </TableCell>
                  <TableCell>{report.records.length}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReport(report)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ReportDetailDialog
        report={selectedReport}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
