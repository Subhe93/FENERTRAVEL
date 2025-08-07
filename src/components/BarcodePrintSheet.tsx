import React from 'react';
import Barcode from '@/components/ui/barcode';
import { type Shipment } from '@/lib/api-client';

interface BarcodePrintSheetProps {
  shipments: Shipment[];
  className?: string;
}

const BarcodePrintSheet: React.FC<BarcodePrintSheetProps> = ({
  shipments,
  className = ''
}) => {
  return (
    <div className={`print:shadow-none print:border-none bg-white ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6 print:mb-4">
          <h1 className="text-2xl font-bold text-blue-600">Fener Travel</h1>
          <p className="text-sm text-gray-600">ورقة باركودات الشحنات</p>
          <p className="text-xs text-gray-500">
            تاريخ الطباعة: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Barcode Grid */}
        <div className="grid grid-cols-3 gap-4 print:gap-2">
          {shipments.map((shipment) => (
            <div 
              key={shipment.id}
              className="border border-gray-300 p-3 print:p-2 rounded print:break-inside-avoid"
            >
              {/* Barcode */}
              <div className="text-center mb-2">
                <Barcode 
                  value={shipment.shipmentNumber}
                  height={60}
                  width={1.5}
                  fontSize={10}
                  margin={5}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>

              {/* Shipment Info */}
              <div className="text-xs text-center space-y-1">
                <div className="font-bold text-gray-900">
                  {shipment.shipmentNumber}
                </div>
                <div className="text-gray-600 truncate">
                  {shipment.recipientName}
                </div>
                <div className="text-gray-500 truncate">
                  {shipment.destinationCountryName || shipment.destinationCountry?.name}
                </div>
                <div className="text-gray-500">
                  {shipment.weight} كغ • {shipment.numberOfBoxes} صندوق
                </div>
                <div className="text-gray-400 text-xs">
                  {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 print:mt-4 text-center text-xs text-gray-500 border-t pt-4 print:pt-2">
          <p>Fener Travel - نظام إدارة الشحنات</p>
          <p>للاستفسارات: support@fenertravel.com | +966 11 123 4567</p>
        </div>
      </div>


    </div>
  );
};

export default BarcodePrintSheet; 