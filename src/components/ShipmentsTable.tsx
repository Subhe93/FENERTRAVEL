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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { shipmentsAPI } from '@/lib/api';

import {
  FileText,
  Route,
  Eye,
  Printer,
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
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ExcelJS from 'exceljs';
import { ResetIcon } from '@radix-ui/react-icons';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { format } from "date-fns";

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

type ColumnDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  minWidth?: string;
  sortKey: string;
};

const COLUMNS: ColumnDef[] = [
  { id: 'shipmentNumber', label: 'رقم الشحنة', icon: <Package className="w-4 h-4" />, minWidth: '140px', sortKey: 'shipmentNumber' },
  { id: 'sender', label: 'بيانات المرسل', icon: <User className="w-4 h-4" />, minWidth: '200px', sortKey: 'senderName' },
  { id: 'recipient', label: 'بيانات المستلم', icon: <User className="w-4 h-4" />, minWidth: '200px', sortKey: 'recipientName' },
  { id: 'weight', label: 'الوزن والصناديق', icon: <Weight className="w-4 h-4" />, minWidth: '120px', sortKey: 'weight' },
  { id: 'countries', label: 'الأصل والوجهة', icon: <Globe className="w-4 h-4" />, minWidth: '150px', sortKey: 'originCountry' },
  { id: 'content', label: 'المحتوى', icon: <FileCheck className="w-4 h-4" />, minWidth: '120px', sortKey: 'content' },
  { id: 'paymentMethod', label: 'طريقة الدفع', icon: <CreditCard className="w-4 h-4" />, minWidth: '140px', sortKey: 'paymentMethod' },
  { id: 'branch', label: 'الفرع', icon: <MapPin className="w-4 h-4" />, minWidth: '120px', sortKey: 'branchId' },
  { id: 'status', label: 'الحالة', icon: <Clock className="w-4 h-4" />, minWidth: '130px', sortKey: 'status' },
  { id: 'dates', label: 'التواريخ', icon: <Calendar className="w-4 h-4" />, minWidth: '160px', sortKey: 'receivingDate' },
  { id: 'notes', label: 'الملاحظات', icon: <FileText className="w-4 h-4" />, minWidth: '200px', sortKey: 'notes' },
];

const STORAGE_KEY = 'shipmentsTableVisibleColumns';

const getStoredColumns = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsedColumns = JSON.parse(stored);
      // تأكد من أن القيمة المخزنة صالحة
      if (Array.isArray(parsedColumns) && parsedColumns.length > 0) {
        // تأكد من أن جميع الأعمدة المخزنة موجودة في COLUMNS
        const validColumns = parsedColumns.filter(col => COLUMNS.some(c => c.id === col));
        if (validColumns.length > 0) {
          return validColumns;
        }
      }
    }
  } catch (error) {
    console.error('Error reading stored columns:', error);
  }
  // إذا لم يتم العثور على قيمة مخزنة أو كانت غير صالحة، استخدم جميع الأعمدة
  return COLUMNS.map(col => col.id);
};

const ShipmentsTable = () => {
  const { statuses, branches, countries, updateShipmentStatus, bulkUpdateShipmentStatus, deleteShipment } = useData();
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
    newStatusId: string;
  }>({
    isOpen: false,
    shipmentId: '',
    shipmentNumber: '',
    currentStatus: '',
    newStatus: '',
    newStatusId: ''
  });
  const [bulkStatusUpdateDialog, setBulkStatusUpdateDialog] = useState<{
    isOpen: boolean;
    selectedCount: number;
    newStatusId: string;
    newStatusName: string;
  }>({
    isOpen: false,
    selectedCount: 0,
    newStatusId: '',
    newStatusName: ''
  });
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    shipmentId: '',
    shipmentNumber: ''
  });
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getStoredColumns());
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isExportingFiltered, setIsExportingFiltered] = useState(false);

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

  // إضافة وظيفة إلغاء الفرز
  const clearSorting = () => {
    setSorting({
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
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
        newStatus: '',
        newStatusId: ''
      });
    }
  };

  const handleBulkStatusChangeRequest = (newStatusId: string) => {
    const selectedStatus = statuses.find(s => s.id === newStatusId);
    if (!selectedStatus || selectedShipments.length === 0) return;
    
    setBulkStatusUpdateDialog({
      isOpen: true,
      selectedCount: selectedShipments.length,
      newStatusId,
      newStatusName: selectedStatus.name
    });
  };

  const confirmBulkStatusChange = async () => {
    try {
      const result = await bulkUpdateShipmentStatus(
        selectedShipments, 
        bulkStatusUpdateDialog.newStatusId
      );
      
      if (result.success && result.results) {
        const { successCount, errorCount } = result.results;
        
        if (errorCount === 0) {
          toast({
            title: "تم تحديث الحالات بنجاح",
            description: `تم تغيير حالة ${successCount} شحنة إلى "${bulkStatusUpdateDialog.newStatusName}"`,
            variant: "default",
          });
        } else {
          toast({
            title: "تم تحديث الحالات جزئياً",
            description: `تم تحديث ${successCount} شحنة بنجاح، فشل في تحديث ${errorCount} شحنة`,
            variant: "default",
          });
        }
        
        // Clear selection and refresh
        setSelectedShipments([]);
        await refresh();
      } else {
        toast({
          title: "فشل في تحديث الحالات",
          description: result.message || "حدث خطأ أثناء تحديث حالات الشحنات",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to bulk update shipment status:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setBulkStatusUpdateDialog({
        isOpen: false,
        selectedCount: 0,
        newStatusId: '',
        newStatusName: ''
      });
    }
  };

  const handleDeleteRequest = (shipmentId: string, shipmentNumber: string) => {
    setDeleteDialog({
      isOpen: true,
      shipmentId,
      shipmentNumber
    });
  };

  const confirmDelete = async () => {
    try {
      // Implement the delete logic here, e.g., call an API to delete the shipment
      await deleteShipment(deleteDialog.shipmentId);
      toast({
        title: "تم حذف الشحنة بنجاح",
        description: `تم حذف الشحنة رقم ${deleteDialog.shipmentNumber}`,
        variant: "default",
      });
      // Refresh the table data
      await refresh();
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      toast({
        title: "فشل في حذف الشحنة",
        description: "حدث خطأ أثناء حذف الشحنة",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({
        isOpen: false,
        shipmentId: '',
        shipmentNumber: ''
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

  const exportToExcel = async () => {
    const selectedShipmentData = selectedShipments.length > 0
      ? shipments.filter(s => selectedShipments.includes(s.id))
      : shipments;

    const totalWeight = selectedShipmentData.reduce((sum, s) => sum + Number(s.weight || 0), 0);
    const totalBoxes = selectedShipmentData.reduce((sum, s) => sum + Number(s.numberOfBoxes || 0), 0);

    const header = [
      'رقم الشحنة', 'المرسل', 'هاتف المرسل', 'عنوان المرسل',
      'المستلم', 'هاتف المستلم', 'عنوان المستلم', 'الوزن',
      'عدد الصناديق', 'بلد الأصل', 'بلد الوجهة', 'المحتوى',
      'طريقة الدفع', 'الفرع', 'الحالة', 'تاريخ الاستلام',
      'التسليم المتوقع', 'الملاحظات'
    ];

    // إنشاء مصنف Excel جديد
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الشحنات');

    // إضافة صف الملخص
    const summaryRow = worksheet.addRow([
      'المجموع', '', '', '', '', '', '',
      Number(totalWeight.toFixed(2)), totalBoxes,
      '', '', '', '', '', '', '', '', ''
    ]);

    // إضافة صف فارغ
    worksheet.addRow([]);

    // إضافة العناوين
    const headerRow = worksheet.addRow(header);

    // إضافة البيانات
    selectedShipmentData.forEach(shipment => {
      worksheet.addRow([
        shipment.shipmentNumber,
        shipment.senderName,
        shipment.senderPhone,
        shipment.senderAddress,
        shipment.recipientName,
        shipment.recipientPhone,
        shipment.recipientAddress,
        Number(shipment.weight),
        shipment.numberOfBoxes,
        typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry,
        typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry,
        shipment.content,
        getPaymentMethodText(shipment.paymentMethod),
        typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName,
        typeof shipment.status === 'object' ? shipment.status?.name : shipment.status,
        shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : '',
        shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : '',
        shipment.notes
      ]);
    });

    // تطبيق التنسيق على صف الملخص
    summaryRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF00' } // أصفر
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF000000' } },
        bottom: { style: 'medium', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // تطبيق التنسيق على صف العناوين
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0000FF' } // أزرق
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // تطبيق التنسيق على جميع الخلايا حتى الفارغة منها
    const totalRows = worksheet.rowCount;
    const totalCols = header.length;
    
    for (let rowNum = 1; rowNum <= totalRows; rowNum++) {
      for (let colNum = 1; colNum <= totalCols; colNum++) {
        const cell = worksheet.getCell(rowNum, colNum);
        
        if (rowNum === 1) {
          // تنسيق صف الملخص
          cell.font = { bold: true, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // أصفر
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        } else if (rowNum === 3) {
          // تنسيق صف العناوين
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0000FF' } // أزرق
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        } else if (rowNum > 3) {
          // تنسيق خلايا البيانات
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF0F8FF' } // أزرق فاتح
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        }
      }
    }

    // تحديد عرض الأعمدة بناءً على المحتوى الفعلي
    const columnWidths = header.map((_, colIndex) => {
      let maxLength = 0;
      
      // حساب طول العنوان
      maxLength = Math.max(maxLength, header[colIndex]?.length || 0);
      
      // حساب طول صف الملخص
      const summaryValue = colIndex === 0 ? 'المجموع' : 
                          colIndex === 7 ? Number(totalWeight.toFixed(2)).toString() :
                          colIndex === 8 ? totalBoxes.toString() : '';
      maxLength = Math.max(maxLength, summaryValue.length);
      
      // حساب طول البيانات
      selectedShipmentData.forEach(shipment => {
        let cellValue = '';
        switch (colIndex) {
          case 0: cellValue = shipment.shipmentNumber || ''; break;
          case 1: cellValue = shipment.senderName || ''; break;
          case 2: cellValue = shipment.senderPhone || ''; break;
          case 3: cellValue = shipment.senderAddress || ''; break;
          case 4: cellValue = shipment.recipientName || ''; break;
          case 5: cellValue = shipment.recipientPhone || ''; break;
          case 6: cellValue = shipment.recipientAddress || ''; break;
          case 7: cellValue = Number(shipment.weight).toString(); break;
          case 8: cellValue = shipment.numberOfBoxes?.toString() || ''; break;
          case 9: cellValue = typeof shipment.originCountry === 'object' ? shipment.originCountry?.name || '' : shipment.originCountry || ''; break;
          case 10: cellValue = typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name || '' : shipment.destinationCountry || ''; break;
          case 11: cellValue = shipment.content || ''; break;
          case 12: cellValue = getPaymentMethodText(shipment.paymentMethod); break;
          case 13: cellValue = typeof shipment.branch === 'object' ? shipment.branch?.name || '' : shipment.branchName || ''; break;
          case 14: cellValue = typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || ''; break;
          case 15: cellValue = shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : ''; break;
          case 16: cellValue = shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : ''; break;
          case 17: cellValue = shipment.notes || ''; break;
        }
        maxLength = Math.max(maxLength, cellValue.length);
      });
      
      // إضافة مساحة إضافية وتحديد حد أدنى
      return Math.max(maxLength + 3, 12);
    });

    // تطبيق عرض الأعمدة
    worksheet.columns.forEach((column, index) => {
      column.width = columnWidths[index];
    });

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipments_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportFilteredToExcel = async () => {
    setIsExportingFiltered(true);
    try {
      const response = await shipmentsAPI.getFilteredShipmentsForExport(filters, sorting);
      
      if (response.success && response.data) {
        const filteredShipments = response.data.shipments;
        const totalWeight = filteredShipments.reduce((sum, s) => sum + Number(s.weight || 0), 0);
        const totalBoxes = filteredShipments.reduce((sum, s) => sum + Number(s.numberOfBoxes || 0), 0);

        const header = [
          'رقم الشحنة', 'المرسل', 'هاتف المرسل', 'عنوان المرسل',
          'المستلم', 'هاتف المستلم', 'عنوان المستلم', 'الوزن',
          'عدد الصناديق', 'بلد الأصل', 'بلد الوجهة', 'المحتوى',
          'طريقة الدفع', 'الفرع', 'الحالة', 'تاريخ الاستلام',
          'التسليم المتوقع', 'الملاحظات'
        ];

        // إضافة البيانات مباشرة بدون إنشاء متغيرات غير مستخدمة

        // إنشاء مصنف Excel جديد
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('الشحنات المفلترة');

        // إضافة صف الملخص
        const summaryRow = worksheet.addRow([
          'المجموع', '', '', '', '', '', '',
          Number(totalWeight.toFixed(2)), totalBoxes,
          '', '', '', '', '', '', '', '', ''
        ]);

        // إضافة صف فارغ
        worksheet.addRow([]);

        // إضافة العناوين
        const headerRow = worksheet.addRow(header);

        // إضافة البيانات
        filteredShipments.forEach(shipment => {
          worksheet.addRow([
            shipment.shipmentNumber,
            shipment.senderName,
            shipment.senderPhone,
            shipment.senderAddress,
            shipment.recipientName,
            shipment.recipientPhone,
            shipment.recipientAddress,
            Number(shipment.weight),
            shipment.numberOfBoxes,
            typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry,
            typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry,
            shipment.content,
            getPaymentMethodText(shipment.paymentMethod),
            typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName,
            typeof shipment.status === 'object' ? shipment.status?.name : shipment.status,
            shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : '',
            shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : '',
            shipment.notes
          ]);
        });

        // تطبيق التنسيق على صف الملخص
        summaryRow.eachCell((cell) => {
          cell.font = { bold: true, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // أصفر
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // تطبيق التنسيق على صف العناوين
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0000FF' } // أزرق
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // تطبيق التنسيق على جميع الخلايا حتى الفارغة منها
        const totalRows = worksheet.rowCount;
        const totalCols = header.length;
        
        for (let rowNum = 1; rowNum <= totalRows; rowNum++) {
          for (let colNum = 1; colNum <= totalCols; colNum++) {
            const cell = worksheet.getCell(rowNum, colNum);
            
            if (rowNum === 1) {
              // تنسيق صف الملخص
              cell.font = { bold: true, size: 12 };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' } // أصفر
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            } else if (rowNum === 3) {
              // تنسيق صف العناوين
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0000FF' } // أزرق
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            } else if (rowNum > 3) {
              // تنسيق خلايا البيانات
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F8FF' } // أزرق فاتح
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            }
          }
        }

        // تحديد عرض الأعمدة بناءً على المحتوى الفعلي
        const columnWidths = header.map((_, colIndex) => {
          let maxLength = 0;
          
          // حساب طول العنوان
          maxLength = Math.max(maxLength, header[colIndex]?.length || 0);
          
          // حساب طول صف الملخص
          const summaryValue = colIndex === 0 ? 'المجموع' : 
                              colIndex === 7 ? Number(totalWeight.toFixed(2)).toString() :
                              colIndex === 8 ? totalBoxes.toString() : '';
          maxLength = Math.max(maxLength, summaryValue.length);
          
          // حساب طول البيانات
          filteredShipments.forEach(shipment => {
            let cellValue = '';
            switch (colIndex) {
              case 0: cellValue = shipment.shipmentNumber || ''; break;
              case 1: cellValue = shipment.senderName || ''; break;
              case 2: cellValue = shipment.senderPhone || ''; break;
              case 3: cellValue = shipment.senderAddress || ''; break;
              case 4: cellValue = shipment.recipientName || ''; break;
              case 5: cellValue = shipment.recipientPhone || ''; break;
              case 6: cellValue = shipment.recipientAddress || ''; break;
              case 7: cellValue = Number(shipment.weight).toString(); break;
              case 8: cellValue = shipment.numberOfBoxes?.toString() || ''; break;
              case 9: cellValue = typeof shipment.originCountry === 'object' ? shipment.originCountry?.name || '' : shipment.originCountry || ''; break;
              case 10: cellValue = typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name || '' : shipment.destinationCountry || ''; break;
              case 11: cellValue = shipment.content || ''; break;
              case 12: cellValue = getPaymentMethodText(shipment.paymentMethod); break;
              case 13: cellValue = typeof shipment.branch === 'object' ? shipment.branch?.name || '' : shipment.branchName || ''; break;
              case 14: cellValue = typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || ''; break;
              case 15: cellValue = shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : ''; break;
              case 16: cellValue = shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : ''; break;
              case 17: cellValue = shipment.notes || ''; break;
            }
            maxLength = Math.max(maxLength, cellValue.length);
          });
          
          // إضافة مساحة إضافية وتحديد حد أدنى
          return Math.max(maxLength + 3, 12);
        });

        // تطبيق عرض الأعمدة
        worksheet.columns.forEach((column, index) => {
          column.width = columnWidths[index];
        });

        // حفظ الملف
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof ShipmentsFilters] && filters[key as keyof ShipmentsFilters] !== 'all').length;
        const fileName = activeFiltersCount > 0 
          ? `filtered_shipments_${activeFiltersCount}filters_${new Date().toISOString().split('T')[0]}.xlsx`
          : `all_shipments_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "تم تصدير البيانات المفلترة بنجاح",
          description: `تم تصدير ${filteredShipments.length} شحنة${activeFiltersCount > 0 ? ` مع ${activeFiltersCount} فلتر مطبق` : ''}`,
          variant: "default",
        });
      } else {
        toast({
          title: "فشل في تصدير البيانات",
          description: "حدث خطأ أثناء جلب البيانات",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to export filtered shipments:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsExportingFiltered(false);
    }
  };

  const exportAllToExcel = async () => {
    setIsExportingAll(true);
    try {
      const response = await shipmentsAPI.getAllShipmentsForExport();
      
      if (response.success && response.data) {
        const allShipments = response.data.shipments;
        const totalWeight = allShipments.reduce((sum, s) => sum + Number(s.weight || 0), 0);
        const totalBoxes = allShipments.reduce((sum, s) => sum + Number(s.numberOfBoxes || 0), 0);

        const header = [
          'رقم الشحنة', 'المرسل', 'هاتف المرسل', 'عنوان المرسل',
          'المستلم', 'هاتف المستلم', 'عنوان المستلم', 'الوزن',
          'عدد الصناديق', 'بلد الأصل', 'بلد الوجهة', 'المحتوى',
          'طريقة الدفع', 'الفرع', 'الحالة', 'تاريخ الاستلام',
          'التسليم المتوقع', 'الملاحظات'
        ];

        // إضافة البيانات مباشرة بدون إنشاء متغيرات غير مستخدمة

        // إنشاء مصنف Excel جديد
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('جميع الشحنات');

        // إضافة صف الملخص
        const summaryRow = worksheet.addRow([
          'المجموع', '', '', '', '', '', '',
          Number(totalWeight.toFixed(2)), totalBoxes,
          '', '', '', '', '', '', '', '', ''
        ]);

        // إضافة صف فارغ
        worksheet.addRow([]);

        // إضافة العناوين
        const headerRow = worksheet.addRow(header);

        // إضافة البيانات
        allShipments.forEach(shipment => {
          worksheet.addRow([
            shipment.shipmentNumber,
            shipment.senderName,
            shipment.senderPhone,
            shipment.senderAddress,
            shipment.recipientName,
            shipment.recipientPhone,
            shipment.recipientAddress,
            Number(shipment.weight),
            shipment.numberOfBoxes,
            typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry,
            typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry,
            shipment.content,
            getPaymentMethodText(shipment.paymentMethod),
            typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName,
            typeof shipment.status === 'object' ? shipment.status?.name : shipment.status,
            shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : '',
            shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : '',
            shipment.notes
          ]);
        });

        // تطبيق التنسيق على صف الملخص
        summaryRow.eachCell((cell) => {
          cell.font = { bold: true, size: 12 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFF00' } // أصفر
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF000000' } },
            bottom: { style: 'medium', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // تطبيق التنسيق على صف العناوين
        headerRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF0000FF' } // أزرق
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        });

        // تطبيق التنسيق على جميع الخلايا حتى الفارغة منها
        const totalRows = worksheet.rowCount;
        const totalCols = header.length;
        
        for (let rowNum = 1; rowNum <= totalRows; rowNum++) {
          for (let colNum = 1; colNum <= totalCols; colNum++) {
            const cell = worksheet.getCell(rowNum, colNum);
            
            if (rowNum === 1) {
              // تنسيق صف الملخص
              cell.font = { bold: true, size: 12 };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFFFFF00' } // أصفر
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'medium', color: { argb: 'FF000000' } },
                bottom: { style: 'medium', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            } else if (rowNum === 3) {
              // تنسيق صف العناوين
              cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF0000FF' } // أزرق
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            } else if (rowNum > 3) {
              // تنسيق خلايا البيانات
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF0F8FF' } // أزرق فاتح
              };
              cell.alignment = { horizontal: 'center', vertical: 'middle' };
              cell.border = {
                top: { style: 'thin', color: { argb: 'FF000000' } },
                bottom: { style: 'thin', color: { argb: 'FF000000' } },
                left: { style: 'thin', color: { argb: 'FF000000' } },
                right: { style: 'thin', color: { argb: 'FF000000' } }
              };
            }
          }
        }

        // تحديد عرض الأعمدة بناءً على المحتوى الفعلي
        const columnWidths = header.map((_, colIndex) => {
          let maxLength = 0;
          
          // حساب طول العنوان
          maxLength = Math.max(maxLength, header[colIndex]?.length || 0);
          
          // حساب طول صف الملخص
          const summaryValue = colIndex === 0 ? 'المجموع' : 
                              colIndex === 7 ? Number(totalWeight.toFixed(2)).toString() :
                              colIndex === 8 ? totalBoxes.toString() : '';
          maxLength = Math.max(maxLength, summaryValue.length);
          
          // حساب طول البيانات
          allShipments.forEach(shipment => {
            let cellValue = '';
            switch (colIndex) {
              case 0: cellValue = shipment.shipmentNumber || ''; break;
              case 1: cellValue = shipment.senderName || ''; break;
              case 2: cellValue = shipment.senderPhone || ''; break;
              case 3: cellValue = shipment.senderAddress || ''; break;
              case 4: cellValue = shipment.recipientName || ''; break;
              case 5: cellValue = shipment.recipientPhone || ''; break;
              case 6: cellValue = shipment.recipientAddress || ''; break;
              case 7: cellValue = Number(shipment.weight).toString(); break;
              case 8: cellValue = shipment.numberOfBoxes?.toString() || ''; break;
              case 9: cellValue = typeof shipment.originCountry === 'object' ? shipment.originCountry?.name || '' : shipment.originCountry || ''; break;
              case 10: cellValue = typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name || '' : shipment.destinationCountry || ''; break;
              case 11: cellValue = shipment.content || ''; break;
              case 12: cellValue = getPaymentMethodText(shipment.paymentMethod); break;
              case 13: cellValue = typeof shipment.branch === 'object' ? shipment.branch?.name || '' : shipment.branchName || ''; break;
              case 14: cellValue = typeof shipment.status === 'object' ? shipment.status?.name || '' : shipment.status || ''; break;
              case 15: cellValue = shipment.receivingDate ? new Date(shipment.receivingDate).toLocaleDateString() : ''; break;
              case 16: cellValue = shipment.expectedDeliveryDate ? new Date(shipment.expectedDeliveryDate).toLocaleDateString() : ''; break;
              case 17: cellValue = shipment.notes || ''; break;
            }
            maxLength = Math.max(maxLength, cellValue.length);
          });
          
          // إضافة مساحة إضافية وتحديد حد أدنى
          return Math.max(maxLength + 3, 12);
        });

        // تطبيق عرض الأعمدة
        worksheet.columns.forEach((column, index) => {
          column.width = columnWidths[index];
        });

        // حفظ الملف
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `all_shipments_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: "تم تصدير البيانات بنجاح",
          description: `تم تصدير ${allShipments.length} شحنة`,
          variant: "default",
        });
      } else {
        toast({
          title: "فشل في تصدير البيانات",
          description: "حدث خطأ أثناء جلب البيانات",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to export all shipments:', error);
      toast({
        title: "خطأ في النظام",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setIsExportingAll(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = statuses.find(s => s.name === status);
    return statusObj?.color || '#6b7280';
  };

  const goToPage = (page: number) => {
    setPage(Math.max(1, Math.min(page, pagination.pages)));
  };

  const toggleColumn = (columnId: string) => {
    setVisibleColumns(prev => {
      const newColumns = prev.includes(columnId)
        ? prev.length > 1 ? prev.filter(id => id !== columnId) : prev // لا تسمح بإخفاء جميع الأعمدة
        : [...prev, columnId];
      
      // حفظ في Local Storage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
      } catch (error) {
        console.error('Error saving columns to storage:', error);
      }
      
      return newColumns;
    });
  };

  // إضافة وظيفة إعادة تعيين الأعمدة
  const resetColumns = () => {
    const defaultColumns = COLUMNS.map(col => col.id);
    setVisibleColumns(defaultColumns);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColumns));
    } catch (error) {
      console.error('Error resetting columns in storage:', error);
    }
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => 
        setDeleteDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الشحنة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الشحنة رقم <strong>{deleteDialog.shipmentNumber}</strong>؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Confirmation Dialog */}
      <AlertDialog open={bulkStatusUpdateDialog.isOpen} onOpenChange={(open) => 
        setBulkStatusUpdateDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تحديث الحالات</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من تغيير حالة <strong>{bulkStatusUpdateDialog.selectedCount}</strong> شحنة؟
              <br />
              <br />
              <span>الحالة الجديدة: <strong>{bulkStatusUpdateDialog.newStatusName}</strong></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkStatusChange}>
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
          <DropdownMenu dir='rtl'>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                إدارة الأعمدة
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>الأعمدة المرئية</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.includes(column.id)}
                  onCheckedChange={() => toggleColumn(column.id)}
                >
                  <span className="flex items-center gap-2">
                    {column.icon}
                    {column.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={false}
                onCheckedChange={resetColumns}
              >
                <span className="flex items-center gap-2 text-blue-600">
                  <ArrowUpDown className="w-4 h-4" />
                  إعادة تعيين الأعمدة
                </span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            variant="outline"
          >
            <Download className="w-4 h-4" />
            تصدير الصفحة ({selectedShipments.length > 0 ? selectedShipments.length : shipments.length})
          </Button>

          {/* Export Filtered Data Button */}
          {Object.keys(filters).some(key => filters[key as keyof ShipmentsFilters] && filters[key as keyof ShipmentsFilters] !== 'all') && (
            <Button
              onClick={exportFilteredToExcel}
              className="flex items-center gap-2"
              variant="outline"
              disabled={isExportingFiltered}
            >
              {isExportingFiltered && <Loader2 className="w-4 h-4 animate-spin" />}
              <Download className="w-4 h-4" />
              تصدير البيانات المفلترة ({pagination.total})
            </Button>
          )}
          
          <Button
            onClick={exportAllToExcel}
            className="flex items-center gap-2"
            disabled={isExportingAll}
          >
            {isExportingAll && <Loader2 className="w-4 h-4 animate-spin" />}
            <Download className="w-4 h-4" />
            تصدير كل البيانات
          </Button>

          <Button
            onClick={clearSorting}
            variant="outline"
            className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50"
            title="إلغاء الفرز وإعادة ترتيب الشحنات حسب تاريخ الإنشاء (الأحدث أولاً)"
          >
            <ArrowUpDown className="w-4 h-4" />
            إلغاء الفرز
          </Button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedShipments.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700">
                  تم تحديد {selectedShipments.length} شحنة
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedShipments([])}
                  className="text-blue-700 border-blue-300"
                >
                  إلغاء التحديد
                </Button>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-blue-700">تغيير الحالة:</span>
                <Select dir="rtl" onValueChange={handleBulkStatusChangeRequest}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="اختر حالة جديدة" />
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
      )}

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
                  placeholder="FEN000000001"
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
                <Select dir='rtl' value={filters.paymentMethod || 'all'} onValueChange={(value) => updateFilter('paymentMethod', value)}>
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
                <Select dir="rtl" value={filters.content || 'all'} onValueChange={(value) => updateFilter('content', value)}>
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
                <Select dir='rtl' value={filters.status || 'all'} onValueChange={(value) => updateFilter('status', value)}>
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
                <Select dir="rtl" value={filters.branch || 'all'} onValueChange={(value) => updateFilter('branch', value)}>
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
                <Select dir="rtl" value={filters.originCountry || 'all'} onValueChange={(value) => updateFilter('originCountry', value)}>
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
                <Select dir="rtl" value={filters.destinationCountry || 'all'} onValueChange={(value) => updateFilter('destinationCountry', value)}>
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

              {/* Date From Filter - Receiving Date */}
              <div>
                <Label>من تاريخ الاستلام</Label>
                <DatePicker
                  date={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      updateFilter('dateFrom', formattedDate);
                    } else {
                      updateFilter('dateFrom', '');
                    }
                  }}
                  placeholder="اختر تاريخ بداية الاستلام"
                />
              </div>

              {/* Date To Filter - Receiving Date */}
              <div>
                <Label>إلى تاريخ الاستلام</Label>
                <DatePicker
                  date={filters.dateTo ? new Date(filters.dateTo) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      const formattedDate = format(date, 'yyyy-MM-dd');
                      updateFilter('dateTo', formattedDate);
                    } else {
                      updateFilter('dateTo', '');
                    }
                  }}
                  placeholder="اختر تاريخ نهاية الاستلام"
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

            {/* Active Filters Display */}
            {Object.keys(filters).some(key => filters[key as keyof ShipmentsFilters] && filters[key as keyof ShipmentsFilters] !== 'all') && (
              <div className="mt-6 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-blue-800">الفلاتر المطبقة حالياً:</h4>
                  <Button variant="outline" size="sm" onClick={clearAllFilters} className="text-blue-600 border-blue-300">
                    <X className="w-4 h-4 mr-1" />
                    مسح جميع الفلاتر
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Search className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">البحث: {filters.search}</span>
                      <button onClick={() => updateFilter('search', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.shipmentNumber && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Package className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">رقم الشحنة: {filters.shipmentNumber}</span>
                      <button onClick={() => updateFilter('shipmentNumber', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.senderName && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <User className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">المرسل: {filters.senderName}</span>
                      <button onClick={() => updateFilter('senderName', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.senderPhone && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Phone className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">هاتف المرسل: {filters.senderPhone}</span>
                      <button onClick={() => updateFilter('senderPhone', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.recipientName && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <User className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">المستلم: {filters.recipientName}</span>
                      <button onClick={() => updateFilter('recipientName', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.recipientPhone && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Phone className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">هاتف المستلم: {filters.recipientPhone}</span>
                      <button onClick={() => updateFilter('recipientPhone', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.status && filters.status !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Clock className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الحالة: {statuses.find(s => s.id === filters.status)?.name}</span>
                      <button onClick={() => updateFilter('status', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.branch && filters.branch !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <MapPin className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الفرع: {branches.find(b => b.id === filters.branch)?.name}</span>
                      <button onClick={() => updateFilter('branch', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.paymentMethod && filters.paymentMethod !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <CreditCard className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">طريقة الدفع: {getPaymentMethodText(filters.paymentMethod)}</span>
                      <button onClick={() => updateFilter('paymentMethod', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.content && filters.content !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <FileCheck className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">المحتوى: {filters.content}</span>
                      <button onClick={() => updateFilter('content', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.originCountry && filters.originCountry !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Globe className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">بلد الأصل: {countries?.find(c => c.id === filters.originCountry)?.name}</span>
                      <button onClick={() => updateFilter('originCountry', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.destinationCountry && filters.destinationCountry !== 'all' && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Globe className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">بلد الوجهة: {countries?.find(c => c.id === filters.destinationCountry)?.name}</span>
                      <button onClick={() => updateFilter('destinationCountry', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.dateFrom && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Calendar className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">من تاريخ: {new Date(filters.dateFrom).toLocaleDateString()}</span>
                      <button onClick={() => updateFilter('dateFrom', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.dateTo && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Calendar className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">إلى تاريخ: {new Date(filters.dateTo).toLocaleDateString()}</span>
                      <button onClick={() => updateFilter('dateTo', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.weightFrom && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Weight className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الوزن من: {filters.weightFrom} كغ</span>
                      <button onClick={() => updateFilter('weightFrom', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.weightTo && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Weight className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الوزن إلى: {filters.weightTo} كغ</span>
                      <button onClick={() => updateFilter('weightTo', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.boxesFrom && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Box className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الصناديق من: {filters.boxesFrom}</span>
                      <button onClick={() => updateFilter('boxesFrom', '')} className="mr-2 bg-white text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {filters.boxesTo && (
                    <div className="flex items-center bg-white px-3 py-1 rounded-full border border-blue-300">
                      <Box className="w-3 h-3 ml-1 text-blue-600" />
                      <span className="text-sm text-blue-800">الصناديق إلى: {filters.boxesTo}</span>
                      <button onClick={() => updateFilter('boxesTo', '')} className="mr-2 bg-white  text-blue-600 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 gap-2">
              {isLoading ? (<div className='flex flex-nowrap items-center gap-3'> <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="text-gray-500">جاري تحميل البيانات...</div></div>): "" }
              {/* <Button variant="outline" size={'sm'} className='bg-white text-orange-600 border-orange-300 hover:bg-orange-50' onClick={clearSorting}>
                <ArrowUpDown className="w-4 h-4" />
                إلغاء الفرز
              </Button> */}
              <Button variant="outline" size={'sm'} className='bg-white text-gray-500 border-[#fff]' onClick={clearAllFilters}>
               <ResetIcon className='w-5'></ResetIcon>
                مسح جميع الفلاتر
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters Summary Card */}
      {Object.keys(filters).some(key => filters[key as keyof ShipmentsFilters] && filters[key as keyof ShipmentsFilters] !== 'all') ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">تم تطبيق فلاتر</span>
                </div>
                <div className="text-sm text-green-700">
                  {Object.keys(filters).filter(key => filters[key as keyof ShipmentsFilters] && filters[key as keyof ShipmentsFilters] !== 'all').length} فلتر نشط
                </div>
                <div className="text-sm font-medium text-green-800">
                  النتائج: {pagination.total} شحنة
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFilteredToExcel}
                  disabled={isExportingFiltered}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  {isExportingFiltered && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                  <Download className="w-3 h-3 mr-1" />
                  تصدير
                </Button>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSorting}
                  className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  title="إلغاء الفرز وإعادة ترتيب الشحنات حسب تاريخ الإنشاء (الأحدث أولاً)"
                >
                  <ArrowUpDown className="w-4 h-4 mr-1" />
                  إلغاء الفرز
                </Button> */}
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(true)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  تعديل الفلاتر
                </Button> */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  مسح الكل
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">لا توجد فلاتر مطبقة</span>
                </div>
                <div className="text-sm text-gray-600">
                  عرض جميع الشحنات - {pagination.total} شحنة
                </div>
              </div>
              {/* <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(true)}
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                إضافة فلاتر
              </Button> */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600">
        <div className="flex flex-col gap-1">
          <div>
            عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total} شحنة
          </div>
          {/* <div className="text-xs text-blue-600 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            مرتبة حسب تاريخ الإنشاء (الأحدث أولاً)
          </div> */}
        </div>
        <div className="flex items-center gap-2">
          <span>عرض</span>
          <Select dir='rtl' value={pagination.limit.toString()} onValueChange={(value) => {
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
           
                    checked={selectedShipments.length === shipments.length && shipments.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {COLUMNS.filter(col => visibleColumns.includes(col.id)).map((col) => (
                  <TableHead 
                    key={col.id}
                    className={`cursor-pointer hover:bg-gray-100 ${col.minWidth ? `min-w-[${col.minWidth}]` : ''} ${
                      col.id === 'shipmentNumber' ? 'sticky left-12 bg-gray-50 z-10' : ''
                    }`}
                    onClick={() => handleSort(col.sortKey as keyof Shipment)}
                  >
                    <div className="flex items-center gap-1">
                      {col.icon}
                      {col.label}
                      {getSortIcon(col.sortKey as keyof Shipment)}
                    </div>
                  </TableHead>
                ))}
                <TableHead className="min-w-[150px] sticky right-0 bg-gray-50 z-10">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-500 mt-2">جاري تحميل البيانات...</p>
                  </TableCell>
                </TableRow>
              ) : shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <TableRow key={shipment.id} className="hover:bg-green-100 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <TableCell className="sticky left-0 z-10 hover:bg-blue-50 transition-colors duration-200">
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) => handleSelectShipment(shipment.id, checked as boolean)}
                      />
                    </TableCell>
                    {COLUMNS.filter(col => visibleColumns.includes(col.id)).map((col) => (
                      <TableCell 
                        key={col.id}
                        className={`${
                          col.id === 'shipmentNumber' ? 'font-medium text-blue-600 sticky left-12  z-10' : ''
                        }`}
                      >
                        {col.id === 'shipmentNumber' ? (
                          <Link to={`/shipment/${shipment.id}`} className="hover:underline">
                            {shipment.shipmentNumber}
                          </Link>
                        ) : col.id === 'sender' ? (
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
                        ) : col.id === 'recipient' ? (
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
                        ) : col.id === 'weight' ? (
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
                        ) : col.id === 'countries' ? (
                          <div className="space-y-1">
                                    <div className="text-sm flex flex-nowrap justify-start items-center gap-1">
                                      <span className="text-gray-500">من:</span> 
                                      <img className='w-4 h-4'src={shipment.originCountry?.flagImage}></img>
                                      {typeof shipment.originCountry === 'object' ? shipment.originCountry?.name : shipment.originCountry}
                    
                            </div>
                                    <div className="text-sm flex flex-nowrap justify-start items-center gap-1">
                                        <span className="text-gray-500">إلى:</span>
                              <img className='w-4 h-4' src={shipment.destinationCountry?.flagImage}></img>
                             {typeof shipment.destinationCountry === 'object' ? shipment.destinationCountry?.name : shipment.destinationCountry}
                          
                             </div>
                          </div>
                        ) : col.id === 'content' ? (
                          <span className="text-sm">{shipment.content || 'غير محدد'}</span>
                        ) : col.id === 'paymentMethod' ? (
                          <Badge variant="outline" className="text-xs">
                            {getPaymentMethodText(shipment.paymentMethod)}
                          </Badge>
                        ) : col.id === 'branch' ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{typeof shipment.branch === 'object' ? shipment.branch?.name : shipment.branchName}</span>
                          </div>
                        ) : col.id === 'status' ? (
                                          <Select dir=
                                            "rtl"
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
                                                                        ) : col.id === 'dates' ? (
                          <div className="space-y-1 text-xs">
                           
                            <div>
                              <span className="text-gray-500">الاستلام:</span><br />
                              {new Date(shipment.receivingDate).toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-gray-500">التسليم المتوقع:</span><br />
                              {new Date(shipment.expectedDeliveryDate).toLocaleDateString()}
                            </div>
                          </div>
                        ) : col.id === 'notes' ? (
                          <div className="max-w-[180px]">
                            {shipment.notes ? (
                              <p className="text-xs text-gray-600 truncate" title={shipment.notes}>
                                {shipment.notes}
                              </p>
                            ) : (
                              <span className="text-xs text-gray-400">لا توجد ملاحظات</span>
                            )}
                          </div>
                        ) : null}
                      </TableCell>
                    ))}
                    <TableCell className="sticky right-0 z-10 hover:bg-blue-50 transition-colors duration-200">
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
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/shipment-label/${shipment.id}`}>
                            <Printer className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRequest(shipment.id, shipment.shipmentNumber)}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-8">
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