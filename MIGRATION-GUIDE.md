# دليل الانتقال إلى نظام APIs

## نظرة عامة

تم إنشاء نظام API شامل جديد لاستبدال البيانات المحلية المؤقتة. هذا الدليل يوضح كيفية الانتقال من النظام القديم إلى الجديد.

## 🔄 التغييرات الرئيسية

### 1. البنية الجديدة

```
البنية القديمة:
Frontend ← Local State (Mock Data)

البنية الجديدة:
Frontend ← API Server ← Database (Prisma)
```

### 2. الملفات الجديدة

```
src/
├── server/                    # ✨ جديد - API Server
├── lib/
│   ├── api-client.ts         # ✨ جديد - عميل API
│   ├── api.ts               # ✨ جديد - خدمات API
│   ├── prisma.ts            # ✨ جديد - إعداد Prisma
│   ├── auth.ts              # ✨ جديد - وظائف المصادقة
│   └── database.ts          # ✨ جديد - خدمات قاعدة البيانات
└── contexts/
    ├── AuthContext-new.tsx  # ✨ جديد - سياق المصادقة
    └── DataContext-new.tsx  # ✨ جديد - سياق البيانات
```

### 3. المكتبات الجديدة

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "concurrently": "^8.2.2"
  }
}
```

## 🚀 خطوات الانتقال

### الخطوة 1: تثبيت المكتبات الجديدة

```bash
yarn install
```

### الخطوة 2: إعداد متغيرات البيئة

أنشئ ملف `.env` بناءً على `.env.example`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-here"
NODE_ENV="development"
PORT=3000
API_PORT=5030
VITE_API_URL="http://localhost:5030/api"
```

### الخطوة 3: إعداد قاعدة البيانات

```bash
yarn db:generate
yarn db:push
yarn db:seed
```

### الخطوة 4: استبدال الـ Contexts

#### في `src/App.tsx`:

```tsx
// القديم
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// الجديد
import { AuthProvider } from "@/contexts/AuthContext-new";
import { DataProvider } from "@/contexts/DataContext-new";
```

### الخطوة 5: تشغيل النظام الجديد

```bash
# تشغيل كامل
yarn dev:full

# أو منفصل
yarn api:dev  # Terminal 1
yarn dev      # Terminal 2
```

## 🔄 مقارنة APIs

### AuthContext

#### القديم:

```tsx
const { user, login, logout, isAuthenticated } = useAuth();

// تسجيل دخول
const success = await login(email, password);
```

#### الجديد:

```tsx
const { user, login, logout, isAuthenticated, isLoading } = useAuth();

// تسجيل دخول (نفس الواجهة + loading state)
const success = await login(email, password);
```

### DataContext

#### القديم:

```tsx
const { shipments, addShipment, updateShipment, deleteShipment } = useData();

// إضافة شحنة
addShipment(shipmentData);
```

#### الجديد:

```tsx
const {
  shipments,
  createShipment,
  updateShipment,
  deleteShipment,
  isLoadingShipments,
  refreshShipments,
} = useData();

// إضافة شحنة (مع error handling)
const success = await createShipment(shipmentData);
if (success) {
  // تمت العملية بنجاح
} else {
  // حدث خطأ
}
```

## 🆕 الميزات الجديدة

### 1. Loading States

```tsx
const { isLoadingShipments, isLoadingBranches } = useData();

if (isLoadingShipments) {
  return <div>جاري التحميل...</div>;
}
```

### 2. Error Handling

```tsx
const handleCreateShipment = async (data) => {
  const success = await createShipment(data);
  if (success) {
    toast.success("تم إنشاء الشحنة بنجاح");
    navigate("/");
  } else {
    toast.error("فشل في إنشاء الشحنة");
  }
};
```

### 3. Real-time Data

```tsx
// تحديث البيانات من الخادم
const handleRefresh = async () => {
  await refreshShipments();
};
```

### 4. Advanced Tracking

```tsx
const { trackShipment } = useData();

const handleTrack = async (shipmentNumber) => {
  const shipment = await trackShipment(shipmentNumber);
  if (shipment) {
    // عرض بيانات التتبع
  }
};
```

## 🔧 تحديث المكونات

### مثال: تحديث صفحة الشحنات

#### القديم:

```tsx
const HomePage = () => {
  const { shipments } = useData();

  return (
    <div>
      {shipments.map((shipment) => (
        <ShipmentCard key={shipment.id} shipment={shipment} />
      ))}
    </div>
  );
};
```

#### الجديد:

```tsx
const HomePage = () => {
  const { shipments, isLoadingShipments, refreshShipments } = useData();

  if (isLoadingShipments) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <Button onClick={refreshShipments}>تحديث</Button>
      {shipments.map((shipment) => (
        <ShipmentCard key={shipment.id} shipment={shipment} />
      ))}
    </div>
  );
};
```

## 📊 مراقبة النظام

### 1. API Health Check

```bash
curl http://localhost:5030/api/health
```

### 2. Database Studio

```bash
yarn db:studio
```

### 3. Logs Monitoring

```tsx
import { logsAPI } from "@/lib/api";

const logs = await logsAPI.getLogs({
  page: 1,
  limit: 50,
  type: "SHIPMENT_UPDATE",
});
```

## 🚨 نصائح مهمة

### 1. النسخ الاحتياطية

```bash
# قبل الانتقال، احتفظ بنسخة احتياطية
cp -r src/contexts src/contexts-backup
```

### 2. التطوير التدريجي

- يمكنك استخدام النظامين جنباً إلى جنب أثناء الانتقال
- اختبر كل مكون قبل الانتقال الكامل

### 3. Error Handling

```tsx
// استخدم try-catch دائماً
const handleAPICall = async () => {
  try {
    const result = await apiCall();
    // handle success
  } catch (error) {
    console.error("API Error:", error);
    toast.error("حدث خطأ في العملية");
  }
};
```

### 4. Performance

```tsx
// استخدم useCallback للـ API calls
const refreshData = useCallback(async () => {
  await refreshShipments();
}, [refreshShipments]);
```

## 🔍 استكشاف الأخطاء

### مشكلة: البيانات لا تظهر

**الحل**: تأكد من تشغيل API Server وصحة الاتصال

### مشكلة: Authentication Errors

**الحل**: امسح localStorage وسجل دخول مجدداً

### مشكلة: CORS Errors

**الحل**: تأكد من إعداد VITE_API_URL بشكل صحيح

### مشكلة: Database Connection

**الحل**: تحقق من DATABASE_URL في .env

## ✅ قائمة التحقق

- [ ] تثبيت المكتبات الجديدة
- [ ] إعداد متغيرات البيئة
- [ ] إعداد قاعدة البيانات
- [ ] استبدال AuthContext
- [ ] استبدال DataContext
- [ ] تحديث App.tsx
- [ ] اختبار تسجيل الدخول
- [ ] اختبار إنشاء الشحنات
- [ ] اختبار التتبع العام
- [ ] التحقق من الصلاحيات
- [ ] اختبار الأداء

---

🎉 **مبروك! تم الانتقال بنجاح إلى نظام APIs الاحترافي!**
