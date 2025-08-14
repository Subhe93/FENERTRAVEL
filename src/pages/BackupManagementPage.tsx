import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Upload, 
  Database, 
  AlertCircle, 
  CheckCircle,
  Info,
  FileArchive,
  Calendar,
  HardDrive
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DatabaseStats {
  users: number;
  branches: number;
  countries: number;
  shipmentStatuses: number;
  shipments: number;
  shipmentHistories: number;
  trackingEvents: number;
  invoices: number;
  waybills: number;
  logEntries: number;
  totalRecords: number;
  lastUpdated: string;
}

interface BackupInfo {
  exportDate: string;
  totalRecords: {
    users: number;
    branches: number;
    countries: number;
    shipmentStatuses: number;
    shipments: number;
    shipmentHistories: number;
    trackingEvents: number;
    invoices: number;
    waybills: number;
    logEntries: number;
  };
  version: string;
}

const BackupManagementPage = () => {
  const { t, isRTL } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // حالة استيراد CSV
  const [isImportingCSV, setIsImportingCSV] = useState(false);
  const [selectedCSVFile, setSelectedCSVFile] = useState<File | null>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // جلب إحصائيات قاعدة البيانات
  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/backup/stats');
      const result = await response.json();
      
      if (result.success) {
        setDbStats(result.data);
      } else {
        setMessage({ type: 'error', text: 'فشل في جلب إحصائيات قاعدة البيانات' });
      }
    } catch (error) {
      console.error('خطأ في جلب الإحصائيات:', error);
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    }
  };

  // تصدير النسخة الاحتياطية
  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    setProgress(0);

    try {
      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch('/api/backup/export');
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fenertravel-backup-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setMessage({ type: 'success', text: 'تم تصدير النسخة الاحتياطية بنجاح' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'فشل في تصدير النسخة الاحتياطية' });
      }
    } catch (error) {
      console.error('خطأ في التصدير:', error);
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  };

  // اختيار ملف النسخة الاحتياطية
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setMessage({ type: 'error', text: 'يجب اختيار ملف من نوع ZIP' });
      return;
    }

    setSelectedFile(file);
    setBackupInfo(null);
    setMessage(null);

    // جلب معلومات النسخة الاحتياطية
    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      const response = await fetch('/api/backup/info', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setBackupInfo(result.data);
        setMessage({ type: 'info', text: 'تم تحليل ملف النسخة الاحتياطية بنجاح' });
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل في قراءة ملف النسخة الاحتياطية' });
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('خطأ في قراءة الملف:', error);
      setMessage({ type: 'error', text: 'خطأ في قراءة ملف النسخة الاحتياطية' });
      setSelectedFile(null);
    }
  };

  // استيراد النسخة الاحتياطية
  const handleImport = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', text: 'يرجى اختيار ملف النسخة الاحتياطية أولاً' });
      return;
    }

    const confirmed = window.confirm(
      'تحذير: ستتم إزالة جميع البيانات الحالية واستبدالها بالبيانات من النسخة الاحتياطية. هل أنت متأكد؟'
    );

    if (!confirmed) return;

    setIsImporting(true);
    setMessage(null);
    setProgress(0);

    try {
      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      const formData = new FormData();
      formData.append('backupFile', selectedFile);

      const response = await fetch('/api/backup/import', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `تم استيراد النسخة الاحتياطية بنجاح. تم استيراد ${result.importedData.totalRecords} سجل` 
        });
        setSelectedFile(null);
        setBackupInfo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // تحديث الإحصائيات
        fetchDatabaseStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل في استيراد النسخة الاحتياطية' });
      }
    } catch (error) {
      console.error('خطأ في الاستيراد:', error);
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  // اختيار ملف CSV
  const handleCSVFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'يجب اختيار ملف من نوع CSV' });
      return;
    }

    setSelectedCSVFile(file);
    setMessage({ type: 'info', text: `تم اختيار ملف: ${file.name}` });
  };

  // استيراد ملف CSV
  const handleCSVImport = async () => {
    if (!selectedCSVFile) {
      setMessage({ type: 'error', text: 'يرجى اختيار ملف CSV أولاً' });
      return;
    }

    const confirmed = window.confirm(
      'هل أنت متأكد من استيراد البيانات من ملف CSV؟ سيتم إضافة الشحنات الجديدة إلى قاعدة البيانات.'
    );

    if (!confirmed) return;

    setIsImportingCSV(true);
    setMessage(null);
    setProgress(0);

    try {
      // محاكاة التقدم
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 300);

      const formData = new FormData();
      formData.append('csvFile', selectedCSVFile);

      const response = await fetch('/api/backup/import-csv', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setProgress(100);

      const result = await response.json();
      
      if (result.success) {
        const details = result.importedData.summary?.details?.join(' | ') || '';
        setMessage({ 
          type: 'success', 
          text: `${result.importedData.summary?.message || 'تم الاستيراد بنجاح'}\n${details}` 
        });
        setSelectedCSVFile(null);
        if (csvFileInputRef.current) {
          csvFileInputRef.current.value = '';
        }
        // تحديث الإحصائيات
        fetchDatabaseStats();
      } else {
        setMessage({ type: 'error', text: result.error || 'فشل في استيراد ملف CSV' });
      }
    } catch (error) {
      console.error('خطأ في استيراد CSV:', error);
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    } finally {
      setIsImportingCSV(false);
      setProgress(0);
    }
  };

  // تحميل الإحصائيات عند تحميل الصفحة
  React.useEffect(() => {
    fetchDatabaseStats();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">إدارة النسخ الاحتياطية</h1>
      </div>

      {/* رسائل التنبيه */}
      {message && (
        <Alert className={`${
          message.type === 'error' ? 'border-red-200 bg-red-50' : 
          message.type === 'success' ? 'border-green-200 bg-green-50' : 
          'border-blue-200 bg-blue-50'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Info className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={`${
            message.type === 'error' ? 'text-red-700' : 
            message.type === 'success' ? 'text-green-700' : 
            'text-blue-700'
          }`}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إحصائيات قاعدة البيانات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              إحصائيات قاعدة البيانات الحالية
            </CardTitle>
            <CardDescription>
              نظرة عامة على البيانات المخزنة حالياً
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span>المستخدمين:</span>
                    <Badge variant="secondary">{dbStats.users}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>الفروع:</span>
                    <Badge variant="secondary">{dbStats.branches}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>البلدان:</span>
                    <Badge variant="secondary">{dbStats.countries}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>الشحنات:</span>
                    <Badge variant="secondary">{dbStats.shipments}</Badge>
                  </div>
                  {/* <div className="flex justify-between">
                    <span>الفواتير:</span>
                    <Badge variant="secondary">{dbStats.invoices}</Badge>
                  </div> */}
                  <div className="flex justify-between">
                    <span>سجلات النظام:</span>
                    <Badge variant="secondary">{dbStats.logEntries}</Badge>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">إجمالي السجلات:</span>
                    <Badge className="bg-blue-600">{dbStats.totalRecords}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    آخر تحديث: {new Date(dbStats.lastUpdated).toLocaleString()}
                  </div>
                </div>
                <Button 
                  onClick={fetchDatabaseStats} 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                >
                  تحديث الإحصائيات
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">جاري تحميل الإحصائيات...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* تصدير النسخة الاحتياطية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              تصدير نسخة احتياطية
            </CardTitle>
            <CardDescription>
              إنشاء نسخة احتياطية من جميع البيانات وتنزيلها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium mb-1">ملاحظات مهمة:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>النسخة الاحتياطية تتضمن جميع البيانات والعلاقات</li>
                      <li>حجم الملف يعتمد على كمية البيانات المخزنة</li>
                      <li>يُنصح بإنشاء نسخ احتياطية دورية</li>
                    </ul>
                  </div>
                </div>
              </div>

              {isExporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري إنشاء النسخة الاحتياطية...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              <Button 
                onClick={handleExport}
                disabled={isExporting || isImporting}
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {isExporting ? 'جاري التصدير...' : 'تصدير النسخة الاحتياطية'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* استيراد النسخة الاحتياطية */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            استيراد نسخة احتياطية
          </CardTitle>
          <CardDescription>
            رفع واستيراد نسخة احتياطية لاستعادة البيانات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* تحذير */}
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>تحذير:</strong> عملية الاستيراد ستحذف جميع البيانات الحالية وتستبدلها بالبيانات من النسخة الاحتياطية. 
                تأكد من إنشاء نسخة احتياطية حالية قبل المتابعة.
              </AlertDescription>
            </Alert>

            {/* اختيار الملف */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر ملف النسخة الاحتياطية (ZIP)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {/* معلومات النسخة الاحتياطية */}
              {backupInfo && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileArchive className="w-4 h-4" />
                      معلومات النسخة الاحتياطية
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between">
                        <span>تاريخ الإنشاء:</span>
                        <span>{new Date(backupInfo.exportDate).toLocaleString('ar-SA')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>إصدار النسخة:</span>
                        <span>{backupInfo.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المستخدمين:</span>
                        <Badge variant="outline" className="text-xs">{backupInfo.totalRecords.users}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>الفروع:</span>
                        <Badge variant="outline" className="text-xs">{backupInfo.totalRecords.branches}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>البلدان:</span>
                        <Badge variant="outline" className="text-xs">{backupInfo.totalRecords.countries}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>الشحنات:</span>
                        <Badge variant="outline" className="text-xs">{backupInfo.totalRecords.shipments}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-300">
                      <div className="flex justify-between">
                        <span className="font-medium">إجمالي السجلات:</span>
                        <Badge className="bg-blue-600 text-xs">
                          {Object.values(backupInfo.totalRecords).reduce((sum, count) => sum + count, 0)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* شريط التقدم */}
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري استيراد البيانات...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleImport}
                  disabled={!selectedFile || isImporting || isExporting}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'جاري الاستيراد...' : 'استيراد النسخة الاحتياطية'}
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedFile(null);
                    setBackupInfo(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  disabled={isImporting || isExporting}
                  variant="outline"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* استيراد ملف CSV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5" />
            استيراد بيانات من ملف CSV
          </CardTitle>
          <CardDescription>
            استيراد الشحنات من ملف CSV مُصدّر من النظام القديم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* معلومات مهمة */}
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                <strong>ملاحظة:</strong> هذه الميزة مخصصة لاستيراد البيانات من ملفات CSV المُصدّرة من أنظمة أخرى. 
                سيتم إنشاء البلدان والحالات المطلوبة تلقائياً إذا لم تكن موجودة.
              </AlertDescription>
            </Alert>

            {/* اختيار الملف */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر ملف CSV
                </label>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                {selectedCSVFile && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ تم اختيار: {selectedCSVFile.name}
                  </p>
                )}
              </div>

              {/* متطلبات الملف */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium mb-2">متطلبات ملف CSV:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>يجب أن يحتوي على الأعمدة الأساسية: Shipment Title, Shipper Name, Receiver Name</li>
                      <li>البيانات المطلوبة: Origin, Destination, Weight, Packages</li>
                      <li>التواريخ بصيغة YYYY-MM-DD أو MM/DD/YYYY</li>
                      <li>الترميز: UTF-8 لدعم النصوص العربية</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* شريط التقدم */}
              {isImportingCSV && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>جاري استيراد البيانات...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {/* أزرار التحكم */}
              <div className="flex gap-4">
                <Button 
                  onClick={handleCSVImport}
                  disabled={!selectedCSVFile || isImportingCSV || isImporting || isExporting}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isImportingCSV ? 'جاري الاستيراد...' : 'استيراد ملف CSV'}
                </Button>
                
                <Button 
                  onClick={() => {
                    setSelectedCSVFile(null);
                    if (csvFileInputRef.current) {
                      csvFileInputRef.current.value = '';
                    }
                  }}
                  disabled={isImportingCSV || isImporting || isExporting}
                  variant="outline"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupManagementPage;
