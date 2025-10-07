'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface DmarcConfigFormProps {
  onSuccess?: () => void;
}

export function DmarcConfigForm({ onSuccess }: DmarcConfigFormProps) {
  const [email, setEmail] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [label, setLabel] = useState('DMARC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/dmarc/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          appPassword,
          label,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Configuration saved successfully');
        onSuccess?.();
      } else {
        toast.error('Failed to save configuration', {
          description: data.error,
        });
      }
    } catch (error) {
      toast.error('Error saving configuration', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Gmail Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your-email@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500">
          The Gmail account that receives DMARC reports
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="appPassword">App Password</Label>
        <Input
          id="appPassword"
          type="password"
          placeholder="xxxx xxxx xxxx xxxx"
          value={appPassword}
          onChange={(e) => setAppPassword(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500">
          Generate an app password from your Google account settings
          <br />
          <a
            href="https://support.google.com/accounts/answer/185833"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Learn how to create an app password
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Gmail Label</Label>
        <Input
          id="label"
          type="text"
          placeholder="DMARC"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <p className="text-sm text-gray-500">
          The Gmail label/folder containing DMARC reports
        </p>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Saving...' : 'Save Configuration'}
      </Button>
    </form>
  );
}
