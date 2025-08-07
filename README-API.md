# دليل تشغيل نظام APIs - Fener Travel

## نظرة عامة

تم إنشاء نظام API شامل لربط الواجهة الأمامية بقاعدة البيانات. النظام يتكون من:

### 🏗️ هيكل النظام

```
Frontend (React + Vite)  ←→  API Server (Express)  ←→  Database (Prisma + PostgreSQL/MySQL/SQLite)
```

### 📁 هيكل الملفات

```
src/
├── server/                    # API Server
│   ├── index.ts              # نقطة بداية الخادم
│   └── routes/               # مسارات API
│       ├── auth.ts           # المصادقة
│       ├── shipments.ts      # الشحنات
│       ├── users.ts          # المستخدمين
│       ├── branches.ts       # الفروع
│       ├── countries.ts      # البلدان
│       ├── status.ts         # حالات الشحنة
│       └── logs.ts           # السجلات
├── lib/
│   ├── api-client.ts         # عميل API للـ frontend
│   ├── api.ts               # خدمات API
│   ├── prisma.ts            # إعداد Prisma
│   ├── auth.ts              # وظائف المصادقة
│   └── database.ts          # خدمات قاعدة البيانات
└── contexts/
    ├── AuthContext-new.tsx  # سياق المصادقة الجديد
    └── DataContext-new.tsx  # سياق البيانات الجديد
```

## 🚀 تشغيل النظام

### 1. إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env` وعدل القيم:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fenertravel?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-complex"

# App Configuration
NODE_ENV="development"
PORT=3000
API_PORT=5030

# Frontend Configuration
VITE_API_URL="http://localhost:5030/api"
```

### 2. تثبيت المكتبات الجديدة

```bash
yarn install
```

### 3. إعداد قاعدة البيانات

```bash
# إنشاء وتطبيق قاعدة البيانات
yarn db:push

# تعبئة البيانات الأولية
yarn db:seed
```

### 4. تشغيل النظام الكامل

```bash
# تشغيل API Server والواجهة الأمامية معاً
yarn dev:full
```

أو يمكنك تشغيلهما منفصلين:

```bash
# في terminal منفصل - تشغيل API Server
yarn api:dev

# في terminal آخر - تشغيل Frontend
yarn dev
```

### 5. الوصول للتطبيق

- **الواجهة الأمامية**: http://localhost:3000
- **API Server**: http://localhost:5030
- **API Health Check**: http://localhost:5030/api/health

## 🔐 المصادقة

يستخدم النظام JWT tokens للمصادقة:

### بيانات الدخول الافتراضية:

- **المدير العام**: `admin@fenertravel.com` / `123456`
- **موظف فرع الرياض**: `ahmed@fenertravel.com` / `123456`
- **موظف فرع جدة**: `fatima@fenertravel.com` / `123456`
- **موظف فرع دبي**: `mohammed@fenertravel.com` / `123456`

### دورة المصادقة:

1. تسجيل الدخول → الحصول على JWT token
2. حفظ Token في localStorage
3. إرسال Token مع كل طلب API في Authorization header
4. التحقق من صحة Token في كل طلب

## 📡 API Endpoints

### Authentication `/api/auth`

```
POST   /login          # تسجيل الدخول
GET    /me             # الحصول على المستخدم الحالي
POST   /logout         # تسجيل الخروج
```

### Shipments `/api/shipments`

```
GET    /               # قائمة الشحنات (مع pagination وفلترة)
POST   /               # إنشاء شحنة جديدة
GET    /:id            # تفاصيل شحنة
PUT    /:id            # تحديث شحنة
DELETE /:id            # حذف شحنة
PATCH  /:id/status     # تحديث حالة الشحنة
GET    /track/:number  # تتبع شحنة (عام - بدون مصادقة)
GET    /:id/history    # تاريخ الشحنة
GET    /:id/tracking   # أحداث التتبع
```

### Users `/api/users`

```
GET    /               # قائمة المستخدمين (للمدراء فقط)
POST   /               # إنشاء مستخدم جديد (للمدراء فقط)
GET    /:id            # تفاصيل مستخدم
PUT    /:id            # تحديث مستخدم
DELETE /:id            # حذف مستخدم (للمدراء فقط)
```

### Branches `/api/branches`

```
GET    /               # قائمة الفروع
POST   /               # إنشاء فرع جديد (للمدراء فقط)
GET    /:id            # تفاصيل فرع
PUT    /:id            # تحديث فرع (للمدراء فقط)
DELETE /:id            # حذف فرع (للمدراء فقط)
GET    /:id/stats      # إحصائيات الفرع
```

### Countries `/api/countries`

```
GET    /               # قائمة البلدان
POST   /               # إنشاء بلد جديد (للمدراء فقط)
GET    /:id            # تفاصيل بلد
PUT    /:id            # تحديث بلد (للمدراء فقط)
DELETE /:id            # حذف بلد (للمدراء فقط)
```

### Status `/api/status`

```
GET    /               # قائمة حالات الشحنة
POST   /               # إنشاء حالة جديدة (للمدراء فقط)
GET    /:id            # تفاصيل حالة
PUT    /:id            # تحديث حالة (للمدراء فقط)
DELETE /:id            # حذف حالة (للمدراء فقط)
```

### Logs `/api/logs`

```
GET    /               # قائمة السجلات
GET    /:id            # تفاصيل سجل
GET    /stats/summary  # إحصائيات السجلات
DELETE /cleanup        # تنظيف السجلات القديمة (للمدراء فقط)
```

## 🔒 نظام الصلاحيات

### أدوار المستخدمين:

- **MANAGER**: مدير عام - صلاحيات كاملة
- **BRANCH**: موظف فرع - صلاحيات محدودة بفرعه

### قيود الصلاحيات:

- **موظفو الفروع**: يمكنهم رؤية وتعديل شحنات فرعهم فقط
- **المدراء**: يمكنهم الوصول لجميع البيانات وإدارة النظام

## 🛠️ الأوامر المفيدة

### التطوير

```bash
yarn dev:full          # تشغيل كامل (API + Frontend)
yarn api:dev           # تشغيل API Server فقط
yarn dev               # تشغيل Frontend فقط
```

### قاعدة البيانات

```bash
yarn db:studio         # واجهة إدارة قاعدة البيانات
yarn db:generate       # توليد عميل Prisma
yarn db:push           # تطبيق التغييرات
yarn db:seed           # تعبئة البيانات الأولية
yarn db:reset          # إعادة تعيين قاعدة البيانات
```

### الإنتاج

```bash
yarn build             # بناء Frontend للإنتاج
yarn api:build         # بناء API Server للإنتاج
```

## 🎯 الميزات الجديدة

### 🔄 Real-time Data

- تحديث البيانات فوري بين Frontend وDatabase
- Cache ذكي للبيانات مع إمكانية التحديث

### 🔐 أمان محسن

- JWT tokens مع انتهاء صلاحية
- تسجيل مفصل لجميع العمليات مع IP وUser Agent
- تشفير قوي لكلمات المرور

### 📊 APIs متقدمة

- Pagination للبيانات الكبيرة
- Search والـ filtering
- Error handling شامل
- Response standardization

### 🚀 أداء محسن

- Database queries محسنة
- Parallel API calls
- Loading states للـ UX أفضل

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:

#### خطأ: "Cannot connect to database"

```bash
# تأكد من تشغيل قاعدة البيانات
# تحقق من DATABASE_URL في .env
```

#### خطأ: "API Server not responding"

```bash
# تأكد من تشغيل API Server على المنفذ الصحيح
yarn api:dev
```

#### خطأ: "Authentication failed"

```bash
# تأكد من JWT_SECRET في .env
# امسح localStorage وسجل دخول مجدداً
```

#### خطأ: "CORS issues"

```bash
# تأكد من VITE_API_URL في .env
# تأكد من تطابق المنافذ
```

## 🧪 اختبار النظام

### 1. Health Check

```bash
curl http://localhost:5030/api/health
```

### 2. تسجيل دخول

```bash
curl -X POST http://localhost:5030/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fenertravel.com","password":"123456"}'
```

### 3. الحصول على الشحنات

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5030/api/shipments
```

## 📚 التوثيق الإضافي

- [دليل قاعدة البيانات](./README-DATABASE.md)
- [تعليمات الإعداد](./SETUP-INSTRUCTIONS.md)

---

**نصيحة**: استخدم `yarn db:studio` لمراقبة قاعدة البيانات أثناء التطوير!
