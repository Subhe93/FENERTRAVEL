import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Edit, Trash2, Palette } from 'lucide-react';
import { toast } from 'sonner';

const StatusManagementPage = () => {
  const { statuses, addStatus, updateStatus, deleteStatus } = useData();
  const { t } = useLanguage();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#6366f1'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#6366f1'
    });
  };

  const handleAdd = () => {
    if (!formData.name) {
      toast.error('يرجى إدخال اسم الحالة');
      return;
    }

    const statusExists = statuses.some(status => status.name === formData.name);
    if (statusExists) {
      toast.error('اسم الحالة موجود بالفعل');
      return;
    }

    addStatus(formData);
    toast.success('تم إضافة الحالة بنجاح');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      color: status.color
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!formData.name) {
      toast.error('يرجى إدخال اسم الحالة');
      return;
    }

    const statusExists = statuses.some(status => 
      status.name === formData.name && status.id !== editingStatus?.id
    );
    if (statusExists) {
      toast.error('اسم الحالة موجود بالفعل');
      return;
    }

    updateStatus(editingStatus.id, formData);
    toast.success('تم تحديث الحالة بنجاح');
    setIsEditDialogOpen(false);
    setEditingStatus(null);
    resetForm();
  };

  const handleDelete = (statusId) => {
    deleteStatus(statusId);
    toast.success('تم حذف الحالة بنجاح');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const predefinedColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
    '#6b7280'  // gray
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة حالات الشحنات</h1>
          <p className="text-gray-600">إدارة وتخصيص حالات الشحنات في النظام</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة حالة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة حالة جديدة</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل الحالة الجديدة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">اسم الحالة *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="مثال: قيد المراجعة"
                />
              </div>
              <div>
                <Label htmlFor="color">لون الحالة *</Label>
                <div className="space-y-3">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-20 h-10"
                  />
                  <div className="grid grid-cols-6 gap-2">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                        style={{ backgroundColor: color }}
                        onClick={() => handleInputChange('color', color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600">معاينة:</Label>
                <div className="mt-2">
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: formData.color,
                      color: formData.color,
                      backgroundColor: formData.color + '20'
                    }}
                  >
                    {formData.name || 'اسم الحالة'}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAdd}>
                إضافة الحالة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            قائمة حالات الشحنات
          </CardTitle>
          <CardDescription>
            جميع حالات الشحنات المتاحة في النظام
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>اسم الحالة</TableHead>
                <TableHead>اللون</TableHead>
                <TableHead>المعاينة</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statuses.map((status) => (
                <TableRow key={status.id}>
                  <TableCell className="font-medium">{status.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm text-gray-600">{status.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    {new Date(status.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(status)}
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
                              هل أنت متأكد من حذف الحالة "{status.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(status.id)}>
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
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الحالة</DialogTitle>
            <DialogDescription>
              تحديث تفاصيل الحالة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">اسم الحالة *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">لون الحالة *</Label>
              <div className="space-y-3">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-20 h-10"
                />
                <div className="grid grid-cols-6 gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors"
                      style={{ backgroundColor: color }}
                      onClick={() => handleInputChange('color', color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Label className="text-sm text-gray-600">معاينة:</Label>
              <div className="mt-2">
                <Badge 
                  variant="outline"
                  style={{ 
                    borderColor: formData.color,
                    color: formData.color,
                    backgroundColor: formData.color + '20'
                  }}
                >
                  {formData.name || 'اسم الحالة'}
                </Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate}>
              تحديث الحالة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatusManagementPage;