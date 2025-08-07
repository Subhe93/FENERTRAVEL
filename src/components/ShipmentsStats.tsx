import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { shipmentsAPI } from '@/lib/api';

interface StatsData {
  total: number;
  inTransit: number;
  delivered: number;
  pending: number;
}

const ShipmentsStats = () => {
  const { statuses } = useData();
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Get total count
        const totalResponse = await shipmentsAPI.getShipments({ limit: 1 });
        const total = totalResponse.success ? totalResponse.data?.pagination.total || 0 : 0;

        // Get status-specific counts
        const statusCounts = await Promise.all([
          // In transit
          shipmentsAPI.getShipments({ status: statuses.find(s => s.name === 'في الطريق')?.id, limit: 1 }),
          // Delivered
          shipmentsAPI.getShipments({ status: statuses.find(s => s.name === 'تم التسليم')?.id, limit: 1 }),
          // Pending
          shipmentsAPI.getShipments({ status: statuses.find(s => s.name === 'في المستودع')?.id, limit: 1 })
        ]);

        setStats({
          total,
          inTransit: statusCounts[0].success ? statusCounts[0].data?.pagination.total || 0 : 0,
          delivered: statusCounts[1].success ? statusCounts[1].data?.pagination.total || 0 : 0,
          pending: statusCounts[2].success ? statusCounts[2].data?.pagination.total || 0 : 0
        });
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
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 lg:px-6 pt-3 lg:pt-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="px-3 lg:px-6 pb-3 lg:pb-6">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 lg:px-6 pt-3 lg:pt-6">
          <CardTitle className="text-xs lg:text-sm font-medium">إجمالي الشحنات</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 lg:px-6 pb-3 lg:pb-6">
          <div className="text-xl lg:text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 lg:px-6 pt-3 lg:pt-6">
          <CardTitle className="text-xs lg:text-sm font-medium">في الطريق</CardTitle>
          <Truck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 lg:px-6 pb-3 lg:pb-6">
          <div className="text-xl lg:text-2xl font-bold text-orange-600">{stats.inTransit}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 lg:px-6 pt-3 lg:pt-6">
          <CardTitle className="text-xs lg:text-sm font-medium">تم التسليم</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 lg:px-6 pb-3 lg:pb-6">
          <div className="text-xl lg:text-2xl font-bold text-green-600">{stats.delivered}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 lg:px-6 pt-3 lg:pt-6">
          <CardTitle className="text-xs lg:text-sm font-medium">في المستودع</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="px-3 lg:px-6 pb-3 lg:pb-6">
          <div className="text-xl lg:text-2xl font-bold text-blue-600">{stats.pending}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentsStats; 