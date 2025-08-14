import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { shipmentsAPI } from '@/lib/api';

interface StatsData {
  total: number;
}

interface StatusCount {
  id: string;
  name: string;
  color: string;
  count: number;
}

const ShipmentsStats = () => {
  const { statuses } = useData();
  const [stats, setStats] = useState<StatsData>({
    total: 0,
  });
  const [statusCards, setStatusCards] = useState<StatusCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total count
        const totalResponse = await shipmentsAPI.getShipments({ limit: 1 });
        const total = totalResponse.success ? totalResponse.data?.pagination.total || 0 : 0;

        // Build a request per status to compute counts dynamically
        const results = await Promise.all(
          statuses.map(async (status) => {
            try {
              const res = await shipmentsAPI.getShipments({ status: status.id, limit: 1 });
              const count = res.success ? res.data?.pagination.total || 0 : 0;
              return { id: status.id, name: status.name, color: status.color, count } as StatusCount;
            } catch {
              return { id: status.id, name: status.name, color: status.color, count: 0 } as StatusCount;
            }
          })
        );

        setStats({ total });
        setStatusCards(results);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (statuses.length > 0) {
      fetchStats();
    }
  }, [statuses]);

  if (isLoading) {
    const skeletonCount = Math.max(4, (statuses?.length || 0) + 1);
    return (
      <div className="space-y-2 text-right" >
        <div className="flex justify-start">
          <Button variant="outline" size="sm" onClick={() => setShowStats(prev => !prev)}>
            عرض احصائيات
          </Button>
        </div>
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
            {[...Array(skeletonCount)].map((_, i) => (
              <Card key={i} className="shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 lg:px-6 pt-4 lg:pt-6">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="px-2 lg:px-6 pb-4 lg:pb-6">
                  <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-right" >
      <div className="flex justify-start">
        <Button variant="outline" size="sm" onClick={() => setShowStats(prev => !prev)}>
          عرض احصائيات
        </Button>
      </div>
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-2">
          {/* Total card */}
          <Card 
            className={`shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
            style={{ backgroundColor: '#f9fafb' }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 lg:px-6 pt-4 lg:pt-6">
              <CardTitle className="text-sm lg:text-base font-semibold">إجمالي الشحنات</CardTitle>
              <Package className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent className="px-2 lg:px-6 pb-4 lg:pb-6">
              <div className={`text-2xl lg:text-2xl font-bold text-gray-900`}>
                {stats.total.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          {/* One card per status */}
          {statusCards.map((status) => (
            <Card 
              key={status.id}
              className={`shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
              style={{ backgroundColor: `${status.color}20` }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-2 lg:px-6 pt-2 lg:pt-6">
                <CardTitle className="text-sm lg:text-base font-semibold" style={{ color: status.color }}>{status.name}</CardTitle>
                <Package className="h-5 w-5" style={{ color: status.color }} />
              </CardHeader>
              <CardContent className="px-2 lg:px-6 pb-2 lg:pb-6">
                <div className={`text-xl lg:text-2xl font-bold`} style={{ color: status.color }}>
                  {status.count.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShipmentsStats; 