import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Package, 
  Printer,
  Download
} from 'lucide-react';
import Barcode from '@/components/ui/barcode';

const InvoicePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments } = useData();

  const shipment = shipments.find(s => s.id === id);

  if (!shipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الشحنة غير موجودة</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الشحنة المطلوبة</p>
          <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
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

        {/* Invoice */}
        <Card className="print:shadow-none print:border-none bg-white">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Fener Travel</h1>
              <p className="text-lg text-gray-700 mb-4">شركة فنر للسياحة والسفر والشحن أهلا وسهلاً بكم</p>
              
              <div className="text-right mb-6">
                <p className="text-xl font-semibold">
                  الى : {shipment.destinationCountryName || shipment.destinationCountry?.name || 'غير محدد'}
                </p>
              </div>
            </div>

            {/* Shipment Number and Barcode */}
            <div className="text-center mb-8">
              <div className="text-2xl font-bold text-gray-800 mb-4">{shipment.shipmentNumber}</div>
              <div className="text-sm text-gray-600 mb-2">باركود الشحنة</div>
              
              {/* Professional Barcode */}
              <div className="flex justify-center mb-4">
                <Barcode 
                  value={shipment.shipmentNumber}
                  height={70}
                  width={2}
                  fontSize={12}
                  margin={10}
                  background="#ffffff"
                  lineColor="#000000"
                />
              </div>
              
              <div className="text-xs text-gray-500">
                يمكن مسح هذا الباركود لتتبع الشحنة
              </div>
            </div>

            {/* Recipient Details */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4 text-right">تفاصيل المستلم:</h2>
              
              <div className="space-y-3 text-right">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.recipientName}</span>
                  <span className="text-gray-600">:اسم المستلم</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.recipientPhone}</span>
                  <span className="text-gray-600">:رقم الهاتف</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.recipientAddress || 'غير محدد'}</span>
                  <span className="text-gray-600">:العنوان-المدينة</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.weight} كغ</span>
                  <span className="text-gray-600">:الوزن</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.numberOfBoxes}</span>
                  <span className="text-gray-600">:عدد الصناديق</span>
                </div>
                
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{shipment.content || 'غير محدد'}</span>
                  <span className="text-gray-600">:المحتوى</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{getPaymentMethodText(shipment.paymentMethod)}</span>
                  <span className="text-gray-600">:طريقة الدفع</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">
                    {shipment.originCountryName || shipment.originCountry?.name || 'غير محدد'}
                  </span>
                  <span className="text-gray-600">:بلد الأصل</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">
                    {new Date(shipment.receivingDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-600">:تاريخ الاستلام</span>
                </div>

                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">
                    {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
                  </span>
                  <span className="text-gray-600">:التسليم المتوقع</span>
                </div>

                {shipment.notes && (
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold">{shipment.notes}</span>
                    <span className="text-gray-600">:ملاحظات</span>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Information */}
            <div className="mb-8 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 text-right">معلومات الفرع:</h3>
              <div className="text-right">
                <p className="font-semibold">{shipment.branchName || shipment.branch?.name || 'غير محدد'}</p>
                {shipment.branch?.location && (
                  <p className="text-gray-600">{shipment.branch.location}</p>
                )}
                {shipment.branch?.phone && (
                  <p className="text-gray-600">هاتف: {shipment.branch.phone}</p>
                )}
                {shipment.branch?.email && (
                  <p className="text-gray-600">بريد إلكتروني: {shipment.branch.email}</p>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="text-center my-8">
              <div className="border-t-2 border-dashed border-gray-400 w-full"></div>
              <div className="text-gray-600 text-sm mt-2">------------------</div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-600 mt-8">
              <p>شكراً لاختياركم Fener Travel</p>
              <p>للاستفسارات: support@fenertravel.com | +966 11 123 4567</p>
              <div className="mt-4 text-xs">
                <p>تاريخ الطباعة: {new Date().toLocaleDateString()}</p>
                <p>رقم الفاتورة: {shipment.shipmentNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePage;