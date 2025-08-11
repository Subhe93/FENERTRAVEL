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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Users, Plus, Edit, Trash2, User, Mail, Building2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'MANAGER' | 'BRANCH'; 
  branchId?: string;
  branchName?: string;
  password: string;
  createdAt: string;
}

const UserManagementPage = () => {
  const { branches, users, addUser, updateUser, deleteUser } = useData();
  const { t } = useLanguage();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'BRANCH' as 'MANAGER' | 'BRANCH',
    branchId: '',
    branchName: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'BRANCH',
      branchId: '',
      branchName: ''
    });
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.role === 'BRANCH' && !formData.branchId) {
      toast.error('يرجى اختيار الفرع للمستخدم');
      return;
    }

    const emailExists = users.some(user => user.email === formData.email);
    if (emailExists) {
      toast.error('البريد الإلكتروني مستخدم بالفعل');
      return;
    }

    try {
      const success = await addUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        branchId: formData.role === 'BRANCH' ? formData.branchId : undefined
      });

      if (success) {
        toast.success('تم إضافة المستخدم بنجاح');
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error('حدث خطأ في إضافة المستخدم');
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('حدث خطأ في إضافة المستخدم');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      branchId: user.branchId || '',
      branchName: user.branchName || ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (formData.role === 'BRANCH' && !formData.branchId) {
      toast.error('يرجى اختيار الفرع للمستخدم');
      return;
    }

    const emailExists = users.some(user => 
      user.email === formData.email && user.id !== editingUser?.id
    );
    if (emailExists) {
      toast.error('البريد الإلكتروني مستخدم بالفعل');
      return;
    }

    try {
      const success = await updateUser(editingUser?.id!, {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        branchId: formData.role === 'BRANCH' ? formData.branchId : undefined
      });

      if (success) {
        toast.success('تم تحديث المستخدم بنجاح');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        resetForm();
      } else {
        toast.error('حدث خطأ في تحديث المستخدم');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('حدث خطأ في تحديث المستخدم');
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const success = await deleteUser(userId);
      if (success) {
        toast.success('تم حذف المستخدم بنجاح');
      } else {
        toast.error('حدث خطأ في حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('حدث خطأ في حذف المستخدم');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBranchChange = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    setFormData(prev => ({
      ...prev,
      branchId,
      branchName: branch?.name || ''
    }));
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'MANAGER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-600">إدارة وتنظيم مستخدمي النظام</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              إضافة مستخدم جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة مستخدم جديد</DialogTitle>
              <DialogDescription>
                أدخل تفاصيل المستخدم الجديد
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="مثال: أحمد محمد"
                />
              </div>
              <div>
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="مثال: user@fenertravel.com"
                />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="أدخل كلمة المرور"
                />
              </div>
              <div>
                <Label>الدور *</Label>
                <Select dir='rtl'
                  value={formData.role}
                  onValueChange={(value: 'MANAGER' | 'BRANCH') => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANAGER">مدير</SelectItem> 
                    <SelectItem value="BRANCH">فرع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.role === 'BRANCH' && (
                <div>
                  <Label>الفرع *</Label>
                  <Select dir="rtl"
                    value={formData.branchId}
                    onValueChange={handleBranchChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الفرع" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAdd}>
                إضافة المستخدم
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            قائمة المستخدمين
          </CardTitle>
          <CardDescription>
            جميع مستخدمي النظام المسجلين
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>الدور</TableHead>
                <TableHead>الفرع</TableHead>
                <TableHead>تاريخ الإنشاء</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      <Shield className="w-3 h-3 mr-1" />
                      {user.role === 'MANAGER' ? 'مدير' : 'فرع'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.branchId ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {user.name}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
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
                              هل أنت متأكد من حذف المستخدم "{user.name}"؟ لا يمكن التراجع عن هذا الإجراء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(user.id)}>
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
            <DialogTitle>تعديل المستخدم</DialogTitle>
            <DialogDescription>
              تحديث تفاصيل المستخدم
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">الاسم *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">البريد الإلكتروني *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">كلمة المرور *</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
            <div>
              <Label>الدور *</Label>
              <Select dir='rtl'
                value={formData.role}
                onValueChange={(value: 'MANAGER' | 'BRANCH') => handleInputChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANAGER">مدير</SelectItem>
                  <SelectItem value="BRANCH">فرع</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'BRANCH' && (
              <div>
                <Label>الفرع *</Label>
                <Select dir='rtl'
                  value={formData.branchId}
                  onValueChange={handleBranchChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate}>
              تحديث المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;