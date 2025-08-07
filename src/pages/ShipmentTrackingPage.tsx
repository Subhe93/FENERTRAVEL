import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ShipmentStatusHistory from '@/components/ShipmentStatusHistory';
import { 
  Package, 
  Search, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  Phone, 
  User,
  Mail,
  Weight,
  Box,
  Globe,
  CreditCard,
  FileText,
  Building2,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { type Shipment, type ShipmentHistory } from '@/lib/api-client';

const ShipmentTrackingPage = () => {
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundShipment, setFoundShipment] = useState<Shipment | null>(null);
  const { getShipmentByNumber, statuses, getShipmentHistory } = useData();
  const { language, setLanguage } = useLanguage();

  const handleSearch = async () => {
    if (!shipmentNumber.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال رقم الشحنة' : 'Please enter shipment number');
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const shipment = getShipmentByNumber(shipmentNumber.trim());
      if (shipment) {
        setFoundShipment(shipment);
        toast.success(language === 'ar' ? 'تم العثور على الشحنة' : 'Shipment found');
      } else {
        setFoundShipment(null);
        toast.error(language === 'ar' ? 'لم يتم العثور على الشحنة' : 'Shipment not found');
      }
      setIsSearching(false);
    }, 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'في المستودع':
        return <Clock className="w-6 h-6" />;
      case 'في الطريق':
        return <Truck className="w-6 h-6" />;
      case 'تم التسليم':
        return <CheckCircle className="w-6 h-6" />;
      default:
        return <Package className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.name === status);
    return statusObj?.color || '#6b7280';
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'في المستودع':
        return 25;
      case 'في الطريق':
        return 75;
      case 'تم التسليم':
        return 100;
      default:
        return 0;
    }
  };

  const shipmentHistory: ShipmentHistory[] = foundShipment ? getShipmentHistory(foundShipment.id) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  FENERTRAVEL
                </span>
                <p className="text-sm text-gray-600">نظام تتبع الشحنات المتطور</p>
              </div>
            </div>
            
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600"
            >
              {language === 'ar' ? 'EN' : 'العربية'}
            </Button> */}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            تتبع فوري ودقيق
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            تتبع شحنتك
            <span className="block text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text">
              في الوقت الفعلي
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            أدخل رقم الشحنة للحصول على آخر المعلومات حول حالة شحنتك ومكان وجودها مع تتبع مفصل لجميع التحديثات
          </p>

          {/* Features */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-gray-600">
              <Shield className="w-5 h-5 text-green-500" />
              <span>آمن ومحمي</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Target className="w-5 h-5 text-blue-500" />
              <span>تتبع دقيق</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>خدمة متميزة</span>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <Card className="mb-12 shadow-xl border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              البحث عن الشحنة
            </CardTitle>
            <CardDescription className="text-lg">
              أدخل رقم الشحنة المكون من 9 أرقام بدءاً بـ FEN
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="مثال: FEN001001"
                  value={shipmentNumber}
                  onChange={(e) => setShipmentNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 pr-4 h-14 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="w-full mt-4 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    بحث عن الشحنة
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {foundShipment && (
          <div className="space-y-8">
            {/* Status Overview */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                      {getStatusIcon(foundShipment.statusName || foundShipment.status?.name || '')}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">حالة الشحنة</h2>
                      <p className="text-blue-100">رقم الشحنة: {foundShipment.shipmentNumber}</p>
                    </div>
                  </div>
                  <Badge 
                    className="text-lg px-4 py-2 bg-white/20 border-white/30 text-white"
                  >
                    {foundShipment.statusName || foundShipment.status?.name}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>تقدم الشحنة</span>
                    <span>{getStatusProgress(foundShipment.statusName || foundShipment.status?.name || '')}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div 
                      className="bg-white rounded-full h-3 transition-all duration-500"
                      style={{ width: `${getStatusProgress(foundShipment.statusName || foundShipment.status?.name || '')}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">الفرع المسؤول</div>
                      <div className="font-semibold text-gray-900">{foundShipment.branchName || foundShipment.branch?.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">التسليم المتوقع</div>
                      <div className="font-semibold text-gray-900">
                        {new Date(foundShipment.expectedDeliveryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">الوزن والصناديق</div>
                      <div className="font-semibold text-gray-900">
                        {foundShipment.weight} كغ • {foundShipment.numberOfBoxes} صندوق
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Journey */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </div>
                  رحلة الشحنة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <Globe className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="font-semibold text-gray-900">{foundShipment.originCountryName || foundShipment.originCountry?.name}</div>
                    <div className="text-sm text-gray-500">نقطة الانطلاق</div>
                  </div>
                  
                  <div className="flex-1 mx-8">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-dashed border-blue-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                      <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="font-semibold text-gray-900">{foundShipment.destinationCountryName || foundShipment.destinationCountry?.name}</div>
                    <div className="text-sm text-gray-500">الوجهة النهائية</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Status History */}
            <div className="shadow-xl border-0 bg-white/70 backdrop-blur-sm rounded-lg">
              <ShipmentStatusHistory
                history={shipmentHistory}
                getStatusColor={(statusId) => getStatusColor(statuses.find(s => s.id === statusId)?.name || '')}
                showCard={true}
              />
            </div>

            {/* Shipment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    بيانات المرسل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">الاسم</div>
                      <div className="font-semibold">{foundShipment.senderName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">الهاتف</div>
                      <div className="font-semibold">{foundShipment.senderPhone}</div>
                    </div>
                  </div>
                  {foundShipment.senderAddress && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">العنوان</div>
                        <div className="font-semibold">{foundShipment.senderAddress}</div>
                      </div>
                    </div>
                  )}
                  {foundShipment.senderEmail && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                        <div className="font-semibold">{foundShipment.senderEmail}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    بيانات المستلم
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">الاسم</div>
                      <div className="font-semibold">{foundShipment.recipientName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">الهاتف</div>
                      <div className="font-semibold">{foundShipment.recipientPhone}</div>
                    </div>
                  </div>
                  {foundShipment.recipientAddress && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">العنوان</div>
                        <div className="font-semibold">{foundShipment.recipientAddress}</div>
                      </div>
                    </div>
                  )}
                  {foundShipment.recipientEmail && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-500" />
                      <div>
                        <div className="text-sm text-gray-500">البريد الإلكتروني</div>
                        <div className="font-semibold">{foundShipment.recipientEmail}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Details */}
            <Card className="shadow-xl border-0 bg-white/70 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  تفاصيل إضافية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-sm text-gray-500">رقم الشحنة</div>
                    <div className="font-semibold text-gray-900">{foundShipment.shipmentNumber}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Weight className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-sm text-gray-500">الوزن</div>
                    <div className="font-semibold text-gray-900">{foundShipment.weight} كغ</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Box className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="text-sm text-gray-500">عدد الصناديق</div>
                    <div className="font-semibold text-gray-900">{foundShipment.numberOfBoxes}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-sm text-gray-500">طريقة الدفع</div>
                    <div className="font-semibold text-gray-900">{foundShipment.paymentMethod}</div>
                  </div>
                </div>
                
                {foundShipment.content && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-2">محتوى الشحنة</div>
                    <div className="font-semibold text-gray-900">{foundShipment.content}</div>
                  </div>
                )}
                
                {foundShipment.notes && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-2">ملاحظات خاصة</div>
                    <div className="font-semibold text-gray-900">{foundShipment.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-white">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  تحتاج مساعدة؟
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 mb-6 text-lg">
                  فريق خدمة العملاء متاح على مدار الساعة لمساعدتك
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-blue-100">اتصل بنا</div>
                      <div className="font-semibold text-white text-lg">+966 11 123 4567</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-white/10 rounded-xl">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-blue-100">راسلنا</div>
                      <div className="font-semibold text-white text-lg">support@fenertravel.com</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentTrackingPage;