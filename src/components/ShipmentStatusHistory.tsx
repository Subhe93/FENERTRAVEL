import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, User, History } from 'lucide-react';
import { type ShipmentHistory } from '@/lib/api-client';

interface ShipmentStatusHistoryProps {
  history: ShipmentHistory[];
  getStatusColor?: (statusId: string) => string;
  className?: string;
  showCard?: boolean;
}

const ShipmentStatusHistory: React.FC<ShipmentStatusHistoryProps> = ({
  history,
  getStatusColor = () => '#6b7280',
  className = '',
  showCard = true
}) => {
  // Filter only status-related changes
  const statusHistory = history.filter(h => 
    h.action === 'تحديث الحالة' || 
    h.action === 'STATUS_UPDATE' || 
    h.field === 'status' || 
    h.field === 'statusId' ||
    h.action?.toLowerCase().includes('status') ||
    h.action?.includes('حالة')
  );

  const HistoryContent = () => (
    <div className="space-y-4">
      {statusHistory.length > 0 ? (
        statusHistory.map((historyItem, index) => (
          <div key={historyItem.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ 
                  backgroundColor: getStatusColor(historyItem.statusId || '') + '20',
                  border: `2px solid ${getStatusColor(historyItem.statusId || '')}`
                }}
              >
                <Activity className="w-5 h-5" style={{ color: getStatusColor(historyItem.statusId || '') }} />
              </div>
              {index < statusHistory.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 mt-2" />
              )}
            </div>
            
            <div className="flex-1 min-w-0 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-gray-900">تحديث الحالة</h4>
                  <Badge 
                    variant="outline"
                    style={{ 
                      backgroundColor: getStatusColor(historyItem.statusId || '') + '20',
                      color: getStatusColor(historyItem.statusId || ''),
                      borderColor: getStatusColor(historyItem.statusId || '')
                    }}
                  >
                    {historyItem.status?.name || historyItem.newValue || 'غير محدد'}
                  </Badge>
                </div>
              </div>
              
              {/* Status change details */}
              {/* {historyItem.oldValue && historyItem.newValue && historyItem.oldValue !== historyItem.newValue && (
                <div className="mb-3 p-3 bg-white rounded border border-gray-200">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-gray-600">من:</span>
                      <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-200">
                        {historyItem.oldValue}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">إلى:</span>
                      <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-200">
                        {historyItem.newValue}
                      </span>
                    </div>
                  </div>
                </div>
              )} */}
              
              {/* Notes if available */}
              {historyItem.notes && (
                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="text-sm text-blue-800">
                    <span className="font-medium">ملاحظة:</span> {historyItem.notes}
                  </div>
                </div>
              )}
              
              {/* User and timestamp info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                {/* <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">
                      {historyItem.userName || historyItem.user?.name || 'غير معروف'}
                    </span>
                  </div>
                  {historyItem.user?.role && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {historyItem.user.role === 'MANAGER' ? 'مدير' : 
                       historyItem.user.role === 'BRANCH' ? 'موظف فرع' : 
                       historyItem.user.role}
                    </span>
                  )}
                </div> */}
                
                <div className="flex items-center gap-1 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(historyItem.timestamp).toLocaleDateString( {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="mx-1">•</span>
                  <span>
                    {new Date(historyItem.timestamp).toLocaleTimeString( { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">لا يوجد تحديثات للحالة</p>
          <p className="text-sm text-gray-400 mt-1">سيتم عرض التحديثات هنا عند تغيير حالة الشحنة</p>
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return (
      <div className={className}>
        <HistoryContent />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          سجل تحديثات الحالة
        </CardTitle>
        <CardDescription>
          جميع تغييرات حالة الشحنة مع تفاصيل المستخدم والوقت
        </CardDescription>
      </CardHeader>
      <CardContent>
        <HistoryContent />
      </CardContent>
    </Card>
  );
};

export default ShipmentStatusHistory; 