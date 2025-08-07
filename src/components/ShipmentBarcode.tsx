import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Barcode from '@/components/ui/barcode';
import { Package, MapPin, Weight, Box, Calendar } from 'lucide-react';
import { type Shipment } from '@/lib/api-client';

interface ShipmentBarcodeProps {
  shipment: Shipment;
  variant?: 'full' | 'simple' | 'compact';
  showDetails?: boolean;
  className?: string;
}

const ShipmentBarcode: React.FC<ShipmentBarcodeProps> = ({
  shipment,
  variant = 'full',
  showDetails = true,
  className = ''
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = () => {
    // يمكن تخصيص الألوان حسب حالة الشحنة
    return '#2563eb'; // أزرق افتراضي
  };

  if (variant === 'simple') {
    return (
      <div className={`text-center p-4 bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="mb-2">
          <span className="text-sm font-medium text-gray-600">رقم الشحنة</span>
        </div>
        <Barcode 
          value={shipment.shipmentNumber}
          height={60}
          fontSize={12}
          width={1.5}
        />
        <div className="mt-2 text-xs text-gray-500">
          Fener Travel Shipping
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-lg ${className}`}>
        <div className="flex-shrink-0">
          <Barcode 
            value={shipment.shipmentNumber}
            height={40}
            fontSize={10}
            width={1}
            margin={5}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900">
            {shipment.shipmentNumber}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {shipment.recipientName} - {shipment.destinationCountryName || shipment.destinationCountry?.name}
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              <span className="font-bold text-lg">FENER TRAVEL</span>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">نظام إدارة الشحنات</div>
              <div className="text-xs opacity-75">Shipping Management System</div>
            </div>
          </div>
        </div>

        {/* Barcode Section */}
        <div className="bg-white p-6 text-center border-b">
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              TRACKING NUMBER
            </span>
            <div className="text-xs text-gray-500 mb-2">رقم التتبع</div>
          </div>
          
          <Barcode 
            value={shipment.shipmentNumber}
            height={80}
            fontSize={14}
            width={2}
            margin={10}
          />
          
          <div className="mt-3 text-lg font-bold text-gray-900">
            {shipment.shipmentNumber}
          </div>
        </div>

        {/* Details Section */}
        {showDetails && (
          <div className="p-4 space-y-4">
            {/* Status and Branch */}
            <div className="flex items-center justify-between">
                             <Badge 
                 variant="outline"
                 className="text-xs"
                 style={{ 
                   borderColor: getStatusColor(),
                   color: getStatusColor()
                 }}
               >
                {shipment.statusName || shipment.status?.name || 'قيد المعالجة'}
              </Badge>
              <div className="text-right">
                <div className="text-xs text-gray-500">الفرع</div>
                <div className="text-sm font-medium">
                  {shipment.branchName || shipment.branch?.name}
                </div>
              </div>
            </div>

            {/* Route */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-xs text-gray-500">من</div>
                <div className="font-medium text-gray-900">
                  {shipment.originCountryName || shipment.originCountry?.name || 'غير محدد'}
                </div>
              </div>
              
              <div className="flex-1 mx-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">إلى</div>
                <div className="font-medium text-gray-900">
                  {shipment.destinationCountryName || shipment.destinationCountry?.name || 'غير محدد'}
                </div>
              </div>
            </div>

            {/* Shipment Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Weight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">الوزن:</span>
                <span className="font-medium">{shipment.weight} كغ</span>
              </div>
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">الصناديق:</span>
                <span className="font-medium">{shipment.numberOfBoxes}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">الاستلام:</span>
                <span className="font-medium">{formatDate(shipment.receivingDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">التسليم:</span>
                <span className="font-medium">{formatDate(shipment.expectedDeliveryDate)}</span>
              </div>
            </div>

            {/* Recipient Info */}
            <div className="border-t pt-3">
              <div className="text-xs text-gray-500 mb-1">معلومات المستلم</div>
              <div className="text-sm font-medium text-gray-900">{shipment.recipientName}</div>
              <div className="text-xs text-gray-600">{shipment.recipientPhone}</div>
              {shipment.recipientAddress && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {shipment.recipientAddress}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center border-t">
          <div className="text-xs text-gray-600">
            للاستفسارات: support@fenertravel.com | +966 11 123 4567
          </div>
          <div className="text-xs text-gray-500 mt-1">
            تاريخ الطباعة: {new Date().toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShipmentBarcode; 