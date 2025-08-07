# دليل نشر مشروع Fener Travel على Ubuntu VPS

## 1️⃣ تحضير السيرفر

### تحديث النظام

```bash
sudo apt update && sudo apt upgrade -y
```

### تثبيت الأدوات الأساسية

```bash
sudo apt install -y curl wget git build-essential
```

## 2️⃣ تثبيت Node.js و Yarn

### تثبيت Node.js (النسخة 18 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### تثبيت Yarn

```bash
curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
sudo apt update && sudo apt install yarn
```

### التحقق من التثبيت

```bash
node --version
npm --version
yarn --version
```

## 3️⃣ تثبيت PostgreSQL

### تثبيت PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
```

### بدء خدمة PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### إعداد قاعدة البيانات

```bash
# الدخول كمستخدم postgres
sudo -u postgres psql

# إنشاء قاعدة البيانات والمستخدم
CREATE DATABASE fenertravel_db;
CREATE USER fenertravel_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE fenertravel_db TO fenertravel_user;
ALTER USER fenertravel_user CREATEDB;

# الخروج من PostgreSQL
\q
```

### تأمين PostgreSQL

```bash
# تعديل ملف التكوين
sudo nano /etc/postgresql/14/main/pg_hba.conf

# تغيير السطر:
# local   all             all                                     peer
# إلى:
# local   all             all                                     md5

# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

## 4️⃣ تثبيت Nginx (اختياري - كـ Reverse Proxy)

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### تكوين Nginx للمشروع

```bash
sudo nano /etc/nginx/sites-available/fenertravel
```

محتوى ملف التكوين:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

تفعيل التكوين:

```bash
sudo ln -s /etc/nginx/sites-available/fenertravel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 5️⃣ رفع المشروع من GitHub

### إنشاء مجلد المشروع

```bash
sudo mkdir -p /var/www/fenertravel
sudo chown $USER:$USER /var/www/fenertravel
cd /var/www/fenertravel
```

### استنساخ المشروع من GitHub

```bash
git clone https://github.com/your-username/fenertravel-app.git .
```

## 6️⃣ إعداد متغيرات البيئة

### إنشاء ملف .env للإنتاج

```bash
nano .env
```

محتوى الملف:

```env
NODE_ENV=production
PORT=5030

# Database Configuration
DATABASE_URL="postgresql://fenertravel_user:your_secure_password_here@localhost:5432/fenertravel_db"

# JWT Secret
JWT_SECRET=generate_very_secure_jwt_secret_key_here

# CORS Origins
CORS_ORIGIN=http://your-domain.com,https://your-domain.com

# File Upload
MAX_FILE_SIZE=10MB
UPLOAD_DIR=/var/www/fenertravel/uploads

# Email Configuration (اختياري)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 7️⃣ تثبيت التبعيات وبناء المشروع

```bash
# تثبيت التبعيات
yarn install

# بناء المشروع
yarn build

# تشغيل Prisma migrations
npx prisma generate
npx prisma db push

# إدراج البيانات الأولية (اختياري)
npx prisma db seed
```

## 8️⃣ إعداد PM2 لإدارة العملية

### تثبيت PM2

```bash
sudo npm install -g pm2
```

### إنشاء ملف تكوين PM2

```bash
nano ecosystem.config.js
```

محتوى الملف:

```javascript
module.exports = {
  apps: [
    {
      name: "fenertravel",
      script: "dist/server/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5030,
      },
      error_file: "/var/log/pm2/fenertravel-error.log",
      out_file: "/var/log/pm2/fenertravel-out.log",
      log_file: "/var/log/pm2/fenertravel.log",
      max_memory_restart: "1G",
      restart_delay: 4000,
    },
  ],
};
```

### بدء التطبيق باستخدام PM2

```bash
# إنشاء مجلد السجلات
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# بدء التطبيق
pm2 start ecosystem.config.js

# حفظ تكوين PM2
pm2 save

# تفعيل البدء التلقائي
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 9️⃣ إعداد الجدار الناري (UFW)

```bash
# تفعيل UFW
sudo ufw enable

# السماح بالـ SSH
sudo ufw allow ssh

# السماح بـ HTTP و HTTPS
sudo ufw allow 80
sudo ufw allow 443

# السماح بالبورت المخصص للتطبيق
sudo ufw allow 5030

# عرض حالة الجدار الناري
sudo ufw status
```

## 🔟 إعداد SSL Certificate (اختياري مع Let's Encrypt)

```bash
# تثبيت Certbot
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# ربط Certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# اختبار التجديد التلقائي
sudo certbot renew --dry-run
```

## 📊 مراقبة التطبيق

### أوامر PM2 المفيدة

```bash
# عرض حالة التطبيقات
pm2 status

# عرض السجلات
pm2 logs fenertravel

# إعادة تشغيل التطبيق
pm2 restart fenertravel

# إيقاف التطبيق
pm2 stop fenertravel

# حذف التطبيق
pm2 delete fenertravel

# مراقبة الموارد
pm2 monit
```

### مراقبة قاعدة البيانات

```bash
# الاتصال بقاعدة البيانات
sudo -u postgres psql -d fenertravel_db

# عرض الجداول
\dt

# عرض حالة الاتصالات
SELECT * FROM pg_stat_activity;

# الخروج
\q
```

## 🔄 التحديث والصيانة

### تحديث المشروع

```bash
cd /var/www/fenertravel

# سحب التحديثات من GitHub
git pull origin main

# تثبيت التبعيات الجديدة
yarn install

# بناء المشروع
yarn build

# تشغيل migrations جديدة
npx prisma generate
npx prisma db push

# إعادة تشغيل التطبيق
pm2 restart fenertravel
```

### النسخ الاحتياطي لقاعدة البيانات

```bash
# إنشاء نسخة احتياطية
sudo -u postgres pg_dump fenertravel_db > backup_$(date +%Y%m%d_%H%M%S).sql

# استعادة من نسخة احتياطية
sudo -u postgres psql fenertravel_db < backup_file.sql
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة وحلولها

1. **خطأ في الاتصال بقاعدة البيانات:**

```bash
# التحقق من حالة PostgreSQL
sudo systemctl status postgresql

# إعادة تشغيل PostgreSQL
sudo systemctl restart postgresql
```

2. **التطبيق لا يعمل على البورت 5030:**

```bash
# التحقق من استخدام البورت
sudo netstat -tulpn | grep 5030

# قتل العملية إذا لزم الأمر
sudo kill -9 <PID>
```

3. **مشاكل الصلاحيات:**

```bash
# إصلاح صلاحيات المجلد
sudo chown -R $USER:$USER /var/www/fenertravel
sudo chmod -R 755 /var/www/fenertravel
```

## ✅ التحقق من نجاح النشر

1. زيارة التطبيق: `http://your-server-ip:5030`
2. التحقق من PM2: `pm2 status`
3. فحص السجلات: `pm2 logs fenertravel`
4. اختبار قاعدة البيانات: تسجيل الدخول وإنشاء شحنة تجريبية

## 📞 الدعم والصيانة

- **السجلات:** `/var/log/pm2/`
- **ملفات التكوين:** `/etc/nginx/sites-available/`
- **قاعدة البيانات:** `sudo -u postgres psql`
- **مراقبة النظام:** `htop`, `free -h`, `df -h`

---

**ملاحظة:** تأكد من استبدال جميع القيم الافتراضية (كلمات المرور، أسماء النطاقات، إلخ) بالقيم الحقيقية الخاصة بك.
