import { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { logsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Package,
  Settings,
  User,
  Trash2,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
const ITEMS_PER_PAGE = 15;

const LogsPage = () => {
  const { logs, isLoadingLogs, refreshLogs } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [cleanupType, setCleanupType] = useState<'all' | 'days'>('days');
  const [daysToKeep, setDaysToKeep] = useState<number>(1);
  const isFirstLoad = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isFirstLoad.current || (!isLoadingLogs && logs.length === 0)) {
      refreshLogs();
      isFirstLoad.current = false;
    }
  }, [refreshLogs, isLoadingLogs, logs.length]);

  const filteredAndSortedLogs = useMemo(() => {
    const filtered = logs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.userName && log.userName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || log.type === typeFilter;
      
      return matchesSearch && matchesType;
    });

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }, [logs, searchTerm, typeFilter]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedLogs, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedLogs.length / ITEMS_PER_PAGE);

  const getLogTypeIcon = (type: string) => {
    switch (type) {
      case 'SHIPMENT_UPDATE':
        return <Package className="w-4 h-4" />;
      case 'SYSTEM_ACTION':
        return <Settings className="w-4 h-4" />;
      case 'USER_ACTION':
        return <User className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'SHIPMENT_UPDATE':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Package className="w-3 h-3 mr-1" />
            تحديث شحنة
          </Badge>
        );
      case 'SYSTEM_ACTION':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Settings className="w-3 h-3 mr-1" />
            إجراء نظام
          </Badge>
        );
      case 'USER_ACTION':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            <User className="w-3 h-3 mr-1" />
            إجراء مستخدم
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Activity className="w-3 h-3 mr-1" />
            عام
          </Badge>
        );
    }
  };



  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(undefined, { 
        hourCycle: 'h23',
        hour: 'numeric',
        minute: '2-digit'
      })
    };
  };

  const handleClearLogs = async () => {
    try {
      const response = await logsAPI.cleanupLogs(cleanupType === 'all' ? -1 : daysToKeep);
      if (response.success && response.data) {
        toast({
          title: "تم تنظيف السجلات",
          description: response.message || `تم حذف ${response.data.deletedCount} سجل بنجاح`,
        });
        await refreshLogs();
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: response.error || "حدث خطأ أثناء تنظيف السجلات",
        });
      }
    } catch (error) {
      console.error("Error cleaning up logs:", error);
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "حدث خطأ أثناء تنظيف السجلات",
      });
    }
  };

  if (isLoadingLogs) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل السجلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">سجل العمليات</h1>
          <p className="text-gray-600">تتبع جميع العمليات والتحديثات في النظام</p>
        </div>
        {user?.role === 'MANAGER' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                تفريغ السجل
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد تفريغ السجل</AlertDialogTitle>
                <AlertDialogDescription className="space-y-4">
                  <p className="text-gray-600">الرجاء تحديد نوع عملية التفريغ:</p>
                  
                  <RadioGroup  dir='rtl'
                    value={cleanupType} 
                    onValueChange={(value: 'all' | 'days') => setCleanupType(value)}
                    className="flex flex-col gap-1"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="text-sm font-medium">حذف جميع السجلات</Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="days" id="days" />
                      <Label htmlFor="days" className="text-sm font-medium">حذف السجلات الأقدم من</Label>
                    </div>
                  </RadioGroup>

                  {cleanupType === 'days' && (
                    <div className="flex items-center gap-2 mt-2 mr-6">
                      <Input
                        type="number"
                        min={1}
                        value={daysToKeep}
                        onChange={(e) => setDaysToKeep(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                      />
                      <span className="text-sm text-gray-600">يوم</span>
                    </div>
                  )}

                  <div className={cn(
                    "mt-4 p-3 rounded-lg text-sm",
                    cleanupType === 'all' 
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                  )}>
                    <p className="flex items-center gap-2">
                      {cleanupType === 'all' 
                        ? <>
                            <AlertTriangle className="w-4 h-4" />
                            تحذير: سيتم حذف جميع السجلات بشكل نهائي
                          </>
                        : <>
                            <AlertCircle className="w-4 h-4" />
                            سيتم حذف السجلات الأقدم من {daysToKeep} يوم
                          </>
                      }
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="hover:bg-gray-100">إلغاء</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClearLogs} 
                  className={cn(
                    "text-white",
                    cleanupType === 'all' 
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-yellow-600 hover:bg-yellow-700"
                  )}
                >
                  تأكيد الحذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العمليات</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تحديثات الشحنات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(log => log.type === 'SHIPMENT_UPDATE').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجراءات النظام</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.type === 'SYSTEM_ACTION').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجراءات المستخدمين</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {logs.filter(log => log.type === 'USER_ACTION').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            سجل العمليات التفصيلي
          </CardTitle>
          <CardDescription>
            جميع العمليات والتحديثات التي تمت في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في العمليات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select dir="rtl" value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع العمليات</SelectItem>
                <SelectItem value="SHIPMENT_UPDATE">تحديثات الشحنات</SelectItem>
                <SelectItem value="SYSTEM_ACTION">إجراءات النظام</SelectItem>
                <SelectItem value="USER_ACTION">إجراءات المستخدمين</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logs Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>النوع</TableHead>
                  <TableHead>العملية</TableHead>
                  <TableHead>التفاصيل</TableHead>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>رقم الشحنة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const { date, time } = formatTimestamp(log.timestamp);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          {getLogTypeBadge(log.type)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getLogTypeIcon(log.type)}
                            {log.action}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="text-sm text-gray-600 truncate" title={log.details}>
                              {log.details}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.user?.name}</div>
                        </TableCell>
                        <TableCell>
                          {log.shipmentId ? (
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {log.shipment?.shipmentNumber || log.shipmentId}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{date}</TableCell>
                        <TableCell className="font-mono text-sm">{time}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-gray-400" />
                        <p className="text-gray-500">لا توجد عمليات مطابقة للبحث</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                عرض {((currentPage - 1) * ITEMS_PER_PAGE) + 1} إلى {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedLogs.length)} من {filteredAndSortedLogs.length} عملية
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                  السابق
                </Button>
                
                <span className="text-sm">
                  صفحة {currentPage} من {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LogsPage;