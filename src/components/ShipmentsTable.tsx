import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useShipments, type ShipmentsFilters } from '@/hooks/use-shipments';
import { useToast } from '@/hooks/use-toast';
import { type Shipment } from '@/lib/api-client';

import {
  FileText,
  Route,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Calendar,
  Package,
  User,
  Phone,
  MapPin,
  Weight,
  Box,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  X,
  Mail,
  CreditCard,
  Globe,
  FileCheck,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE_OPTIONS = [5,10, 25, 50, 100];

// Helper function to get payment method display text
const getPaymentMethodText = (method: string) => {
  switch (method) {
    case 'CASH_ON_DELIVERY':
      return 'نقداً عند الاستلام';
    case 'PREPAID':
      return 'مدفوع مسبقاً';
    case 'CREDIT_CARD':
      return 'بطاقة ائتمان';
    case 'BANK_TRANSFER':
      return 'تحويل بنكي';
    default:
      return method;
  }
};

const ShipmentsTable = () => {
  const { statuses, branches, countries, updateShipmentStatus } = useData();
  const { toast } = useToast();
  const {
    shipments,
    pagination,
    isLoading,
    filters,
    sorting,
    setFilters,
    setSorting,
    setPage,
    setLimit,
    clearFilters,
    refresh
  } = useShipments(25);

  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    isOpen: boolean;
    shipmentId: string;
    shipmentNumber: string;
    currentStatus: string;
    newStatus: string;
  }>({
    isOpen: false,
    shipmentId: '',
    shipmentNumber: '',
    currentStatus: '',
    newStatus: ''
  });

  // Get unique payment methods from current shipments
  const uniquePaymentMethods = [...new Set(shipments.map(s => s.paymentMethod).filter(Boolean))];
  const uniqueContents = [...new Set(shipments.map(s => s.content).filter(Boolean))];

  const handleSort = (key: keyof Shipment) => {
    const newDirection = sorting.sortBy === key && sorting.sortOrder === 'asc' ? 'desc' : 'asc';
    setSorting({
      sortBy: key,
      sortOrder: newDirection
    });
  };

  const getSortIcon = (key: keyof Shipment) => {
    if (sorting.sortBy !== key) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sorting.sortOrder === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />;
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedShipments(shipments.map(s => s.id));
    } else {
      setSelectedShipments([]);
    }
  };

  const handleSelectShipment = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
    }
  };

  const handleStatusChangeRequest = (shipmentId: string, newStatus: string) => {
    const shipment = shipments.find(s => s.id === shipmentId);
    if (!shipment) return;
    const currentStatusName = typeof shipment.status === 'object' ? shipment.status?.name : shipment.status;
    const newStatusObj = statuses.find(s => s.id === newStatus);
    
    setStatusUpdateDialog({
      isOpen: true,
      shipmentId,
      shipmentNumber: shipment.shipmentNumber,
      currentStatus: currentStatusName || '',
      newStatus: newStatusObj?.name || '',
      newStatusId: newStatus || ''
    });
  };

  const confirmStatusChange = async () => {

    try {
      const success = await updateShipmentStatus(statusUpdateDialog.shipmentId, statusUpdateDialog.newStatusId); 
      
      if (success) {
        toast({
          title: "تم تحديث الحالة بنجاح",
          description: `تم تغيير حالة الشحنة ${statusUpdateDialog.shipmentNumber} إلى "${statusUpdateDialog.newStatus}"`,
          variant: "default",
        });
        
        // Refresh the table data
        await refresh();
      } else {
        toast({
          title: "فشل في تحديث الحالة",
          description: "حدث خطأ أثناء تحديث حالة الشحنة",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setStatusUpdateDialog({
        isOpen: false,
        shipmentId: '',
        shipmentNumber: '',
        currentStatus: '',
        newStatus: ''
      });
    }
  };

  const clearAllFilters = () => {
    clearFilters();
    setSelectedShipments([]);
  };

  const updateFilter = (key: keyof ShipmentsFilters, value: string) => {
    setFilters({ [key]: value === '' ? undefined : value });
  };

  const exportToExcel = () => {
    const selectedShipmentData = selectedShipments.length > 0 
      ? shipments.filter(s => selectedShipments.includes(s.id))
      : shipments;
    
    const totalWeight = selectedShipmentData.reduce((sum, s) => sum + s.weight, 0);
    const totalBoxes = selectedShipmentData.reduce((sum, s) => sum + s.numberOfBoxes, 0);

    const exportData = selectedShipmentData.map(shipment => ({
      'رقم الشحنة': shipment.shipmentNumber,
      'المرسل': shipment.senderName,
      'هاتف المرسل': shipment.senderPhone,
      'عنوان المرسل': shipment.senderAddress,
      'بريد المرسل': shipment.senderEmail,
      'المستلم': shipment.recipientName,
      'هاتف المستلم': shipment.recipientPhone,
      'عنوان المستلم': shipment.recipientAddress,
      'بريد المستلم': shipment.recipientEmail,
      'الوزن': shipment.weight,
      'عدد الصناديق': shipment.numberOfBoxes,
      'بلد الأصل': typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry,
      'بلد الوجهة': typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry,
      'المحتوى': shipment.content,
      'طريقة الدفع': getPaymentMethodText(shipment.paymentMethod),
      'الفرع': typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName,
      'الحالة': typeof shipment.status === 'object' ? shipment.status?.name : shipment.status,
      'تاريخ الاستلام': shipment.receivingDate,
      'التسليم المتوقع': shipment.expectedDeliveryDate,
      'تاريخ الإنشاء': new Date(shipment.createdAt).toLocaleDateString(),
      'الملاحظات': shipment.notes
    }));

    // Add summary row
    exportData.push({
      'رقم الشحنة': 'المجموع',
      'المرسل': '',
      'هاتف المرسل': '',
      'عنوان المرسل': '',
      'بريد المرسل': '',
      'المستلم': '',
      'هاتف المستلم': '',
      'عنوان المستلم': '',
      'بريد المستلم': '',
      'الوزن': totalWeight,
      'عدد الصناديق': totalBoxes,
      'بلد الأصل': '',
      'بلد الوجهة': '',
      'المحتوى': '',
      'طريقة الدفع': '',
      'الفرع': '',
      'الحالة': '',
      'تاريخ الاستلام': '',
      'التسليم المتوقع': '',
      'تاريخ الإنشاء': '',
      'الملاحظات': ''
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الشحنات');
    XLSX.writeFile(wb, `shipments_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.name === status);
    return statusObj?.color || '#6b7280';
  };

  const goToPage = (page: number) => {
    setPage(Math.max(1, Math.min(page, pagination.pages)));
  };

  return (
    <div className="space-y-6">
      {/* Status Update Confirmation Dialog */}
      <AlertDialog open={statusUpdateDialog.isOpen} onOpenChange={(open) => 
        setStatusUpdateDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تحديث الحالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تغيير حالة الشحنة رقم <strong>{statusUpdateDialog.shipmentNumber}</strong>؟
              <br />
              <br />
              <span>الحالة الحالية: <strong>{statusUpdateDialog.currentStatus}</strong></span>
              <br />
              <span>الحالة الجديدة: <strong>{statusUpdateDialog.newStatus}</strong></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>
              تأكيد التحديث
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header Actions */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث العام في الشحنات..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            الفلاتر المتقدمة
          </Button>
          
          <Button
            onClick={exportToExcel}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            تصدير ({selectedShipments.length > 0 ? selectedShipments.length : shipments.length})
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">الفلاتر المتقدمة</CardTitle>
              <Button
                variant="outline"
                className='bg-white border-red-500'
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
              >
                <X className="w-4 h-4 text-red-500 " />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Shipment Number Filter */}
              <div>
                <label className="text-sm font-medium">رقم الشحنة</label>
                <Input
                  placeholder="FEN001001"
                  value={filters.shipmentNumber || ''}
                  onChange={(e) => updateFilter('shipmentNumber', e.target.value)}
                />
              </div>

              {/* Sender Name Filter */}
              <div>
                <label className="text-sm font-medium">اسم المرسل</label>
                <Input
                  placeholder="أحمد محمد"
                  value={filters.senderName || ''}
                  onChange={(e) => updateFilter('senderName', e.target.value)}
                />
              </div>

              {/* Sender Phone Filter */}
              <div>
                <label className="text-sm font-medium">هاتف المرسل</label>
                <Input
                  placeholder="+966501234567"
                  value={filters.senderPhone || ''}
                  onChange={(e) => updateFilter('senderPhone', e.target.value)}
                />
              </div>

              {/* Recipient Name Filter */}
              <div>
                <label className="text-sm font-medium">اسم المستلم</label>
                <Input
                  placeholder="سارة أحمد"
                  value={filters.recipientName || ''}
                  onChange={(e) => updateFilter('recipientName', e.target.value)}
                />
              </div>

              {/* Recipient Phone Filter */}
              <div>
                <label className="text-sm font-medium">هاتف المستلم</label>
                <Input
                  placeholder="+966509876543"
                  value={filters.recipientPhone || ''}
                  onChange={(e) => updateFilter('recipientPhone', e.target.value)}
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <label className="text-sm font-medium">طريقة الدفع</label>
                <Select value={filters.paymentMethod || 'all'} onValueChange={(value) => updateFilter('paymentMethod', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الطرق" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطرق</SelectItem>
                    {uniquePaymentMethods.map(method => (
                      <SelectItem key={method} value={method}>
                        {getPaymentMethodText(method)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content Filter */}
              <div>
                <label className="text-sm font-medium">المحتوى</label>
                <Select value={filters.content || 'all'} onValueChange={(value) => updateFilter('content', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المحتويات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المحتويات</SelectItem>
                    {uniqueContents.map(content => (
                      <SelectItem key={content} value={content}>
                        {content}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm font-medium">الحالة</label>
                <Select value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الحالات" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {statuses.map(status => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch Filter */}
              <div>
                <label className="text-sm font-medium">الفرع</label>
                <Select value={filters.branch || 'all'} onValueChange={(value) => updateFilter('branch', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع الفروع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفروع</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Origin Country Filter */}
              <div>
                <label className="text-sm font-medium">بلد الأصل</label>
                <Select value={filters.originCountry || 'all'} onValueChange={(value) => updateFilter('originCountry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع البلدان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع البلدان</SelectItem>
                    {countries?.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Destination Country Filter */}
              <div>
                <label className="text-sm font-medium">بلد الوجهة</label>
                <Select value={filters.destinationCountry || 'all'} onValueChange={(value) => updateFilter('destinationCountry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع البلدان" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع البلدان</SelectItem>
                    {countries?.map(country => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From Filter */}
              <div>
                <label className="text-sm font-medium">من تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>

              {/* Date To Filter */}
              <div>
                <label className="text-sm font-medium">إلى تاريخ</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>

              {/* Weight From Filter */}
              <div>
                <label className="text-sm font-medium">الوزن من (كغ)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={filters.weightFrom || ''}
                  onChange={(e) => updateFilter('weightFrom', e.target.value)}
                />
              </div>

              {/* Weight To Filter */}
              <div>
                <label className="text-sm font-medium">الوزن إلى (كغ)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="100"
                  value={filters.weightTo || ''}
                  onChange={(e) => updateFilter('weightTo', e.target.value)}
                />
              </div>

              {/* Boxes From Filter */}
              <div>
                <label className="text-sm font-medium">الصناديق من</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={filters.boxesFrom || ''}
                  onChange={(e) => updateFilter('boxesFrom', e.target.value)}
                />
              </div>

              {/* Boxes To Filter */}
              <div>
                <label className="text-sm font-medium">الصناديق إلى</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="10"
                  value={filters.boxesTo || ''}
                  onChange={(e) => updateFilter('boxesTo', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={clearAllFilters}>
                مسح جميع الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
        <div>
          عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total} شحنة
        </div>
        <div className="flex items-center gap-2">
          <span>عرض</span>
          <Select value={pagination.limit.toString()} onValueChange={(value) => {
            setLimit(parseInt(value));
            setPage(1);
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>عنصر</span>
        </div>
      </div>

      {/* Complete Shipments Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12 sticky left-0 bg-gray-50 z-10">
                  <Checkbox
                    className="p-2"
                    checked={selectedShipments.length === shipments.length && shipments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-100 min-w-[140px] sticky left-12 bg-gray-50 z-10"
                  onClick={() => handleSort('shipmentNumber')}
                >
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4" />
                    رقم الشحنة
                    {getSortIcon('shipmentNumber')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[200px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('senderName')}
                >
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    بيانات المرسل
                    {getSortIcon('senderName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[200px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('recipientName')}
                >
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    بيانات المستلم
                    {getSortIcon('recipientName')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('weight')}
                >
                  <div className="flex items-center gap-1">
                    <Weight className="w-4 h-4" />
                    الوزن والصناديق
                    {getSortIcon('weight')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[150px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('originCountry')}
                >
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    الأصل والوجهة
                    {getSortIcon('originCountry')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('content')}
                >
                  <div className="flex items-center gap-1">
                    <FileCheck className="w-4 h-4" />
                    المحتوى
                    {getSortIcon('content')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[140px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('paymentMethod')}
                >
                  <div className="flex items-center gap-1">
                    <CreditCard className="w-4 h-4" />
                    طريقة الدفع
                    {getSortIcon('paymentMethod')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[120px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('branchId')}
                >
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    الفرع
                    {getSortIcon('branchId')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[130px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    الحالة
                    {getSortIcon('status')}
                  </div>
                </TableHead>
                <TableHead 
                  className="min-w-[160px] cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    التواريخ
                    {getSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead className="min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    الملاحظات
                  </div>
                </TableHead>
                <TableHead className="min-w-[150px] sticky right-0 bg-gray-50 z-10">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-500 mt-2">جاري تحميل البيانات...</p>
                  </TableCell>
                </TableRow>
              ) : shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-gray-50">
                    <TableCell className="sticky left-0 bg-white z-10">
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => handleSelectShipment(shipment.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-blue-600 sticky left-12 bg-white z-10">
                      <Link to={`/shipment/${shipment.id}`} className="hover:underline">
                        {shipment.shipmentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {shipment.senderName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {shipment.senderPhone}
                        </div>
                        {shipment.senderAddress && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shipment.senderAddress.length > 30 
                              ? shipment.senderAddress.substring(0, 30) + '...'
                              : shipment.senderAddress
                            }
                          </div>
                        )}
                        {shipment.senderEmail && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {shipment.senderEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {shipment.recipientName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {shipment.recipientPhone}
                        </div>
                        {shipment.recipientAddress && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {shipment.recipientAddress.length > 30 
                              ? shipment.recipientAddress.substring(0, 30) + '...'
                              : shipment.recipientAddress
                            }
                          </div>
                        )}
                        {shipment.recipientEmail && (
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {shipment.recipientEmail}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Weight className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{shipment.weight} كغ</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Box className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{shipment.numberOfBoxes} صندوق</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-500">من:</span> {typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry}
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">إلى:</span> {typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{shipment.content || 'غير محدد'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentMethodText(shipment.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={typeof shipment.status === 'object' ? shipment.status?.id || '' : shipment.status || ''}
                        onValueChange={(value) => handleStatusChangeRequest(shipment.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <Badge 
                            variant="outline" 
                            style={{ 
                              borderColor: getStatusColor(typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || ''),
                              color: getStatusColor(typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || ''),
                              backgroundColor: getStatusColor(typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || '') + '20'
                            }}
                          >
                            {typeof shipment.status === 'object' ? shipment.status?.name : shipment.status}
                          </Badge>
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
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-xs">
                        <div>
                          <span className="text-gray-500">الإنشاء:</span><br />
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500">الاستلام:</span><br />
                          {new Date(shipment.receivingDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-gray-500">التسليم المتوقع:</span><br />
                          {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px]">
                        {shipment.notes ? (
                          <p className="text-xs text-gray-600 truncate" title={shipment.notes}>
                            {shipment.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">لا توجد ملاحظات</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white z-10">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/shipment/${shipment.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/invoice/${shipment.id}`}>
                            <FileText className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/waybill/${shipment.id}`}>
                            <Route className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-gray-400" />
                      <p className="text-gray-500">لا توجد شحنات مطابقة للبحث</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            صفحة {pagination.page} من {pagination.pages}
          </div>
          
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            
            {/* Page Numbers */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (pagination.page <= 3) {
                pageNum = i + 1;
              } else if (pagination.page >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = pagination.page - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.pages)}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentsTable;