import { PrismaClient, PaymentMethod, PaymentStatus, CountryType } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// تحليل ملف CSV
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const record: any = {};
    
    headers.forEach((header, index) => {
      record[header] = values[index] || '';
    });
    
    return record;
  });
}

// تحليل سطر CSV مع التعامل مع الفواصل داخل النصوص
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// تنظيف وتحويل البيانات
function cleanData(record: any) {
  return {
    shipmentId: record['ShipmentID']?.toString() || '',
    shipmentTitle: record['Shipment Title'] || '',
    shipperName: record['Shipper Name'] || '',
    shipperPhone: record['Phone Number'] || '',
    shipperAddress: record['Shipper Address'] || '',
    shipperEmail: record['Shipper Email'] || '',
    receiverName: record['Receiver Name'] || '',
    receiverPhone: record['Phone Number'] || '', // العمود الثاني للهاتف
    receiverAddress: record['Receiver Address'] || '',
    receiverEmail: record['Receiver Email'] || '',
    origin: record['Origin'] || '',
    destination: record['Destination'] || '',
    pickupDate: record['Pickup Date'] || '',
    expectedDeliveryDate: record['Expected Delivery Date'] || '',
    status: record['Shipment Status'] || 'قيد المراجعة',
    weight: parseFloat(record['Weight']?.replace(',', '.') || '0') || 0,
    packages: parseInt(record['Packages'] || '1') || 1,
    product: record['Product'] || '',
    paymentMode: record['Payment Mode'] || 'كاش',
    comments: record['Comments'] || '',
    history: record['History'] || ''
  };
}

// تحويل طريقة الدفع
function convertPaymentMethod(paymentMode: string): PaymentMethod {
  const mode = paymentMode.toLowerCase().trim();
  if (mode.includes('كاش') || mode.includes('cash')) {
    return PaymentMethod.CASH_ON_DELIVERY;
  } else if (mode.includes('كرت') || mode.includes('card')) {
    return PaymentMethod.CREDIT_CARD;
  }
  return PaymentMethod.CASH_ON_DELIVERY;
}

// تحويل التاريخ
function parseDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === '') return null;
  
  try {
    // محاولة تحليل التاريخ بصيغة مختلفة
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // محاولة تحليل بصيغة أخرى
      const parts = dateString.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(); // تاريخ افتراضي
    }
    return date;
  } catch {
    return new Date(); // تاريخ افتراضي
  }
}

async function main() {
  console.log("🚀 بدء استيراد البيانات من ملف CSV...");

  try {
    // قراءة ملف CSV
    const csvPath = path.join(process.cwd(), "shipment-export-1755098092.csv");
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log("📄 تم قراءة ملف CSV بنجاح");

    // تحليل البيانات
    const records = parseCSV(csvContent);
    console.log(`📊 تم العثور على ${records.length} سجل في الملف`);

    // إنشاء البيانات الأساسية المطلوبة
    console.log("🏗️ إنشاء البيانات الأساسية...");

    // إنشاء البلدان الموجودة في البيانات
    const uniqueCountries = new Set<string>();
    records.forEach(record => {
      const cleaned = cleanData(record);
      if (cleaned.origin) uniqueCountries.add(cleaned.origin);
      if (cleaned.destination) uniqueCountries.add(cleaned.destination);
    });

    const countries = new Map<string, string>();
    for (const countryName of uniqueCountries) {
      if (countryName && countryName.trim()) {
        try {
          const existing = await prisma.country.findFirst({
            where: { name: countryName }
          });

          if (!existing) {
            const country = await prisma.country.create({
              data: {
                name: countryName,
                code: countryName.substring(0, 2).toUpperCase(),
                type: CountryType.BOTH,
                isActive: true
              }
            });
            countries.set(countryName, country.id);
            console.log(`✅ تم إنشاء البلد: ${countryName}`);
          } else {
            countries.set(countryName, existing.id);
          }
        } catch (error) {
          console.error(`❌ خطأ في إنشاء البلد ${countryName}:`, error);
        }
      }
    }

    // إنشاء حالة افتراضية إذا لم تكن موجودة
    let defaultStatus = await prisma.shipmentStatus.findFirst({
      where: { name: "قيد المراجعة" }
    });

    if (!defaultStatus) {
      defaultStatus = await prisma.shipmentStatus.create({
        data: {
          name: "قيد المراجعة",
          color: "#f59e0b",
          description: "الشحنة قيد المراجعة",
          order: 0
        }
      });
      console.log("✅ تم إنشاء الحالة الافتراضية: قيد المراجعة");
    }

    // إنشاء فرع افتراضي إذا لم يكن موجود
    let defaultBranch = await prisma.branch.findFirst();
    if (!defaultBranch) {
      defaultBranch = await prisma.branch.create({
        data: {
          name: "الفرع الرئيسي",
          location: "المكتب الرئيسي",
          manager: "مدير النظام",
          email: "main@fenertravel.com",
          phone: "+000000000000"
        }
      });
      console.log("✅ تم إنشاء الفرع الافتراضي");
    }

    // إنشاء مستخدم افتراضي إذا لم يكن موجود
    let defaultUser = await prisma.user.findFirst();
    if (!defaultUser) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash("123456", 10);
      
      defaultUser = await prisma.user.create({
        data: {
          name: "مستخدم النظام",
          email: "system@fenertravel.com",
          password: hashedPassword,
          role: "MANAGER",
          branchId: defaultBranch.id
        }
      });
      console.log("✅ تم إنشاء المستخدم الافتراضي");
    }

    // استيراد الشحنات
    console.log("📦 بدء استيراد الشحنات...");
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const cleaned = cleanData(record);

      try {
        // التحقق من وجود الشحنة
        const existingShipment = await prisma.shipment.findFirst({
          where: { shipmentNumber: cleaned.shipmentTitle }
        });

        if (existingShipment) {
          console.log(`⚠️ الشحنة ${cleaned.shipmentTitle} موجودة مسبقاً، تم تخطيها`);
          continue;
        }

        // الحصول على معرفات البلدان
        const originCountryId = countries.get(cleaned.origin) || countries.values().next().value;
        const destinationCountryId = countries.get(cleaned.destination) || countries.values().next().value;

        if (!originCountryId || !destinationCountryId) {
          console.log(`⚠️ لم يتم العثور على البلدان للشحنة ${cleaned.shipmentTitle}`);
          errorCount++;
          continue;
        }

        // تحويل التواريخ
        const receivingDate = parseDate(cleaned.pickupDate) || new Date();
        const expectedDeliveryDate = parseDate(cleaned.expectedDeliveryDate) || new Date(receivingDate.getTime() + 7 * 24 * 60 * 60 * 1000); // أسبوع لاحقاً

        // إنشاء الشحنة
        await prisma.shipment.create({
          data: {
            shipmentNumber: cleaned.shipmentTitle || `FEN${Date.now()}${i}`,
            branchId: defaultBranch.id,
            createdById: defaultUser.id,
            statusId: defaultStatus.id,
            originCountryId,
            destinationCountryId,
            senderName: cleaned.shipperName || "غير محدد",
            senderPhone: cleaned.shipperPhone || "غير محدد",
            senderEmail: cleaned.shipperEmail || null,
            senderAddress: cleaned.shipperAddress || null,
            recipientName: cleaned.receiverName || "غير محدد",
            recipientPhone: cleaned.receiverPhone || "غير محدد",
            recipientEmail: cleaned.receiverEmail || null,
            recipientAddress: cleaned.receiverAddress || null,
            weight: cleaned.weight,
            numberOfBoxes: cleaned.packages,
            content: cleaned.product || "غير محدد",
            paymentMethod: convertPaymentMethod(cleaned.paymentMode),
            receivingDate,
            expectedDeliveryDate,
            shippingCost: 0,
            paidAmount: 0,
            paymentStatus: PaymentStatus.PENDING,
            notes: cleaned.comments || null
          }
        });

        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`✅ تم استيراد ${successCount} شحنة...`);
        }

      } catch (error) {
        console.error(`❌ خطأ في استيراد الشحنة ${cleaned.shipmentTitle}:`, error);
        errorCount++;
      }
    }

    console.log("\n🎉 تم الانتهاء من عملية الاستيراد!");
    console.log(`✅ تم استيراد ${successCount} شحنة بنجاح`);
    console.log(`❌ فشل في استيراد ${errorCount} شحنة`);
    console.log(`📊 إجمالي السجلات المعالجة: ${records.length}`);

  } catch (error) {
    console.error("❌ خطأ عام في عملية الاستيراد:", error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🔌 تم قطع الاتصال بقاعدة البيانات");
  })
  .catch(async (e) => {
    console.error("❌ خطأ نهائي:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

