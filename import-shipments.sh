#!/bin/bash

echo "🚀 بدء عملية استيراد الشحنات من ملف CSV"
echo "=========================================="

# التحقق من وجود ملف CSV
if [ ! -f "shipment-export-1755098092.csv" ]; then
    echo "❌ خطأ: ملف CSV غير موجود"
    echo "   يرجى التأكد من وجود الملف: shipment-export-1755098092.csv"
    exit 1
fi

echo "✅ تم العثور على ملف CSV"

# تحضير قاعدة البيانات
echo ""
echo "🔧 الخطوة 1: تحضير قاعدة البيانات..."
yarn db:prepare-import

if [ $? -ne 0 ]; then
    echo "❌ فشل في تحضير قاعدة البيانات"
    exit 1
fi

# استيراد البيانات
echo ""
echo "📦 الخطوة 2: استيراد البيانات..."
yarn db:import-csv

if [ $? -ne 0 ]; then
    echo "❌ فشل في استيراد البيانات"
    exit 1
fi

echo ""
echo "🎉 تم الانتهاء من عملية الاستيراد بنجاح!"
echo "📊 يمكنك مراجعة البيانات باستخدام: yarn db:studio"
