import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { governanceApiService } from '@/lib/governanceApiService';

export const SecurityLogsModule = () => {
  const { data: logs } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => governanceApiService.getAuditLog()
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Security Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
         <pre className="text-xs overflow-auto">
           {JSON.stringify(logs, null, 2)}
         </pre>
      </CardContent>
    </Card>
  );
};
