import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { ArrowLeft, Package, User, MapPin, Calendar, Phone, Mail, Weight, Box, FileText, Edit, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import ShipmentBarcode from '@/components/ShipmentBarcode';
import ShipmentStatusHistory from '@/components/ShipmentStatusHistory';

const ShipmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, statuses, updateShipmentStatus, getShipmentHistory } = useData();

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

  const handleStatusChange = async (newStatusId: string) => {
    try {
      const success = await updateShipmentStatus(shipment.id, newStatusId);
      if (success) {
        toast.success('تم تحديث حالة الشحنة بنجاح');
      } else {
        toast.error('فشل في تحديث حالة الشحنة');
      }
    } catch {
      toast.error('حدث خطأ أثناء تحديث حالة الشحنة');
    }
  };

  const getStatusColor = (statusId: string) => {
    const statusObj = statuses.find(s => s.id === statusId);
    return statusObj?.color || '#6b7280';
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

  const shipmentHistory = getShipmentHistory(shipment.id);

  // Get enriched data
  const currentStatus = statuses.find(s => s.id === shipment.statusId);
  const statusName = shipment.statusName || currentStatus?.name || 'غير محدد';
  const branchName = shipment.branchName || shipment.branch?.name || 'غير محدد';
  const originCountryName = shipment.originCountryName || shipment.originCountry?.name || 'غير محدد';
  const destinationCountryName = shipment.destinationCountryName || shipment.destinationCountry?.name || 'غير محدد';
  const createdByName = shipment.createdByName || shipment.createdBy?.name || 'غير معروف';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex md:flex-nowrap flex-wrap items-center justify-between">
        <div className="flex  items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تفاصيل الشحنة</h1>
            <p className="text-gray-600">{shipment.shipmentNumber}</p>
          </div>
        </div>
        
        <div className="flex md:flex-nowrap flex-wrap items-center gap-3">
          <Select dir="rtl"
            value={shipment.statusId}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[180px]">
              <Badge 
                variant="outline" 
                style={{ 
                  borderColor: getStatusColor(shipment.statusId),
                  color: getStatusColor(shipment.statusId)
                }}
              >
                {statusName}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status.id} value={status.id}>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: status.color,
                      color: status.color
                    }}
                  >
                    {status.name}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" asChild>
            <Link to={`/shipment/${shipment.id}/edit`} className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              تعديل
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to={`/invoice/${shipment.id}`} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              الفاتورة
            </Link>
          </Button>

          <Button variant="outline" size="sm" asChild>
            <Link to={`/waybill/${shipment.id}`} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              فاتورة الطريق
            </Link>
          </Button>
        </div>
      </div>

      {/* Barcode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            باركود الشحنة
          </CardTitle>
          <CardDescription>
            يمكن مسح هذا الباركود لتتبع الشحنة أو طباعته للصق على الطرد
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Simple Barcode for printing */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">باركود للطباعة</h4>
              <ShipmentBarcode 
                shipment={shipment} 
                variant="simple"
                className="print:break-inside-avoid"
              />
            </div>
            
            {/* Compact Barcode for labels */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">باركود مضغوط</h4>
              <ShipmentBarcode 
                shipment={shipment} 
                variant="compact"
              />
            </div>
          </div>
          
          {/* Print Button */}
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => window.print()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              طباعة الباركود
            </Button>
            <Button 
              onClick={() => {
                const canvas = document.querySelector('canvas');
                if (canvas) {
                  const link = document.createElement('a');
                  link.download = `barcode-${shipment.shipmentNumber}.png`;
                  link.href = canvas.toDataURL();
                  link.click();
                }
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              تحميل الباركود
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            معلومات الشحنة الأساسية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">رقم الشحنة</div>
                <div className="font-semibold">{shipment.shipmentNumber}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Weight className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">الوزن</div>
                <div className="font-semibold">{shipment.weight} كغ</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Box className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">عدد الصناديق</div>
                <div className="font-semibold">{shipment.numberOfBoxes}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-sm text-gray-500">الفرع</div>
                <div className="font-semibold">{branchName}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Status History */}
      <ShipmentStatusHistory
        history={shipmentHistory}
        getStatusColor={getStatusColor}
      />

      {/* Sender and Recipient Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              بيانات المرسل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">الاسم</div>
                <div className="font-medium">{shipment.senderName}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">الهاتف</div>
                <div className="font-medium">{shipment.senderPhone}</div>
              </div>
            </div>
            
            {shipment.senderAddress && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">العنوان</div>
                  <div className="font-medium">{shipment.senderAddress}</div>
                </div>
              </div>
            )}
            
            {shipment.senderEmail && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                  <div className="font-medium">{shipment.senderEmail}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              بيانات المستلم
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">الاسم</div>
                <div className="font-medium">{shipment.recipientName}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">الهاتف</div>
                <div className="font-medium">{shipment.recipientPhone}</div>
              </div>
            </div>
            
            {shipment.recipientAddress && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">العنوان</div>
                  <div className="font-medium">{shipment.recipientAddress}</div>
                </div>
              </div>
            )}
            
            {shipment.recipientEmail && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                  <div className="font-medium">{shipment.recipientEmail}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            تفاصيل الشحنة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500">بلد الأصل</div>
              <div className="font-medium">{originCountryName}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">بلد الوجهة</div>
              <div className="font-medium">{destinationCountryName}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">المحتوى</div>
              <div className="font-medium">{shipment.content || 'غير محدد'}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">طريقة الدفع</div>
              <div className="font-medium">{getPaymentMethodText(shipment.paymentMethod)}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">تاريخ الاستلام</div>
              <div className="font-medium">
                {new Date(shipment.receivingDate).toLocaleDateString()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">التسليم المتوقع</div>
              <div className="font-medium">
                {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
              </div>
            </div>

            {/* {shipment.shippingCost && (
              <div>
                <div className="text-sm text-gray-500">تكلفة الشحن</div>
                <div className="font-medium">{shipment.shippingCost} ريال</div>
              </div>
            )} */}

            {/* {shipment.paidAmount && (
              <div>
                <div className="text-sm text-gray-500">المبلغ المدفوع</div>
                <div className="font-medium">{shipment.paidAmount} ريال</div>
              </div>
            )} */}
{/* 
            <div>
              <div className="text-sm text-gray-500">حالة الدفع</div>
              <div className="font-medium">
                {shipment.paymentStatus === 'PAID' ? 'مدفوع' : 
                 shipment.paymentStatus === 'PENDING' ? 'في الانتظار' :
                 shipment.paymentStatus === 'PARTIAL' ? 'مدفوع جزئياً' :
                 shipment.paymentStatus === 'REFUNDED' ? 'مُسترد' : 'غير محدد'}
              </div>
            </div> */}
          </div>
          
          {shipment.notes && (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">ملاحظات</div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700">{shipment.notes}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            معلومات النظام
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-500">تم الإنشاء بواسطة</div>
              <div className="font-medium">{createdByName}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">تاريخ الإنشاء</div>
              <div className="font-medium">
                {new Date(shipment.createdAt).toLocaleDateString()} - {new Date(shipment.createdAt).toLocaleTimeString()}
              </div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500">آخر تحديث</div>
              <div className="font-medium">
                {new Date(shipment.updatedAt).toLocaleDateString()} - {new Date(shipment.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link 
              to="/tracking" 
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              <Package className="w-4 h-4" />
              عرض صفحة التتبع العامة
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShipmentDetailPage;