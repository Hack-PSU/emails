'use client';

import { ParsedDmarcReport } from '@/common/dmarc/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReportDetailDialogProps {
  report: ParsedDmarcReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDetailDialog({ report, open, onOpenChange }: ReportDetailDialogProps) {
  if (!report) return null;

  const getStatusBadge = (status: string) => {
    if (status === 'pass') {
      return <Badge className="bg-green-600">Pass</Badge>;
    } else if (status === 'fail') {
      return <Badge className="bg-red-600">Fail</Badge>;
    } else {
      return <Badge className="bg-yellow-600">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DMARC Report Details</DialogTitle>
          <DialogDescription>
            Report ID: {report.id} from {report.reportMetadata.org_name}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="records">Records ({report.records.length})</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            {/* Report Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Report Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Organization</p>
                    <p className="text-sm">{report.reportMetadata.org_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Report ID</p>
                    <p className="text-sm font-mono text-xs">{report.reportMetadata.report_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm">{report.reportMetadata.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date Range</p>
                    <p className="text-sm">
                      {format(new Date(report.reportMetadata.date_range.begin * 1000), 'MMM d, yyyy HH:mm')}
                      {' - '}
                      {format(new Date(report.reportMetadata.date_range.end * 1000), 'MMM d, yyyy HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Processed At</p>
                    <p className="text-sm">
                      {format(new Date(report.processedAt), 'MMM d, yyyy HH:mm:ss')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policy Published */}
            <Card>
              <CardHeader>
                <CardTitle>Published Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Domain</p>
                    <p className="text-sm font-mono">{report.policyPublished.domain}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Policy (p)</p>
                    <p className="text-sm">
                      <Badge variant="outline">{report.policyPublished.p}</Badge>
                    </p>
                  </div>
                  {report.policyPublished.sp && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Subdomain Policy (sp)</p>
                      <p className="text-sm">
                        <Badge variant="outline">{report.policyPublished.sp}</Badge>
                      </p>
                    </div>
                  )}
                  {report.policyPublished.adkim && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">DKIM Alignment (adkim)</p>
                      <p className="text-sm">{report.policyPublished.adkim}</p>
                    </div>
                  )}
                  {report.policyPublished.aspf && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">SPF Alignment (aspf)</p>
                      <p className="text-sm">{report.policyPublished.aspf}</p>
                    </div>
                  )}
                  {report.policyPublished.pct && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Percentage (pct)</p>
                      <p className="text-sm">{report.policyPublished.pct}%</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Report Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Records</p>
                    <p className="text-2xl font-bold">{report.records.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Messages</p>
                    <p className="text-2xl font-bold">
                      {report.records.reduce((sum, r) => sum + r.row.count, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">DMARC Pass</p>
                    <p className="text-2xl font-bold text-green-600">
                      {report.records.filter(r => r.row.policy_evaluated.dkim === 'pass' || r.row.policy_evaluated.spf === 'pass').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">DMARC Fail</p>
                    <p className="text-2xl font-bold text-red-600">
                      {report.records.filter(r => r.row.policy_evaluated.dkim !== 'pass' && r.row.policy_evaluated.spf !== 'pass').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <div className="space-y-4">
              {report.records.map((record, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">Record #{idx + 1}</CardTitle>
                    <CardDescription>
                      Source IP: {record.row.source_ip} | Count: {record.row.count.toLocaleString()} messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Policy Evaluated */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Policy Evaluated</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Disposition</p>
                          <Badge variant="outline">{record.row.policy_evaluated.disposition}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">DKIM</p>
                          {getStatusBadge(record.row.policy_evaluated.dkim)}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">SPF</p>
                          {getStatusBadge(record.row.policy_evaluated.spf)}
                        </div>
                      </div>
                    </div>

                    {/* Identifiers */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Identifiers</h4>
                      <p className="text-sm">
                        <span className="text-gray-500">Header From:</span>{' '}
                        <span className="font-mono text-xs">{record.identifiers.header_from}</span>
                      </p>
                    </div>

                    {/* Auth Results */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Authentication Results</h4>
                      <div className="space-y-2">
                        {record.auth_results.dkim && (
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">DKIM</span>
                              {getStatusBadge(record.auth_results.dkim.result)}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Domain: <span className="font-mono">{record.auth_results.dkim.domain}</span>
                              {record.auth_results.dkim.selector && (
                                <> | Selector: <span className="font-mono">{record.auth_results.dkim.selector}</span></>
                              )}
                            </p>
                          </div>
                        )}
                        {record.auth_results.spf && (
                          <div className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">SPF</span>
                              {getStatusBadge(record.auth_results.spf.result)}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Domain: <span className="font-mono">{record.auth_results.spf.domain}</span>
                              {record.auth_results.spf.scope && (
                                <> | Scope: {record.auth_results.spf.scope}</>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="raw">
            <Card>
              <CardHeader>
                <CardTitle>Raw Firestore Data</CardTitle>
                <CardDescription>Complete JSON representation of the report as stored in Firestore</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                  {JSON.stringify(report, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
