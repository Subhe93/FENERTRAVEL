import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Package, 
  User, 
  MapPin, 
  FileText, 
  Save,
  Building2,
  Phone,
  Mail,
  Weight,
  Box,
  Globe,
  CreditCard,
  Calendar,
  StickyNote
} from 'lucide-react';
import { toast } from 'sonner';
const EditShipmentPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, updateShipment, branches, statuses, countries } = useData();
  const { user } = useAuth();

  const shipment = shipments.find(s => s.id === id);

  const [formData, setFormData] = useState({
    branchId: '',
    senderName: '',
    senderPhone: '',
    senderAddress: '',
    senderEmail: '',
    recipientName: '',
    recipientPhone: '',
    recipientAddress: '',
    recipientEmail: '',
    weight: 0,
    numberOfBoxes: 1,
    originCountryId: '',
    destinationCountryId: '',
    content: '',
    paymentMethod: '' as 'CASH_ON_DELIVERY' | 'PREPAID' | 'CREDIT_CARD' | 'BANK_TRANSFER' | '',
    receivingDate: '',
    expectedDeliveryDate: '',
    notes: '',
    statusId: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shipment) {
      setFormData({
        branchId: shipment.branchId,
        senderName: shipment.senderName,
        senderPhone: shipment.senderPhone,
        senderAddress: shipment.senderAddress || '',
        senderEmail: shipment.senderEmail || '',
        recipientName: shipment.recipientName,
        recipientPhone: shipment.recipientPhone,
        recipientAddress: shipment.recipientAddress || '',
        recipientEmail: shipment.recipientEmail || '',
        weight: shipment.weight,
        numberOfBoxes: shipment.numberOfBoxes,
        originCountryId: shipment.originCountryId,
        destinationCountryId: shipment.destinationCountryId,
        content: shipment.content,
        paymentMethod: shipment.paymentMethod,
        receivingDate: shipment.receivingDate.split('T')[0], // Convert to date format
        expectedDeliveryDate: shipment.expectedDeliveryDate.split('T')[0], // Convert to date format
        notes: shipment.notes || '',
        statusId: shipment.statusId
      });
    }
  }, [shipment]);

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({
      ...prev,
      branchId
    }));
    if (errors.branchId) {
      setErrors(prev => ({ ...prev, branchId: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.branchId) {
      newErrors.branchId = 'يرجى اختيار الفرع';
    }
    if (!formData.senderName.trim()) {
      newErrors.senderName = 'يرجى إدخال اسم المرسل';
    }
    if (!formData.senderPhone.trim()) {
      newErrors.senderPhone = 'يرجى إدخال هاتف المرسل';
    }
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'يرجى إدخال اسم المستلم';
    }
    if (!formData.recipientPhone.trim()) {
      newErrors.recipientPhone = 'يرجى إدخال هاتف المستلم';
    }
    if (formData.weight <= 0) {
      newErrors.weight = 'يرجى إدخال وزن صحيح';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const updateData = {
          ...formData,
          paymentMethod: formData.paymentMethod || undefined
        };
        const success = await updateShipment(shipment.id, updateData);
        if (success) {
          toast.success('تم تحديث الشحنة بنجاح');
          navigate(`/shipment/${shipment.id}`);
        } else {
          toast.error('فشل في تحديث الشحنة');
        }
      } catch {
        toast.error('حدث خطأ أثناء تحديث الشحنة');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/shipment/${shipment.id}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">تعديل الشحنة</h1>
            <p className="text-gray-600">{shipment.shipmentNumber}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              معلومات الفرع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>الفرع *</Label>
                <Select dir='rtl'
                  value={formData.branchId}
                  onValueChange={handleBranchChange}
                  disabled={user?.role === 'BRANCH'}
                >
                  <SelectTrigger className={errors.branchId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {branch.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.branchId && <p className="text-red-500 text-sm mt-1">{errors.branchId}</p>}
              </div>

              <div>
                <Label>الحالة</Label>
                <Select dir="rtl"
                  value={formData.statusId}
                  onValueChange={(value) => handleInputChange('statusId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: status.color,
                            color: status.color,
                            backgroundColor: status.color + '20'
                          }}
                        >
                          {status.name}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sender Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              بيانات المرسل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المرسل *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.senderName}
                    onChange={(e) => handleInputChange('senderName', e.target.value)}
                    className={`pl-10 ${errors.senderName ? 'border-red-500' : ''}`}
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                {errors.senderName && <p className="text-red-500 text-sm mt-1">{errors.senderName}</p>}
              </div>
              
              <div>
                <Label>هاتف المرسل *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.senderPhone}
                    onChange={(e) => handleInputChange('senderPhone', e.target.value)}
                    className={`pl-10 ${errors.senderPhone ? 'border-red-500' : ''}`}
                    placeholder="+966501234567"
                  />
                </div>
                {errors.senderPhone && <p className="text-red-500 text-sm mt-1">{errors.senderPhone}</p>}
              </div>
              
              <div>
                <Label>عنوان المرسل</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.senderAddress}
                    onChange={(e) => handleInputChange('senderAddress', e.target.value)}
                    className="pl-10"
                    placeholder="الرياض، حي النخيل"
                  />
                </div>
              </div>
              
              <div>
                <Label>بريد المرسل الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={formData.senderEmail}
                    onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                    className="pl-10"
                    placeholder="ahmed@example.com"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recipient Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              بيانات المستلم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المستلم *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    className={`pl-10 ${errors.recipientName ? 'border-red-500' : ''}`}
                    placeholder="مثال: سارة أحمد"
                  />
                </div>
                {errors.recipientName && <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>}
              </div>
              
              <div>
                <Label>هاتف المستلم *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.recipientPhone}
                    onChange={(e) => handleInputChange('recipientPhone', e.target.value)}
                    className={`pl-10 ${errors.recipientPhone ? 'border-red-500' : ''}`}
                    placeholder="+966509876543"
                  />
                </div>
                {errors.recipientPhone && <p className="text-red-500 text-sm mt-1">{errors.recipientPhone}</p>}
              </div>
              
              <div>
                <Label>عنوان المستلم</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.recipientAddress}
                    onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                    className="pl-10"
                    placeholder="جدة، حي البلد"
                  />
                </div>
              </div>
              
              <div>
                <Label>بريد المستلم الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                    className="pl-10"
                    placeholder="sara@example.com"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              تفاصيل الشحنة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>الوزن (كغ) *</Label>
                <div className="relative">
                  <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    className={`pl-10 ${errors.weight ? 'border-red-500' : ''}`}
                    placeholder="2.5"
                  />
                </div>
                {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight}</p>}
              </div>
              
              <div>
                <Label>عدد الصناديق *</Label>
                <div className="relative">
                  <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="number"
                    min="1"
                    value={formData.numberOfBoxes}
                    onChange={(e) => handleInputChange('numberOfBoxes', parseInt(e.target.value) || 1)}
                    className="pl-10"
                    placeholder="1"
                  />
                </div>
              </div>
              
              <div>
                <Label>المحتوى</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    className="pl-10"
                    placeholder="مستندات، هدايا، إلخ"
                  />
                </div>
              </div>
              
              <div>
                <Label>بلد الأصل</Label>
                <Select dir='rtl'
                  value={formData.originCountryId}
                  onValueChange={(value) => handleInputChange('originCountryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر بلد الأصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.filter(c => c.type === 'ORIGIN' || c.type === 'BOTH').map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {country.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>بلد الوجهة</Label>
                <Select dir="rtl"
                  value={formData.destinationCountryId}
                  onValueChange={(value) => handleInputChange('destinationCountryId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر بلد الوجهة" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.filter(c => c.type === 'DESTINATION' || c.type === 'BOTH').map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          {country.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>طريقة الدفع</Label>
                <Select dir='rtl'
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر طريقة الدفع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH_ON_DELIVERY">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        نقداً عند التسليم
                      </div>
                    </SelectItem>
                    <SelectItem value="PREPAID">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        مدفوع مسبقاً
                      </div>
                    </SelectItem>
                    <SelectItem value="CREDIT_CARD">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        بطاقة ائتمانية
                      </div>
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        تحويل بنكي
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>تاريخ الاستلام</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.receivingDate}
                    onChange={(e) => handleInputChange('receivingDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label>تاريخ التسليم المتوقع</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="w-5 h-5" />
              ملاحظات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="pl-10"
                placeholder="أي ملاحظات خاصة بالشحنة..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/shipment/${shipment.id}`)}
          >
            إلغاء
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            حفظ التغييرات
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditShipmentPage;