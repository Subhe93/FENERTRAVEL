import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { DatePicker } from '@/components/ui/date-picker';
import { format } from "date-fns";
import { 
  Package, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Building2,
  Phone,
  Mail,
  Weight,
  Box,
  Globe,
  CreditCard,
  StickyNote,
  Flag
} from 'lucide-react';
import { toast } from 'sonner';

type PaymentMethod = 'CASH_ON_DELIVERY' | 'PREPAID' | 'CREDIT_CARD' | 'BANK_TRANSFER';

const AddShipmentPage = () => {
  const navigate = useNavigate();
  const { createShipment, branches, countries, statuses } = useData();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Filter countries by type
  const originCountries = countries.filter(country => 
    country.isActive && (country.type === 'ORIGIN' || country.type === 'BOTH')
  );
  
  const destinationCountries = countries.filter(country => 
    country.isActive && (country.type === 'DESTINATION' || country.type === 'BOTH')
  );

  // Filter active statuses and sort by order
  const activeStatuses = statuses.filter(status => status.isActive).sort((a, b) => a.order - b.order);

  const [formData, setFormData] = useState({
    branchId: user?.branchId || '',
    branchName: user?.branch?.name || '',
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
    paymentMethod: 'CASH_ON_DELIVERY' as PaymentMethod,
    receivingDate: format(new Date(), 'yyyy-MM-dd'),
    expectedDeliveryDate: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    notes: '',
    statusId: activeStatuses.length > 0 ? activeStatuses[0].id : ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      id: 1,
      title: 'تحديد الفرع',
      description: 'اختر الفرع المسؤول عن الشحنة',
      icon: Building2,
      fields: ['branchId']
    },
    {
      id: 2,
      title: 'بيانات المرسل',
      description: 'أدخل معلومات المرسل',
      icon: User,
      fields: ['senderName', 'senderPhone', 'senderAddress', 'senderEmail']
    },
    {
      id: 3,
      title: 'بيانات المستلم',
      description: 'أدخل معلومات المستلم',
      icon: MapPin,
      fields: ['recipientName', 'recipientPhone', 'recipientAddress', 'recipientEmail']
    },
    {
      id: 4,
      title: 'تفاصيل الشحنة',
      description: 'أدخل تفاصيل الشحنة والدفع',
      icon: Package,
      fields: ['weight', 'numberOfBoxes', 'originCountryId', 'destinationCountryId', 'content', 'paymentMethod', 'receivingDate', 'expectedDeliveryDate', 'statusId']
    },
    {
      id: 5,
      title: 'المراجعة والإرسال',
      description: 'راجع البيانات وأضف الملاحظات',
      icon: CheckCircle,
      fields: ['notes']
    }
  ];

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    setFormData(prev => ({
      ...prev,
      branchId,
      branchName: branch?.name || ''
    }));
    if (errors.branchId) {
      setErrors(prev => ({ ...prev, branchId: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    const currentStepData = steps[step - 1];

    currentStepData.fields.forEach(field => {
      if (field === 'branchId' && !formData.branchId) {
        newErrors.branchId = 'يرجى اختيار الفرع';
      }
      if (field === 'senderName' && !formData.senderName.trim()) {
        newErrors.senderName = 'يرجى إدخال اسم المرسل';
      }
      if (field === 'senderPhone' && !formData.senderPhone.trim()) {
        newErrors.senderPhone = 'يرجى إدخال هاتف المرسل';
      }
      if (field === 'recipientName' && !formData.recipientName.trim()) {
        newErrors.recipientName = 'يرجى إدخال اسم المستلم';
      }
      if (field === 'recipientPhone' && !formData.recipientPhone.trim()) {
        newErrors.recipientPhone = 'يرجى إدخال هاتف المستلم';
      }
      if (field === 'weight' && formData.weight <= 0) {
        newErrors.weight = 'يرجى إدخال وزن صحيح';
      }
        if (field === 'content' && !formData.content.trim()) {
        newErrors.content = 'يرجى إدخال محتوى الشحنة';
      }
      if (field === 'originCountryId' && !formData.originCountryId) {
        newErrors.originCountryId = 'يرجى اختيار بلد الأصل';
      }
      if (field === 'destinationCountryId' && !formData.destinationCountryId) {
        newErrors.destinationCountryId = 'يرجى اختيار بلد الوجهة';
      }
      if (field === 'statusId' && !formData.statusId) {
        newErrors.statusId = 'يرجى اختيار حالة الشحنة';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      try {
        // Remove branchName as it's not part of the Shipment type
        const { branchName, ...shipmentData } = formData;
        const success = await createShipment(shipmentData);
        if (success) {
          toast.success('تم إضافة الشحنة بنجاح');
          navigate('/');
        } else {
          toast.error('حدث خطأ في إضافة الشحنة');
        }
      } catch (error) {
        console.error('Error creating shipment:', error);
        toast.error('حدث خطأ في إضافة الشحنة');
      }
    }
  };

  // Helper functions to get display values
  const getOriginCountryName = () => {
    const country = countries.find(c => c.id === formData.originCountryId);
    return country ? `${country.flag || ''} ${country.name}` : '';
  };

  const getDestinationCountryName = () => {
    const country = countries.find(c => c.id === formData.destinationCountryId);
    return country ? `${country.flag || ''} ${country.name}` : '';
  };

  const getStatusName = () => {
    const status = statuses.find(s => s.id === formData.statusId);
    return status ? status.name : '';
  };

  const getPaymentMethodName = () => {
    const methods = {
      'CASH_ON_DELIVERY': 'نقداً عند التسليم',
      'PREPAID': 'مدفوع مسبقاً',
      'CREDIT_CARD': 'بطاقة ائتمان',
      'BANK_TRANSFER': 'تحويل بنكي'
    };
    return methods[formData.paymentMethod as keyof typeof methods] || formData.paymentMethod;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">تحديد الفرع</h3>
              <p className="text-gray-600">اختر الفرع المسؤول عن معالجة هذه الشحنة</p>
            </div>
            
            <div className="max-w-md mx-auto">
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
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <User className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">بيانات المرسل</h3>
              <p className="text-gray-600">أدخل معلومات الشخص الذي سيرسل الشحنة</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">بيانات المستلم</h3>
              <p className="text-gray-600">أدخل معلومات الشخص الذي سيستلم الشحنة</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
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
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Package className="w-16 h-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">تفاصيل الشحنة</h3>
              <p className="text-gray-600">أدخل تفاصيل الشحنة وطريقة الدفع</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
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
                <Label>المحتوى *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
            
                      className={`pl-10 ${errors.content ? 'border-red-500' : ''}`}
                    placeholder="مستندات، هدايا، إلخ"
                  />
                </div>
                {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
              </div>
              
              <div>
                <Label>بلد الأصل *</Label>
                <Select dir='rtl'
                  value={formData.originCountryId}
                  onValueChange={(value) => handleInputChange('originCountryId', value)}
                >
                  <SelectTrigger className={errors.originCountryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر بلد الأصل" />
                  </SelectTrigger>
                  <SelectContent>
                    {originCountries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.originCountryId && <p className="text-red-500 text-sm mt-1">{errors.originCountryId}</p>}
              </div>
              
              <div>
                <Label>بلد الوجهة *</Label>
                <Select dir='rtl'
                  value={formData.destinationCountryId}
                  onValueChange={(value) => handleInputChange('destinationCountryId', value)}
                >
                  <SelectTrigger className={errors.destinationCountryId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر بلد الوجهة" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinationCountries.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.destinationCountryId && <p className="text-red-500 text-sm mt-1">{errors.destinationCountryId}</p>}
              </div>

              <div>
                <Label>حالة الشحنة *</Label>
                <Select dir="rtl"
                  value={formData.statusId}
                  onValueChange={(value) => handleInputChange('statusId', value)}
                >
                  <SelectTrigger className={errors.statusId ? 'border-red-500' : ''}>
                    <SelectValue placeholder="اختر حالة الشحنة" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeStatuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span>{status.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.statusId && <p className="text-red-500 text-sm mt-1">{errors.statusId}</p>}
              </div>
              
              <div>
                <Label>طريقة الدفع</Label>
                <Select dir="rtl"
                  value={formData.paymentMethod}
                  onValueChange={(value) => handleInputChange('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                        بطاقة ائتمان
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
                <DatePicker
                  date={formData.receivingDate ? new Date(formData.receivingDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      handleInputChange('receivingDate', formattedDate);
                    } else {
                      handleInputChange('receivingDate', '');
                    }
                  }}
                  placeholder="اختر تاريخ الاستلام"
                />
              </div>
              
              <div>
                <Label>تاريخ التسليم المتوقع</Label>
                <DatePicker
                  date={formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      handleInputChange('expectedDeliveryDate', formattedDate);
                    } else {
                      handleInputChange('expectedDeliveryDate', '');
                    }
                  }}
                  placeholder="اختر تاريخ التسليم المتوقع"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">مراجعة البيانات</h3>
              <p className="text-gray-600">راجع جميع البيانات قبل إضافة الشحنة</p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      الفرع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{formData.branchName}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      المرسل
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{formData.senderName}</p>
                    <p className="text-sm text-gray-600">{formData.senderPhone}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      المستلم
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{formData.recipientName}</p>
                    <p className="text-sm text-gray-600">{formData.recipientPhone}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      الوزن والصناديق
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{formData.weight} كغ</p>
                    <p className="text-sm text-gray-600">{formData.numberOfBoxes} صندوق</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      الوجهة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">من: {getOriginCountryName()}</p>
                    <p className="text-sm text-gray-600">إلى: {getDestinationCountryName()}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flag className="w-4 h-4" />
                      الحالة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statuses.find(s => s.id === formData.statusId)?.color }}
                      />
                      <span className="font-medium">{getStatusName()}</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      الدفع
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{getPaymentMethodName()}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Notes */}
              <div>
                <Label>ملاحظات إضافية</Label>
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
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div dir='rtl' className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إضافة شحنة جديدة</h1>
          <p className="text-gray-600">اتبع الخطوات لإضافة شحنة جديدة بسهولة</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">الخطوة {currentStep} من {totalSteps}</span>
            <span className="text-sm text-gray-600 text-start">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress dir='rtl' value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 space-x-reverse">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isActive ? 'border-blue-600 bg-blue-600 text-white' : 
                      isCompleted ? 'border-green-600 bg-green-600 text-white' : 
                      'border-gray-300 bg-white text-gray-400'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`
                      w-12 h-0.5 mx-2 transition-colors
                      ${isCompleted ? 'bg-green-600' : 'bg-gray-300'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="p-8">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            إلغاء
          </Button>
          
          <div className="flex gap-4">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                إضافة الشحنة
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddShipmentPage;