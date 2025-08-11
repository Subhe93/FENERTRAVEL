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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 lg:px-6 pt-4 lg:pt-6">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="px-4 lg:px-6 pb-4 lg:pb-6">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'إجمالي الشحنات',
      value: stats.total,
      icon: Package,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      valueColor: 'text-gray-900'
    },
    {
      title: 'في الطريق',
      value: stats.inTransit,
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      valueColor: 'text-orange-600'
    },
    {
      title: 'تم التسليم',
      value: stats.delivered,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      valueColor: 'text-green-600'
    },
    {
      title: 'في المستودع',
      value: stats.pending,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      valueColor: 'text-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card 
            key={index} 
            className={`${card.bgColor} shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 lg:px-6 pt-4 lg:pt-6">
              <CardTitle className="text-sm lg:text-base font-semibold">{card.title}</CardTitle>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent className="px-4 lg:px-6 pb-4 lg:pb-6">
              <div className={`text-2xl lg:text-3xl font-bold ${card.valueColor} `}>
                {card.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ShipmentsStats; 