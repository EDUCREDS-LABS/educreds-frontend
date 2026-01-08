import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuthHeaders } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsData {
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  certificatesByType: { type: string; count: number }[];
}

const AnalyticsPage = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/stats', { headers: getAuthHeaders() });
        setStats(response.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-4">Loading analytics...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!stats) {
    return <div className="p-4">No analytics data available.</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold">Institution Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{stats.totalCertificates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-green-600">{stats.activeCertificates}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revoked Certificates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-red-600">{stats.revokedCertificates}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificates by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={stats.certificatesByType}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* TODO: Add more charts and reports */}
    </div>
  );
};

export default AnalyticsPage;
