import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';

export const InfrastructureManagement = () => {
  const { data: status } = useQuery({
    queryKey: ['blockchain-status'],
    queryFn: () => governanceApiService.getBlockchainStatus()
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Infrastructure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => governanceApiService.bulkRegisterInstitutions()}>Bulk Register</Button>
            <Button variant="outline">Bootstrap IIN</Button>
          </div>
          <div className="mt-4">
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
