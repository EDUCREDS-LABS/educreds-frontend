import { useQuery } from '@tanstack/react-query';

function useMockData(endpoint: string) {
  return useQuery([
    'mockData',
    endpoint,
  ], async () => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch real data, using mock data');
      }
      return response.json();
    } catch {
      // Replace with actual mock data or load from local JSON
      return { mockKey: 'mockValue' };
    }
  });
}

export default useMockData;