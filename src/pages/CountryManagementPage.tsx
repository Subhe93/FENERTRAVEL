import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Plus, Edit, Trash2, Flag, Search } from 'lucide-react';
import { toast } from 'sonner';
import { countriesAPI } from '@/lib/api';
import type { Country } from '@/lib/api-client';
import { FlagPicker } from '@/components/ui/flag-picker';
import { FileUpload } from '@/components/ui/file-upload';

const CountryManagementPage = () => {
  const { countries, refreshCountries } = useData();
  
  // Filter countries by type
  const originCountries = countries.filter(country => 
    country.type === 'ORIGIN' || country.type === 'BOTH'
  );
  
  const destinationCountries = countries.filter(country => 
    country.type === 'DESTINATION' || country.type === 'BOTH'
  );

  const [activeTab, setActiveTab] = useState('origin');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag: '',
    flagImage: '',
    type: 'BOTH'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      flag: '',
      flagImage: '',
      type: 'BOTH'
    });
  };

  const getCurrentCountries = () => {
    return activeTab === 'origin' ? originCountries : destinationCountries;
  };

  const filteredCountries = getCurrentCountries().filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!formData.name || !formData.code) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const countryExists = countries.some(country => 
      country.name === formData.name || country.code === formData.code
    );
    
    if (countryExists) {
      toast.error('اسم البلد أو الرمز موجود بالفعل');
      return;
    }

    try {
      const response = await countriesAPI.createCountry({
        name: formData.name,
        code: formData.code.toUpperCase(),
        flag: formData.flag || '🏳️',
        flagImage: formData.flagImage || '',
        type: formData.type
      });

      if (response.success) {
        toast.success('تم إضافة البلد بنجاح');
        await refreshCountries();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error(response.error || 'حدث خطأ في إضافة البلد');
      }
    } catch (error) {
      console.error('Failed to create country:', error);
      toast.error('حدث خطأ في إضافة البلد');
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name,
      code: country.code,
      flag: country.flag || '',
      flagImage: country.flagImage || '',
      type: country.type
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.code || !editingCountry) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const countryExists = countries.some(country => 
      (country.name === formData.name || country.code === formData.code) && 
      country.id !== editingCountry?.id
    );
    
    if (countryExists) {
      toast.error('اسم البلد أو الرمز موجود بالفعل');
      return;
    }

    try {
      const response = await countriesAPI.updateCountry(editingCountry.id, {
        name: formData.name,
        code: formData.code.toUpperCase(),
        flag: formData.flag || '🏳️',
        flagImage: formData.flagImage || '',
        type: formData.type
      });

      if (response.success) {
        toast.success('تم تحديث البلد بنجاح');
        await refreshCountries();
        setIsEditDialogOpen(false);
        setEditingCountry(null);
        resetForm();
      } else {
        toast.error(response.error || 'حدث خطأ في تحديث البلد');
      }
    } catch (error) {
      console.error('Failed to update country:', error);
      toast.error('حدث خطأ في تحديث البلد');
    }
  };

  const handleDelete = async (countryId: string) => {
    try {
      const response = await countriesAPI.deleteCountry(countryId);
      
      if (response.success) {
        toast.success('تم حذف البلد بنجاح');
        await refreshCountries();
      } else {
        toast.error(response.error || 'حدث خطأ في حذف البلد');
      }
    } catch (error) {
      console.error('Failed to delete country:', error);
      toast.error('حدث خطأ في حذف البلد');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      'ORIGIN': 'أصل',
      'DESTINATION': 'وجهة',
      'BOTH': 'أصل ووجهة'
    };
    return types[type] || type;
  };

  const CountryTable = ({ countries }: { countries: Country[] }) => (
    <Table >
      <TableHeader>
        <TableRow>
          <TableHead>العلم</TableHead>
          <TableHead>اسم البلد</TableHead>
          <TableHead>الرمز</TableHead>
          <TableHead>النوع</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>تاريخ الإضافة</TableHead>
          <TableHead>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {countries.map((country: Country) => (
          <TableRow key={country.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {country.flagImage ? (
                  <img 
                    src={country.flagImage} 
                    alt={country.name}
                    className="w-8 h-6 object-cover rounded"
                  />
                ) : (
                  <span className="text-2xl">{country.flag || '🏳️'}</span>
                )}
              </div>
            </TableCell>
            <TableCell className="font-medium">{country.name}</TableCell>
            <TableCell>
              <Badge variant="outline">{country.code}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{getTypeText(country.type)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={country.isActive ? "default" : "destructive"}>
                {country.isActive ? "نشط" : "غير نشط"}
              </Badge>
            </TableCell>
            <TableCell>
              {new Date(country.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(country)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف "{country.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(country.id)}>
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة البلدان</h1>
          <p className="text-gray-600">إدارة بلدان الأصل والوجهة للشحنات</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة بلد جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة بلد جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل البلد الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم البلد *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="مثال: السعودية"
                />
              </div>
              <div>
                <Label htmlFor="code">رمز البلد *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="مثال: SA"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="flag">العلم (اختياري)</Label>
                <FlagPicker
                  value={formData.flag}
                  onChange={(flag) => handleInputChange('flag', flag)}
                  placeholder="اختر علم البلد"
                />
              </div>
              <div>
                <Label htmlFor="flagImage">صورة العلم المخصصة (اختياري)</Label>
                <FileUpload
                  value={formData.flagImage}
                  onChange={(value) => handleInputChange('flagImage', value)}
                  accept="image/*"
                />
              </div>
              <div>
                <Label htmlFor="type">نوع البلد *</Label>
                <Select dir="rtl"
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ORIGIN">بلد أصل فقط</SelectItem>
                    <SelectItem value="DESTINATION">بلد وجهة فقط</SelectItem>
                    <SelectItem value="BOTH">بلد أصل ووجهة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAdd}>
                إضافة البلد
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            قائمة البلدان
          </CardTitle>
          <CardDescription>
            إدارة بلدان الأصل والوجهة المتاحة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs dir='rtl' value={activeTab} onValueChange={setActiveTab} className="space-y-4 ">
            <TabsList className="grid w-full grid-cols-2 gap-[10px]">
              <TabsTrigger
                value="origin"
                className={`flex items-center gap-2 bg-white text-gray-900`}
              >
                <Flag className="w-4 h-4" />
                بلدان الأصل ({originCountries.length})
              </TabsTrigger>
              <TabsTrigger
                value="destination"
                style={{ background:' #e5e7eb' }}
                className={`flex items-center gap-2 bg-gray-200 text-gray-900`}
              >
                <Globe className="w-4 h-4" />
                بلدان الوجهة ({destinationCountries.length})
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في البلدان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <TabsContent value="origin">
              <div className="border  rounded-lg overflow-hidden">
                <div className='flex flex-nowrap p-2 items-center gap-2'>
                <Flag className="w-4 h-4" />
                بلدان الأصل ({originCountries.length})</div>
               
                <CountryTable countries={filteredCountries} />
              </div>
            </TabsContent>

            <TabsContent value="destination">
              <div className="border bg-[#6b728010] rounded-lg overflow-hidden">
                     <div className='flex flex-nowrap p-2 items-center gap-2'>
                <Globe className="w-4 h-4" />
                بلدان الوجهة ({destinationCountries.length})</div>
                <CountryTable countries={filteredCountries} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل البلد</DialogTitle>
            <DialogDescription>
              تحديث تفاصيل البلد
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم البلد *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-code">رمز البلد *</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-flag">العلم (اختياري)</Label>
              <FlagPicker
                value={formData.flag}
                onChange={(flag) => handleInputChange('flag', flag)}
                placeholder="اختر علم البلد"
              />
            </div>
            <div>
              <Label htmlFor="edit-flagImage">صورة العلم المخصصة (اختياري)</Label>
              <FileUpload
                value={formData.flagImage}
                onChange={(value) => handleInputChange('flagImage', value)}
                accept="image/*"
              />
            </div>
            <div>
              <Label htmlFor="edit-type">نوع البلد *</Label>
              <Select dir='rtl'
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORIGIN">بلد أصل فقط</SelectItem>
                  <SelectItem value="DESTINATION">بلد وجهة فقط</SelectItem>
                  <SelectItem value="BOTH">بلد أصل ووجهة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate}>
              تحديث البلد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CountryManagementPage;