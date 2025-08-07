# تعليمات الإعداد - نظام إدارة الشحنات Fener Travel

## المتطلبات الأساسية

- Node.js (v18 أو أحدث)
- npm أو yarn
- قاعدة بيانات (PostgreSQL, MySQL, أو SQLite)

## خطوات الإعداد

### 1. تثبيت المكتبات

```bash
yarn install
```

### 2. إعداد قاعدة البيانات

أنشئ ملف `.env` في جذر المشروع واضبط متغيرات البيئة:

```env
# اختر نوع قاعدة البيانات المناسب:

# PostgreSQL (مُوصى به للإنتاج)
DATABASE_URL="postgresql://username:password@localhost:5432/fenertravel?schema=public"

# MySQL
# DATABASE_URL="mysql://username:password@localhost:3306/fenertravel"

# SQLite (للتطوير المحلي)
# DATABASE_URL="file:./dev.db"

# مفتاح JWT (أنشئ مفتاح قوي)
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-complex"

# إعدادات التطبيق
NODE_ENV="development"
PORT=3000

# إعدادات البريد الإلكتروني (اختيارية)
EMAIL_SERVICE_API_KEY=""
EMAIL_FROM=""

# إعدادات رفع الملفات (اختيارية)
UPLOAD_MAX_SIZE="10mb"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,application/pdf"
```

### 3. إعداد قاعدة البيانات

```bash
# توليد عميل Prisma
yarn db:generate

# إنشاء قاعدة البيانات وتطبيق النموذج
yarn db:push

# تعبئة البيانات الأولية
yarn db:seed
```

### 4. تشغيل التطبيق

```bash
# للتطوير
yarn dev

# للإنتاج
yarn build
yarn preview
```

## بيانات الدخول الافتراضية

بعد تشغيل الـ seed، يمكنك الدخول باستخدام:

### حساب المدير العام

- **البريد الإلكتروني**: `admin@fenertravel.com`
- **كلمة المرور**: `123456`
- **الصلاحيات**: إدارة كاملة للنظام

### حسابات الموظفين

- **فرع الرياض**: `ahmed@fenertravel.com` / `123456`
- **فرع جدة**: `fatima@fenertravel.com` / `123456`
- **فرع دبي**: `mohammed@fenertravel.com` / `123456`

## الأوامر المفيدة

### أوامر قاعدة البيانات

```bash
# إعادة توليد العميل بعد تغيير Schema
yarn db:generate

# تطبيق التغييرات على قاعدة البيانات
yarn db:push

# إنشاء مايجريشن جديد
yarn db:migrate

# إعادة تعيين قاعدة البيانات بالكامل
yarn db:reset

# تعبئة البيانات الأولية
yarn db:seed

# فتح واجهة إدارة قاعدة البيانات
yarn db:studio
```

### أوامر التطوير

```bash
# تشغيل وضع التطوير
yarn dev

# فحص الأخطاء
yarn lint

# بناء للإنتاج
yarn build

# معاينة بناء الإنتاج
yarn preview
```

## ميزات النظام

### 📦 إدارة الشحنات

- إنشاء وتعديل الشحنات
- تتبع الحالات والمواقع
- إنشاء الفواتير وبوليصات الشحن
- نظام تتبع عام للعملاء

### 👥 إدارة المستخدمين

- مستويات صلاحيات متعددة
- ربط المستخدمين بالفروع
- نظام تسجيل دخول آمن

### 🏢 إدارة الفروع

- إدارة معلومات الفروع
- تخصيص الشحنات للفروع
- تقارير أداء الفروع

### 🌍 إدارة البلدان

- قائمة البلدان المدعومة
- تصنيف بلدان المنشأ والوجهة
- دعم الأعلام والرموز

### 📊 التقارير والسجلات

- سجل مفصل لجميع العمليات
- تاريخ تحديثات الشحنات
- إحصائيات ومقاييس الأداء

## المجلدات والملفات المهمة

```
prisma/
├── schema.prisma          # نموذج قاعدة البيانات
├── seed.ts               # البيانات الأولية
└── migrations/           # ملفات المايجريشن

src/
├── lib/
│   ├── prisma.ts         # إعداد عميل Prisma
│   ├── auth.ts           # خدمات المصادقة
│   └── database.ts       # خدمات قاعدة البيانات
├── contexts/
│   ├── AuthContext.tsx   # سياق المصادقة
│   └── DataContext.tsx   # سياق البيانات (للتحديث)
└── pages/                # صفحات التطبيق
```

## نصائح للتطوير

### 1. العمل مع قاعدة البيانات

- استخدم `yarn db:studio` لعرض وتعديل البيانات
- بعد تغيير `schema.prisma`، شغل `yarn db:generate`
- للتغييرات الكبيرة، استخدم `yarn db:reset` ثم `yarn db:seed`

### 2. التطوير الآمن

- لا تُضع كلمات مرور حقيقية في ملف seed
- استخدم متغيرات البيئة للمعلومات الحساسة
- غيّر كلمات المرور الافتراضية فور النشر

### 3. الأداء

- استخدم `include` في Prisma للبيانات المترابطة
- تجنب N+1 queries باستخدام العلاقات المحسنة
- استخدم `select` لتحديد الحقول المطلوبة فقط

## مشاكل شائعة وحلولها

### خطأ: "Environment variable not found: DATABASE_URL"

**الحل**: تأكد من وجود ملف `.env` مع `DATABASE_URL` صحيح

### خطأ: "Can't reach database server"

**الحل**: تأكد من تشغيل خادم قاعدة البيانات وصحة بيانات الاتصال

### خطأ: "Migration failed"

**الحل**: احذف مجلد `prisma/migrations` واستخدم `yarn db:push`

### خطأ: "Seed failed"

**الحل**: تأكد من تطبيق Schema أولاً: `yarn db:push` ثم `yarn db:seed`

## الدعم والمساعدة

للمزيد من المساعدة:

- 📖 [توثيق Prisma](https://www.prisma.io/docs/)
- 🛠️ [توثيق Vite](https://vitejs.dev/guide/)
- ⚛️ [توثيق React](https://react.dev/)

---

**نصيحة**: احتفظ بنسخ احتياطية من قاعدة البيانات قبل التحديثات الكبيرة!
