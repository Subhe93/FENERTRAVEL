import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  Printer,
  Download,
  Loader2
} from 'lucide-react';
import Barcode from '@/components/ui/barcode';
import { toast } from 'sonner';
import { type Shipment } from '@/lib/api-client';

const WaybillPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, getShipmentById } = useData();

  // Local state for the shipment and loading
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load shipment data
  useEffect(() => {
    const loadShipment = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);

      try {
        // First, try to find in local shipments array
        const localShipment = shipments.find(s => s.id === id);
        if (localShipment) {
          setShipment(localShipment);
          setIsLoading(false);
          return;
        }

        // If not found locally, fetch from API
        const fetchedShipment = await getShipmentById(id);
        if (fetchedShipment) {
          setShipment(fetchedShipment);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading shipment:', error);
        setNotFound(true);
        toast.error('حدث خطأ أثناء تحميل بيانات الشحنة');
      } finally {
        setIsLoading(false);
      }
    };

    loadShipment();
  }, [id, getShipmentById]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل فاتورة الطريق...</h2>
          <p className="text-gray-600">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !shipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الشحنة غير موجودة</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الشحنة المطلوبة أو حدث خطأ أثناء التحميل</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setNotFound(false);
                setIsLoading(true);
                // Trigger reload by changing state
                const currentId = id;
                if (currentId) {
                  const loadShipment = async () => {
                    try {
                      const fetchedShipment = await getShipmentById(currentId);
                      if (fetchedShipment) {
                        setShipment(fetchedShipment);
                      } else {
                        setNotFound(true);
                      }
                    } catch (error) {
                      console.error('Error reloading shipment:', error);
                      setNotFound(true);
                      toast.error('فشل في إعادة تحميل البيانات');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  loadShipment();
                }
              }}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Convert to PDF logic would go here
    console.log('Download PDF');
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'CASH_ON_DELIVERY':
        return 'نقداً عند التسليم';
      case 'PREPAID':
        return 'مدفوع مسبقاً';
      case 'CREDIT_CARD':
        return 'بطاقة ائتمانية';
      case 'BANK_TRANSFER':
        return 'تحويل بنكي';
      default:
        return method;
    }
  };

  const WaybillCopy = ({ copyType }: { copyType: string }) => (
    <div className="mb-8 border-2 border-dashed border-gray-400 p-6 bg-white">
      {/* Header with Barcode */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-2xl font-bold">{shipment.shipmentNumber}</div>
          <div className="mt-2">
            <Barcode 
              value={shipment.shipmentNumber}
              height={50}
              width={1.5}
              fontSize={10}
              margin={5}
              background="#ffffff"
              lineColor="#000000"
            />
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{copyType}</div>
          <div className="text-sm text-gray-600">Fener Travel</div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Date and Location Info */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="font-semibold">تاريخ الاستلام: </span>
          {new Date(shipment.receivingDate).toLocaleDateString()}
        </div>
        <div>
          <span className="font-semibold">وقت الوصول: </span>
          ___________
        </div>
        <div>
          <span className="font-semibold">تاريخ التسليم: </span>
          {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="font-semibold">بلد الأصل: </span>
          {shipment.originCountryName || shipment.originCountry?.name || 'غير محدد'}
        </div>
        <div>
          <span className="font-semibold">بلد الوجهة: </span>
          {shipment.destinationCountryName || shipment.destinationCountry?.name || 'غير محدد'}
        </div>
        <div>
          <span className="font-semibold">الناقل: </span>
          ___________
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="font-semibold">الفرع: </span>
          {shipment.branchName || shipment.branch?.name || 'غير محدد'}
        </div>
        <div>
          <span className="font-semibold">رقم مرجع الناقل: </span>
          ___________
        </div>
        <div>
          <span className="font-semibold">وقت المغادرة: </span>
          ___________
        </div>
      </div>

      {/* Sender and Recipient */}
      <div className="grid grid-cols-2 gap-8 mb-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">{shipment.senderName}</span>
            <span>اسم المرسل</span>
          </div>
          {/* <div className="text-sm">{shipment.senderPhone}</div>
          <div className="text-sm">{shipment.senderAddress || 'غير محدد'}</div>
          {shipment.senderEmail && (
            <div className="text-sm text-gray-600">{shipment.senderEmail}</div>
          )} */}
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold">{shipment.recipientName}</span>
            <span>المرسل اليه</span>
          </div>
          {/* <div className="text-sm">{shipment.recipientPhone}</div>
          <div className="text-sm">{shipment.recipientAddress || 'غير محدد'}</div>
          {shipment.recipientEmail && (
            <div className="text-sm text-gray-600">{shipment.recipientEmail}</div>
          )}
          <div className="text-sm font-semibold mt-2">
            الحالة: {shipment.statusName || shipment.status?.name || 'غير محدد'}
          </div> */}
        </div>
      </div>

      {/* Comments and Shipping Type */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="font-semibold">تعليق: </span>
          {shipment.notes || '___________'}
        </div>
        <div>
          <span className="font-semibold">نوع الشحن: </span>
          عادي
        </div>
      </div>

      {/* Package Details */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="font-semibold">عدد الصناديق: </span>
          {shipment.numberOfBoxes}
        </div>
        <div>
          <span className="font-semibold">المحتوى: </span>
          {shipment.content || 'غير محدد'}
        </div>
        <div>
          <span className="font-semibold">الوزن: </span>
          {shipment.weight} كغ
        </div>
      </div>

      {/* Payment and Status */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-semibold">اجمالي الشحن: </span>
          {shipment.shippingCost ? `${shipment.shippingCost} ريال` : '___________'}
        </div>
        <div>
          <span className="font-semibold">المبلغ المدفوع: </span>
          {shipment.paidAmount ? `${shipment.paidAmount} ريال` : '___________'}
        </div>
        <div>
          <span className="font-semibold">طريقة الدفع: </span>
          {getPaymentMethodText(shipment.paymentMethod)}
        </div>
        <div>
          <span className="font-semibold">حالة الدفع: </span>
          {shipment.paymentStatus === 'PAID' ? 'مدفوع' : 
           shipment.paymentStatus === 'PENDING' ? 'في الانتظار' :
           shipment.paymentStatus === 'PARTIAL' ? 'مدفوع جزئياً' :
           shipment.paymentStatus === 'REFUNDED' ? 'مُسترد' : 'غير محدد'}
        </div>
      </div>

      {/* Delivery confirmation section */}
      <div className="mt-6 border-t pt-4">
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div>
            <div className="mb-2">
              <span className="font-semibold">توقيع المستلم: </span>
              <span className="inline-block w-32 border-b border-black ml-2"></span>
            </div>
            <div>
              <span className="font-semibold">التاريخ: </span>
              <span className="inline-block w-24 border-b border-black ml-2"></span>
            </div>
          </div>
          <div>
            <div className="mb-2">
              <span className="font-semibold">توقيع المندوب: </span>
              <span className="inline-block w-32 border-b border-black ml-2"></span>
            </div>
            <div>
              <span className="font-semibold">الوقت: </span>
              <span className="inline-block w-24 border-b border-black ml-2"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-600 mt-4 border-t pt-2">
        <p>Fener Travel - نظام إدارة الشحنات</p>
        <p>للاستفسارات: info@fenertravel.de | 004915254116010</p>
        <div className="mt-1 text-gray-500">
          <span>رقم التتبع: {shipment.shipmentNumber}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              طباعة
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              تحميل PDF
            </Button>
          </div>
        </div>

        {/* Page Title */}
        <div className="text-center mb-6 print:hidden">
          <h1 className="text-2xl font-bold text-gray-900">فاتورة الطريق - {shipment.shipmentNumber}</h1>
          <p className="text-gray-600">نسخ متعددة للمرسل والمستلم والحسابات</p>
        </div>

        {/* Waybill */}
        <div className="print:shadow-none print:border-none">
          {/* Three copies */}
          <WaybillCopy copyType="نسخة الحسابات" />
          <WaybillCopy copyType="نسخة المرسل إليه" />
          <WaybillCopy copyType="نسخة المرسل" />
        </div>
      </div>
    </div>
  );
};

export default WaybillPage;