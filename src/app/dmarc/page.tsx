'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { DmarcStatsView } from './stats-view';
import { DmarcReportsTable } from './reports-table';

export default function DmarcDashboard() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      const response = await fetch('/api/dmarc/config');
      if (response.ok) {
        const data = await response.json();
        setIsConfigured(data.isConfigured);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchReports = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/api/dmarc/fetch', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reports fetched successfully', {
          description: `Processed: ${data.stats.processed}, Skipped: ${data.stats.skipped}`,
        });
      } else {
        toast.error('Failed to fetch reports', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Error fetching reports', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsFetching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>DMARC Report Analyzer - Setup Required</CardTitle>
            <CardDescription>
              Gmail credentials must be configured via environment variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold mb-2">Configuration Required</h3>
              <p className="text-sm text-gray-700 mb-4">
                To use the DMARC Report Analyzer, you need to set the following environment variables:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-4">
                <li><code className="bg-gray-100 px-2 py-1 rounded">DMARC_GMAIL_EMAIL</code> - Your Gmail address</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">DMARC_GMAIL_APP_PASSWORD</code> - Gmail app password</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">DMARC_GMAIL_LABEL</code> - Gmail label (default: DMARC)</li>
              </ul>
              <p className="text-sm text-gray-700">
                Add these to your <code className="bg-gray-100 px-2 py-1 rounded">.env</code> file and restart the server.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2">Setup Instructions</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
                <li>Enable 2FA on your Google account</li>
                <li>Generate an app password at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Account Settings</a></li>
                <li>Create a Gmail label called "DMARC"</li>
                <li>Add the credentials to your .env file</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">DMARC Report Analyzer</h1>
          <p className="text-gray-600">
            Monitor and analyze DMARC email authentication reports
          </p>
        </div>
        <Button onClick={handleFetchReports} disabled={isFetching}>
          {isFetching ? 'Fetching...' : 'Fetch New Reports'}
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <DmarcStatsView />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <DmarcReportsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
