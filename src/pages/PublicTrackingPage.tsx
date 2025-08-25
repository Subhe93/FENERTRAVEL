import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Search, Truck, CheckCircle, Clock, MapPin, Calendar, Phone, User } from 'lucide-react';
import { toast } from 'sonner';
import { shipmentsAPI } from '@/lib/api';

const PublicTrackingPage = () => {
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundShipment, setFoundShipment] = useState(null);
  const { statuses } = useData();
  const { language, setLanguage } = useLanguage();

  const handleSearch = async () => {
    if (!shipmentNumber.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال رقم الشحنة' : 'Please enter shipment number');
      return;
    }

    setIsSearching(true);
    
    try {
      // استدعاء API الحقيقي لجلب معلومات الشحنة
      const response = await shipmentsAPI.trackShipment(shipmentNumber.trim());
      
      if (response.success && response.data?.shipment) {
        setFoundShipment(response.data.shipment);
        toast.success(language === 'ar' ? 'تم العثور على الشحنة' : 'Shipment found');
      } else {
        setFoundShipment(null);
        toast.error(language === 'ar' ? 'لم يتم العثور على الشحنة' : 'Shipment not found');
      }
    } catch (error) {
      console.error('Error tracking shipment:', error);
      setFoundShipment(null);
      toast.error(language === 'ar' ? 'حدث خطأ أثناء البحث عن الشحنة' : 'Error occurred while searching for shipment');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'في المستودع':
        return <Clock className="w-5 h-5" />;
      case 'في الطريق':
        return <Truck className="w-5 h-5" />;
      case 'تم التسليم':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.name === status);
    return statusObj?.color || '#6b7280';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">FENERTRAVEL</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {language === 'ar' ? 'EN' : 'العربية'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 flex-1">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'تتبع الشحنات' : 'Track Your Shipment'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {language === 'ar' 
              ? 'أدخل رقم الشحنة للحصول على آخر المعلومات حول حالة شحنتك ومكان وجودها'
              : 'Enter your shipment number to get the latest updates on your package status and location'
            }
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              {language === 'ar' ? 'البحث عن الشحنة' : 'Search for Shipment'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'أدخل رقم الشحنة المكون من 9 أرقام بدءاً بـ FEN'
                : 'Enter the 9-digit shipment number starting with FEN'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder={language === 'ar' ? 'مثال: FEN001001' : 'Example: FEN001001'}
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="px-8"
              >
                {isSearching ? (
                  language === 'ar' ? 'جاري البحث...' : 'Searching...'
                ) : (
                  <><Search className="w-4 h-4 mr-2" />{language === 'ar' ? 'بحث' : 'Search'}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {foundShipment && (
          <div className="space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {getStatusIcon(foundShipment.statusName || foundShipment.status?.name || foundShipment.status)}
                    {language === 'ar' ? 'حالة الشحنة' : 'Shipment Status'}
                  </CardTitle>
                  <Badge 
                    className="text-sm px-3 py-1"
                    style={{ 
                      backgroundColor: getStatusColor(foundShipment.statusName || foundShipment.status?.name || foundShipment.status) + '20',
                      color: getStatusColor(foundShipment.statusName || foundShipment.status?.name || foundShipment.status),
                      borderColor: getStatusColor(foundShipment.statusName || foundShipment.status?.name || foundShipment.status)
                    }}
                  >
                    {foundShipment.statusName || foundShipment.status?.name || foundShipment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">
                        {language === 'ar' ? 'الفرع' : 'Branch'}
                      </div>
                      <div className="font-medium">{foundShipment.branchName || foundShipment.branch?.name || 'غير محدد'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">
                        {language === 'ar' ? 'التسليم المتوقع' : 'Expected Delivery'}
                      </div>
                      <div className="font-medium">
                        {new Date(foundShipment.expectedDeliveryDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-500">
                        {language === 'ar' ? 'الوزن والصناديق' : 'Weight & Boxes'}
                      </div>
                      <div className="font-medium">
                        {foundShipment.weight} {language === 'ar' ? 'كغ' : 'kg'} • {foundShipment.numberOfBoxes} {language === 'ar' ? 'صندوق' : 'boxes'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipment Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {language === 'ar' ? 'بيانات المرسل' : 'Sender Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</div>
                    <div className="font-medium">{foundShipment.senderName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</div>
                    <div className="font-medium">{foundShipment.senderPhone}</div>
                  </div>
                  {foundShipment.senderAddress && (
                    <div>
                      <div className="text-sm text-gray-500">{language === 'ar' ? 'العنوان' : 'Address'}</div>
                      <div className="font-medium">{foundShipment.senderAddress}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {language === 'ar' ? 'بيانات المستلم' : 'Recipient Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'الاسم' : 'Name'}</div>
                    <div className="font-medium">{foundShipment.recipientName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</div>
                    <div className="font-medium">{foundShipment.recipientPhone}</div>
                  </div>
                  {foundShipment.recipientAddress && (
                    <div>
                      <div className="text-sm text-gray-500">{language === 'ar' ? 'العنوان' : 'Address'}</div>
                      <div className="font-medium">{foundShipment.recipientAddress}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'تفاصيل إضافية' : 'Additional Details'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'رقم الشحنة' : 'Shipment Number'}</div>
                    <div className="font-medium">{foundShipment.shipmentNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'من' : 'From'}</div>
                    <div className="font-medium">{foundShipment.originCountry?.name || foundShipment.originCountry}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'إلى' : 'To'}</div>
                    <div className="font-medium">{foundShipment.destinationCountry?.name || foundShipment.destinationCountry}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'المحتوى' : 'Content'}</div>
                    <div className="font-medium">{foundShipment.content || language === 'ar' ? 'غير محدد' : 'Not specified'}</div>
                  </div>
                </div>
                
                {foundShipment.notes && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'ملاحظات' : 'Notes'}</div>
                    <div className="font-medium">{foundShipment.notes}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {language === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {language === 'ar' 
                    ? 'إذا كان لديك أي استفسار حول شحنتك، يرجى التواصل معنا:'
                    : 'If you have any questions about your shipment, please contact us:'
                  }
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'الهاتف' : 'Phone'}</div>
                    <div className="font-medium">+966 11 123 4567</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</div>
                    <div className="font-medium">support@fenertravel.com</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-cen  ter text-sm text-gray-500">
            Powered by{' '}
            <a 
              href="https://iwings.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              iwings.io
            </a>
            {' '}&{' '}
            <a 
              href="https://nextyon.de" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Nextyon.de
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicTrackingPage;