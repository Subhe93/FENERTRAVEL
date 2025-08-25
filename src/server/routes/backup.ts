import express from "express";
import AdmZip from "adm-zip";
import bcrypt from "bcryptjs";
import {
  PrismaClient,
  PaymentMethod,
  PaymentStatus,
  CountryType,
  UserRole,
} from "@prisma/client";
import { UploadedFile } from "express-fileupload";
import * as fs from "fs";
import * as path from "path";

// واجهات للبيانات
interface BackupUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  branchId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface BackupShipment {
  id: string;
  shipmentNumber: string;
  branchId: string;
  createdById: string;
  statusId: string;
  originCountryId: string;
  destinationCountryId: string;
  senderName: string;
  senderPhone: string;
  senderEmail: string | null;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string | null;
  recipientAddress: string;
  weight: number;
  numberOfBoxes: number;
  content: string;
  paymentMethod: string;
  receivingDate: Date | string;
  expectedDeliveryDate: Date | string;
  actualDeliveryDate: Date | string | null;
  shippingCost: number | null;
  paidAmount: number | null;
  paymentStatus: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface BackupRecord {
  id: string;
  [key: string]: any; // للخصائص المتغيرة
}

const router = express.Router();
const prisma = new PrismaClient();

// تصدير النسخة الاحتياطية
router.get("/export", async (req, res) => {
  try {
    // جلب جميع البيانات من قاعدة البيانات
    const data = {
      users: await prisma.user.findMany({
        include: {
          branch: true,
        },
      }),
      branches: await prisma.branch.findMany(),
      countries: await prisma.country.findMany(),
      shipmentStatuses: await prisma.shipmentStatus.findMany(),
      shipments: await prisma.shipment.findMany({
        include: {
          branch: true,
          createdBy: true,
          status: true,
          originCountry: true,
          destinationCountry: true,
          histories: true,
          trackingEvents: true,
          invoice: true,
          waybill: true,
        },
      }),
      shipmentHistories: await prisma.shipmentHistory.findMany({
        include: {
          shipment: true,
          user: true,
          status: true,
        },
      }),
      trackingEvents: await prisma.trackingEvent.findMany({
        include: {
          shipment: true,
          status: true,
          updatedBy: true,
        },
      }),
      invoices: await prisma.invoice.findMany({
        include: {
          shipment: true,
        },
      }),
      waybills: await prisma.waybill.findMany({
        include: {
          shipment: true,
        },
      }),
      logEntries: await prisma.logEntry.findMany({
        include: {
          user: true,
          shipment: true,
        },
      }),
    };

    // إنشاء ملف ZIP
    const zip = new AdmZip();

    // إضافة البيانات كملف JSON
    const backupData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: "1.0.0",
    };

    zip.addFile(
      "backup.json",
      Buffer.from(JSON.stringify(backupData, null, 2))
    );

    // إنشاء معلومات النسخة الاحتياطية
    const backupInfo = {
      exportDate: new Date().toISOString(),
      totalRecords: {
        users: data.users.length,
        branches: data.branches.length,
        countries: data.countries.length,
        shipmentStatuses: data.shipmentStatuses.length,
        shipments: data.shipments.length,
        shipmentHistories: data.shipmentHistories.length,
        trackingEvents: data.trackingEvents.length,
        invoices: data.invoices.length,
        waybills: data.waybills.length,
        logEntries: data.logEntries.length,
      },
      version: "1.0.0",
    };

    zip.addFile(
      "backup-info.json",
      Buffer.from(JSON.stringify(backupInfo, null, 2))
    );

    // إرسال الملف المضغوط
    const fileName = `fenertravel-backup-${
      new Date().toISOString().split("T")[0]
    }.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const zipBuffer = zip.toBuffer();
    res.send(zipBuffer);
  } catch (error) {
    console.error("خطأ في تصدير النسخة الاحتياطية:", error);
    res.status(500).json({
      success: false,
      error: "فشل في إنشاء النسخة الاحتياطية",
    });
  }
});

// استيراد النسخة الاحتياطية
router.post("/import", async (req, res) => {
  try {
    // التحقق من وجود الملف
    if (!req.files || !req.files.backupFile) {
      return res.status(400).json({
        success: false,
        error: "لم يتم تحديد ملف النسخة الاحتياطية",
      });
    }

    const backupFile = req.files.backupFile as UploadedFile;

    // التحقق من نوع الملف
    if (!backupFile.name.endsWith(".zip")) {
      return res.status(400).json({
        success: false,
        error: "يجب أن يكون الملف من نوع ZIP",
      });
    }

    // قراءة الملف المضغوط
    const zip = new AdmZip(backupFile.data);

    // استخراج ملف backup.json
    const backupEntry = zip.getEntry("backup.json");
    if (!backupEntry) {
      return res.status(400).json({
        success: false,
        error: "ملف النسخة الاحتياطية غير صالح - لا يحتوي على backup.json",
      });
    }

    const backupData = JSON.parse(backupEntry.getData().toString());

    // التحقق من صحة البيانات
    if (!backupData.users || !backupData.branches || !backupData.countries) {
      return res.status(400).json({
        success: false,
        error: "بيانات النسخة الاحتياطية غير مكتملة",
      });
    }

    // بدء المعاملة (Transaction)
    await prisma.$transaction(async (tx) => {
      // حذف جميع البيانات الموجودة (بترتيب معين لتجنب مشاكل العلاقات)
      console.log("حذف البيانات الموجودة...");
      await tx.logEntry.deleteMany();
      await tx.trackingEvent.deleteMany();
      await tx.shipmentHistory.deleteMany();
      await tx.waybill.deleteMany();
      await tx.invoice.deleteMany();
      await tx.shipment.deleteMany();
      await tx.shipmentStatus.deleteMany();
      await tx.country.deleteMany();
      await tx.user.deleteMany();
      await tx.branch.deleteMany();

      // إدراج البيانات الجديدة
      console.log("إدراج البيانات الجديدة...");

      if (backupData.branches.length > 0) {
        console.log(`إدراج ${backupData.branches.length} فرع...`);
        await tx.branch.createMany({ data: backupData.branches });
      }

      if (backupData.countries.length > 0) {
        console.log(`إدراج ${backupData.countries.length} بلد...`);
        await tx.country.createMany({ data: backupData.countries });
      }

      if (backupData.shipmentStatuses.length > 0) {
        console.log(`إدراج ${backupData.shipmentStatuses.length} حالة شحنة...`);
        await tx.shipmentStatus.createMany({
          data: backupData.shipmentStatuses,
        });
      }

      if (backupData.users.length > 0) {
        console.log(`إدراج ${backupData.users.length} مستخدم...`);
        const usersToInsert = backupData.users.map((user: BackupUser) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          branchId: user.branchId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));
        await tx.user.createMany({ data: usersToInsert });
      }

      if (backupData.shipments.length > 0) {
        console.log(`إدراج ${backupData.shipments.length} شحنة...`);
        const shipmentsToInsert = backupData.shipments.map(
          (shipment: BackupShipment) => ({
            id: shipment.id,
            shipmentNumber: shipment.shipmentNumber,
            branchId: shipment.branchId,
            createdById: shipment.createdById,
            statusId: shipment.statusId,
            originCountryId: shipment.originCountryId,
            destinationCountryId: shipment.destinationCountryId,
            senderName: shipment.senderName,
            senderPhone: shipment.senderPhone,
            senderEmail: shipment.senderEmail,
            senderAddress: shipment.senderAddress,
            recipientName: shipment.recipientName,
            recipientPhone: shipment.recipientPhone,
            recipientEmail: shipment.recipientEmail,
            recipientAddress: shipment.recipientAddress,
            weight: shipment.weight,
            numberOfBoxes: shipment.numberOfBoxes,
            content: shipment.content,
            paymentMethod: shipment.paymentMethod,
            receivingDate: shipment.receivingDate,
            expectedDeliveryDate: shipment.expectedDeliveryDate,
            actualDeliveryDate: shipment.actualDeliveryDate,
            shippingCost: shipment.shippingCost,
            paidAmount: shipment.paidAmount,
            paymentStatus: shipment.paymentStatus,
            notes: shipment.notes,
            createdAt: shipment.createdAt,
            updatedAt: shipment.updatedAt,
          })
        );
        await tx.shipment.createMany({ data: shipmentsToInsert });
      }

      if (backupData.shipmentHistories?.length > 0) {
        console.log(
          `إدراج ${backupData.shipmentHistories.length} سجل تاريخ...`
        );
        const historiesToInsert = backupData.shipmentHistories.map(
          (history: BackupRecord) => ({
            id: history.id,
            shipmentId: history.shipmentId,
            userId: history.userId,
            action: history.action,
            field: history.field,
            oldValue: history.oldValue,
            newValue: history.newValue,
            statusId: history.statusId,
            notes: history.notes,
            timestamp: history.timestamp,
          })
        );
        await tx.shipmentHistory.createMany({ data: historiesToInsert });
      }

      if (backupData.trackingEvents?.length > 0) {
        console.log(`إدراج ${backupData.trackingEvents.length} حدث تتبع...`);
        const eventsToInsert = backupData.trackingEvents.map(
          (event: BackupRecord) => ({
            id: event.id,
            shipmentId: event.shipmentId,
            statusId: event.statusId,
            location: event.location,
            description: event.description,
            notes: event.notes,
            updatedById: event.updatedById,
            eventTime: event.eventTime,
            createdAt: event.createdAt,
          })
        );
        await tx.trackingEvent.createMany({ data: eventsToInsert });
      }

      if (backupData.invoices?.length > 0) {
        console.log(`إدراج ${backupData.invoices.length} فاتورة...`);
        const invoicesToInsert = backupData.invoices.map(
          (invoice: BackupRecord) => ({
            id: invoice.id,
            shipmentId: invoice.shipmentId,
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount,
            taxAmount: invoice.taxAmount,
            discountAmount: invoice.discountAmount,
            status: invoice.status,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            paidDate: invoice.paidDate,
            notes: invoice.notes,
            createdAt: invoice.createdAt,
            updatedAt: invoice.updatedAt,
          })
        );
        await tx.invoice.createMany({ data: invoicesToInsert });
      }

      if (backupData.waybills?.length > 0) {
        console.log(`إدراج ${backupData.waybills.length} بوليصة شحن...`);
        const waybillsToInsert = backupData.waybills.map(
          (waybill: BackupRecord) => ({
            id: waybill.id,
            shipmentId: waybill.shipmentId,
            waybillNumber: waybill.waybillNumber,
            carrierName: waybill.carrierName,
            carrierRefNumber: waybill.carrierRefNumber,
            departureTime: waybill.departureTime,
            arrivalTime: waybill.arrivalTime,
            notes: waybill.notes,
            createdAt: waybill.createdAt,
            updatedAt: waybill.updatedAt,
          })
        );
        await tx.waybill.createMany({ data: waybillsToInsert });
      }

      if (backupData.logEntries?.length > 0) {
        console.log(`إدراج ${backupData.logEntries.length} سجل نظام...`);
        const logsToInsert = backupData.logEntries.map((log: BackupRecord) => ({
          id: log.id,
          type: log.type,
          action: log.action,
          details: log.details,
          userId: log.userId,
          shipmentId: log.shipmentId,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          timestamp: log.timestamp,
        }));
        await tx.logEntry.createMany({ data: logsToInsert });
      }
    });

    const totalRecords =
      (backupData.users?.length || 0) +
      (backupData.branches?.length || 0) +
      (backupData.countries?.length || 0) +
      (backupData.shipments?.length || 0) +
      (backupData.shipmentHistories?.length || 0) +
      (backupData.trackingEvents?.length || 0) +
      (backupData.invoices?.length || 0) +
      (backupData.waybills?.length || 0) +
      (backupData.logEntries?.length || 0);

    res.json({
      success: true,
      message: "تم استيراد النسخة الاحتياطية بنجاح",
      importedData: {
        users: backupData.users?.length || 0,
        branches: backupData.branches?.length || 0,
        countries: backupData.countries?.length || 0,
        shipments: backupData.shipments?.length || 0,
        shipmentHistories: backupData.shipmentHistories?.length || 0,
        trackingEvents: backupData.trackingEvents?.length || 0,
        invoices: backupData.invoices?.length || 0,
        waybills: backupData.waybills?.length || 0,
        logEntries: backupData.logEntries?.length || 0,
        totalRecords,
        backupDate: backupData.exportDate,
        version: backupData.version,
      },
    });
  } catch (error) {
    console.error("خطأ في استيراد النسخة الاحتياطية:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "فشل في استيراد النسخة الاحتياطية",
    });
  }
});

// الحصول على معلومات النسخة الاحتياطية من ملف مضغوط
router.post("/info", async (req, res) => {
  try {
    // التحقق من وجود الملف
    if (!req.files || !req.files.backupFile) {
      return res.status(400).json({
        success: false,
        error: "لم يتم تحديد ملف النسخة الاحتياطية",
      });
    }

    const backupFile = req.files.backupFile as UploadedFile;

    // التحقق من نوع الملف
    if (!backupFile.name.endsWith(".zip")) {
      return res.status(400).json({
        success: false,
        error: "يجب أن يكون الملف من نوع ZIP",
      });
    }

    // قراءة الملف المضغوط
    const zip = new AdmZip(backupFile.data);

    // استخراج ملف backup-info.json
    const infoEntry = zip.getEntry("backup-info.json");
    if (!infoEntry) {
      return res.status(400).json({
        success: false,
        error: "ملف معلومات النسخة الاحتياطية غير موجود",
      });
    }

    const backupInfo = JSON.parse(infoEntry.getData().toString());

    res.json({
      success: true,
      data: backupInfo,
    });
  } catch (error) {
    console.error("خطأ في قراءة معلومات النسخة الاحتياطية:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "فشل في قراءة معلومات النسخة الاحتياطية",
    });
  }
});

// إحصائيات قاعدة البيانات الحالية
router.get("/stats", async (req, res) => {
  try {
    const stats = {
      users: await prisma.user.count(),
      branches: await prisma.branch.count(),
      countries: await prisma.country.count(),
      shipmentStatuses: await prisma.shipmentStatus.count(),
      shipments: await prisma.shipment.count(),
      shipmentHistories: await prisma.shipmentHistory.count(),
      trackingEvents: await prisma.trackingEvent.count(),
      invoices: await prisma.invoice.count(),
      waybills: await prisma.waybill.count(),
      logEntries: await prisma.logEntry.count(),
    };

    const totalRecords = Object.values(stats).reduce(
      (sum, count) => sum + count,
      0
    );

    res.json({
      success: true,
      data: {
        ...stats,
        totalRecords,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("خطأ في جلب إحصائيات قاعدة البيانات:", error);
    res.status(500).json({
      success: false,
      error: "فشل في جلب إحصائيات قاعدة البيانات",
    });
  }
});

// دوال مساعدة لمعالجة CSV
function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return [];

  // تحليل السطر الأول للحصول على الرؤوس
  const headerValues = parseCSVLine(lines[0]);
  const headers = headerValues.map((h) => h.replace(/"/g, "").trim());

  return lines.slice(1).map((line, lineIndex) => {
    const values = parseCSVLine(line);
    const record: any = {};

    // ربط القيم بالرؤوس
    headers.forEach((header, index) => {
      record[header] = values[index] || "";
    });

    // إضافة الأعمدة الإضافية للـ History (بعد العمود 32)
    if (values.length > 32) {
      const historyColumns: string[] = [];
      for (let i = 32; i < values.length; i++) {
        if (values[i] && values[i].trim() !== "") {
          historyColumns.push(values[i].trim());
        }
      }
      record["HistoryColumns"] = historyColumns;
    }

    return record;
  });
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function cleanCSVData(record: any) {
  // الحصول على أرقام الهاتف الصحيحة (هناك عمودان للهاتف)
  // const phoneColumns = Object.keys(record).filter((key) =>
  //   key.includes("Phone Number")
  // );
  // const shipperPhone = phoneColumns[0] ? record[phoneColumns[0]] : "";
  // const receiverPhone = phoneColumns[1] ? record[phoneColumns[1]] : "";

  // جمع جميع بيانات History من العمود الأساسي والأعمدة الإضافية
  const allHistoryData: string[] = [];

  // إضافة History الأساسي إذا كان موجوداً
  if (record["History"] && record["History"].trim() !== "") {
    allHistoryData.push(record["History"].trim());
  }

  // إضافة الأعمدة الإضافية للـ History
  if (record["HistoryColumns"] && Array.isArray(record["HistoryColumns"])) {
    allHistoryData.push(...record["HistoryColumns"]);
  }

  return {
    shipmentId: record["ShipmentID"]?.toString() || "",
    shipmentTitle: record["Shipment Title"] || "",
    shipperName: record["Shipper Name"] || "",
    shipperPhone: record["Phone Number"] || "",
    shipperAddress: record["Shipper Address"] || "",
    shipperEmail: record["Shipper Email"] || "",
    receiverName: record["Receiver Name"] || "",
    receiverPhone: record["Phone Number1"] || "",
    receiverAddress: record["Receiver Address"] || "",
    receiverEmail: record["Receiver Email"] || "",
    origin: record["Origin"] || "",
    destination: record["Destination"] || "",
    pickupDate: record["Pickup Date"] || "",
    departureTime: record["Departure Time"] || "",
    pickupTime: record["Pickup Time"] || "",
    expectedDeliveryDate: record["Expected Delivery Date"] || "",
    status: record["Shipment Status"] || "",
    weight: parseFloat(record["Weight"]?.replace(",", ".") || "0") || 0,
    packages: parseInt(record["Packages"] || "1") || 1,
    product: record["Product"] || "",
    paymentMode: record["Payment Mode"] || "كاش",
    comments: record["Comments"] || "",
    history: record["History"] || "",
    allHistoryData: allHistoryData, // جميع بيانات History مجمعة
  };
}

function convertPaymentMethod(paymentMode: string): PaymentMethod {
  const mode = paymentMode.toLowerCase().trim();
  if (mode.includes("كاش") || mode.includes("cash")) {
    return PaymentMethod.CASH_ON_DELIVERY;
  } else if (mode.includes("كرت") || mode.includes("card")) {
    return PaymentMethod.CREDIT_CARD;
  }
  return PaymentMethod.CASH_ON_DELIVERY;
}

function parseCSVDate(dateString: string): Date | null {
  if (!dateString || dateString.trim() === "") return null;

  const cleanDate = dateString.trim();

  try {
    // محاولة تحليل التاريخ مباشرة
    const directDate = new Date(cleanDate);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }

    // محاولة تحليل التاريخ بصيغة YYYY-MM-DD
    if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = cleanDate.split("-");
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // الشهر يبدأ من 0
      const day = parseInt(parts[2]);

      if (
        year >= 1900 &&
        year <= 2100 &&
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31
      ) {
        return new Date(year, month, day);
      }
    }

    // محاولة تحليل التاريخ بصيغة MM/DD/YYYY
    if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = cleanDate.split("/");
      const month = parseInt(parts[0]) - 1; // الشهر يبدأ من 0
      const day = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      if (
        year >= 1900 &&
        year <= 2100 &&
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31
      ) {
        return new Date(year, month, day);
      }
    }

    // محاولة تحليل التاريخ بصيغة DD/MM/YYYY
    if (cleanDate.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const parts = cleanDate.split("/");
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // الشهر يبدأ من 0
      const year = parseInt(parts[2]);

      if (
        year >= 1900 &&
        year <= 2100 &&
        month >= 0 &&
        month <= 11 &&
        day >= 1 &&
        day <= 31
      ) {
        return new Date(year, month, day);
      }
    }

    console.warn(`تعذر تحليل التاريخ: ${cleanDate}`);
    return null;
  } catch (error) {
    console.error(`خطأ في تحليل التاريخ "${cleanDate}":`, error);
    return null;
  }
}

// معالجة جميع حقول History وإستخراج معلومات الحالة
function parseAllHistoryFields(allHistoryData: string[]): Array<{
  status: string;
  user: string;
  timestamp: Date;
}> {
  const allHistoryEntries: Array<{
    status: string;
    user: string;
    timestamp: Date;
  }> = [];

  if (!allHistoryData || allHistoryData.length === 0) return allHistoryEntries;

  // معالجة كل حقل History على حدة
  allHistoryData.forEach((historyString, index) => {
    if (!historyString || historyString.trim() === "") return;

    try {
      const cleanHistory = historyString.trim();
      const parts = cleanHistory.split("|").map((part) => part.trim());

      // البحث عن النمط: [فارغ] | [فارغ] | [فارغ] | [مستخدم] | [رقم] | [فارغ] | [حالة]
      // مثال: " |  |  | feneradmi | 1 |  | قيد المراجعة"
      let user = "مستخدم النظام";
      let status = "";

      // البحث عن المستخدم والحالة
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        // إذا وجدنا اسم مستخدم (يحتوي على أحرف ولا يحتوي على كلمات الحالة)
        if (
          part &&
          part !== "" &&
          part !== "1" &&
          !part.includes("المراجعة") &&
          !part.includes("متوجه") &&
          !part.includes("تم") &&
          !part.includes("الوصول") &&
          !part.includes("الارسال") &&
          isNaN(parseInt(part))
        ) {
          user = part;
        }

        // إذا وجدنا حالة (تحتوي على كلمات الحالة العربية)
        if (
          part &&
          part !== "" &&
          (part.includes("المراجعة") ||
            part.includes("متوجه") ||
            part.includes("تم") ||
            part.includes("الوصول") ||
            part.includes("الارسال") ||
            part.includes("التسليم") ||
            part.includes("ملغي") ||
            part.includes("مؤجل"))
        ) {
          status = part;
        }
      }

      // إذا وجدنا حالة، نضيفها
      if (status) {
        // إنشاء timestamp مختلف لكل سجل للحفاظ على الترتيب
        const timestamp = new Date();
        timestamp.setSeconds(timestamp.getSeconds() + index);

        allHistoryEntries.push({
          status: status,
          user: user,
          timestamp: timestamp,
        });
      }
    } catch (error) {
      console.error(`خطأ في تحليل حقل History رقم ${index + 1}:`, error);
    }
  });

  // إزالة التكرارات مع الحفاظ على الترتيب
  const uniqueEntries = allHistoryEntries.filter((entry, index, self) => {
    return (
      index ===
      self.findIndex((e) => e.status === entry.status && e.user === entry.user)
    );
  });

  return uniqueEntries;
}

// دالة مساعدة للتوافق مع الكود القديم
function parseHistoryField(historyString: string): Array<{
  status: string;
  user: string;
  timestamp: Date;
}> {
  return parseAllHistoryFields([historyString]);
}

// الحصول على الحالة الصحيحة للشحنة
async function getOrCreateShipmentStatus(statusName: string): Promise<string> {
  if (!statusName || statusName.trim() === "") {
    statusName = "قيد المراجعة";
  }

  // البحث عن الحالة الموجودة
  let status = await prisma.shipmentStatus.findFirst({
    where: { name: statusName.trim() },
  });

  if (!status) {
    // إنشاء الحالة الجديدة
    const statusColors: { [key: string]: string } = {
      "قيد المراجعة": "#f59e0b",
      "تم الاستلام": "#10b981",
      "في الطريق": "#3b82f6",
      "تم التسليم": "#22c55e",
      ملغي: "#ef4444",
      مؤجل: "#f97316",
    };

    status = await prisma.shipmentStatus.create({
      data: {
        name: statusName.trim(),
        color: statusColors[statusName.trim()] || "#6b7280",
        description: `حالة ${statusName.trim()}`,
        order: 0,
      },
    });

    console.log(`✅ تم إنشاء حالة جديدة: ${statusName.trim()}`);
  }

  return status.id;
}

// استخراج أسماء المستخدمين من بيانات History
function extractUsersFromHistory(records: any[]): Set<string> {
  const uniqueUsernames = new Set<string>();

  records.forEach((record) => {
    const cleaned = cleanCSVData(record);
    const historyEntries = parseAllHistoryFields(cleaned.allHistoryData);
    
    historyEntries.forEach((entry) => {
      if (entry.user && entry.user.trim() !== "" && entry.user !== "مستخدم النظام") {
        // استخراج اسم المستخدم وتنظيفه
        const cleanUsername = entry.user.trim();
        if (cleanUsername.length > 2 && !cleanUsername.includes("المراجعة") && !cleanUsername.includes("متوجه")) {
          uniqueUsernames.add(cleanUsername);
        }
      }
    });
  });

  console.log(`🔍 تم العثور على ${uniqueUsernames.size} مستخدم فريد من بيانات History:`);
  uniqueUsernames.forEach(username => console.log(`   - ${username}`));

  return uniqueUsernames;
}

// إنشاء المستخدمين والفروع من أسماء المستخدمين المستخرجة
async function createUsersAndBranchesFromHistory(usernames: Set<string>): Promise<Map<string, {userId: string, branchId: string}>> {
  const userBranchMap = new Map<string, {userId: string, branchId: string}>();
  const hashedPassword = await bcrypt.hash("123456", 10);

  console.log(`👥 إنشاء ${usernames.size} مستخدم و${usernames.size} فرع جديد...`);

  for (const username of usernames) {
    try {
      // إنشاء الفرع بنفس اسم المستخدم
      let branch = await prisma.branch.findFirst({
        where: { name: username }
      });

      if (!branch) {
        // إنشاء اسم فرع فريد إذا لزم الأمر
        let branchName = username;
        let nameAttempt = 1;
        
        while (true) {
          const existingBranch = await prisma.branch.findFirst({
            where: { name: branchName }
          });
          
          if (!existingBranch) {
            break; // الاسم متاح
          }
          
          // إنشاء اسم بديل
          nameAttempt++;
          branchName = `${username} - ${nameAttempt}`;
          
          // تجنب اللوب اللانهائي
          if (nameAttempt > 100) {
            branchName = `${username}_${Date.now()}`;
            break;
          }
        }

        // إنشاء بريد إلكتروني فريد للفرع
        let branchEmail = `${username.toLowerCase()}@fenertravel.com`;
        let emailAttempt = 1;
        
        while (true) {
          const existingBranchWithEmail = await prisma.branch.findFirst({
            where: { email: branchEmail }
          });
          
          if (!existingBranchWithEmail) {
            break; // البريد الإلكتروني متاح
          }
          
          emailAttempt++;
          branchEmail = `${username.toLowerCase()}.branch${emailAttempt}@fenertravel.com`;
          
          if (emailAttempt > 100) {
            branchEmail = `${username.toLowerCase()}.branch_${Date.now()}@fenertravel.com`;
            break;
          }
        }

        branch = await prisma.branch.create({
          data: {
            name: branchName,
            location: `مكتب ${username}`,
            manager: username,
            email: branchEmail,
            phone: `+${Date.now().toString().slice(-10)}`, // رقم هاتف مؤقت
          }
        });
        console.log(`✅ تم إنشاء الفرع: ${branchName}`);
      }

      // إنشاء المستخدم
      let user = await prisma.user.findFirst({
        where: { 
          OR: [
            { name: username },
            { email: `${username.toLowerCase()}@fenertravel.com` }
          ]
        }
      });

      if (!user) {
        // إنشاء بريد إلكتروني فريد
        let userEmail = `${username.toLowerCase()}@fenertravel.com`;
        let emailAttempt = 1;
        
        while (true) {
          const existingWithEmail = await prisma.user.findFirst({
            where: { email: userEmail },
          });
          
          if (!existingWithEmail) {
            break; // البريد الإلكتروني متاح
          }
          
          // إنشاء بريد إلكتروني بديل
          emailAttempt++;
          userEmail = `${username.toLowerCase()}${emailAttempt}@fenertravel.com`;
          
          // تجنب اللوب اللانهائي
          if (emailAttempt > 100) {
            userEmail = `${username.toLowerCase()}_${Date.now()}@fenertravel.com`;
            break;
          }
        }

        user = await prisma.user.create({
          data: {
            name: username,
            email: userEmail,
            password: hashedPassword,
            role: UserRole.BRANCH, // دور افتراضي
            branchId: branch.id,
            isActive: true,
          }
        });
        console.log(`✅ تم إنشاء المستخدم: ${username} بإيميل: ${userEmail}`);
      }

      userBranchMap.set(username, {
        userId: user.id,
        branchId: branch.id
      });

    } catch (error) {
      console.error(`❌ خطأ في إنشاء المستخدم/الفرع ${username}:`, error);
    }
  }

  return userBranchMap;
}

// البحث عن المستخدم المناسب لسجل History (يستخدم فقط المستخدمين المحددين)
async function findUserForHistoryEntry(
  username: string, 
  germanyUser: any,
  switzerlandUser: any,
  defaultUserId: string
): Promise<string> {
  if (!username || username.trim() === "" || username === "مستخدم النظام") {
    return defaultUserId;
  }

  const cleanUsername = username.trim().toLowerCase();
  
  // البحث عن تطابق مع المستخدمين المحددين
  if (cleanUsername.includes("feneradmi") || cleanUsername === "feneradmi") {
    return germanyUser.id;
  }
  
  if (cleanUsername.includes("delo") || cleanUsername === "delo") {
    return switzerlandUser.id;
  }

  // الافتراضي: المستخدم الافتراضي
  return defaultUserId;
}

// تحديد منشئ الشحنة والفرع من أول اسم في History
function getShipmentCreatorFromHistory(allHistoryData: string[]): string | null {
  if (!allHistoryData || allHistoryData.length === 0) {
    return null;
  }

  // معالجة كل حقل History للعثور على أول مستخدم
  for (const historyString of allHistoryData) {
    if (!historyString || historyString.trim() === "") continue;

    try {
      const cleanHistory = historyString.trim();
      const parts = cleanHistory.split("|").map((part) => part.trim());

      // البحث عن أول اسم مستخدم صالح
      for (const part of parts) {
        if (
          part &&
          part !== "" &&
          part !== "1" &&
          !part.includes("المراجعة") &&
          !part.includes("متوجه") &&
          !part.includes("تم") &&
          !part.includes("الوصول") &&
          !part.includes("الارسال") &&
          !part.includes("التسليم") &&
          !part.includes("ملغي") &&
          !part.includes("مؤجل") &&
          isNaN(parseInt(part)) &&
          part.length > 2
        ) {
          return part;
        }
      }
    } catch (error) {
      console.error(`خطأ في تحليل History للعثور على المنشئ:`, error);
    }
  }

  return null;
}

// تحديد الفرع والمستخدم حسب البلد الأصل
function determineCreatorAndBranchByOrigin(
  originCountry: string,
  germanyUser: any,
  germanyBranch: any,
  switzerlandUser: any,
  switzerlandBranch: any
): { userId: string; branchId: string; reason: string } {
  const normalizedOrigin = originCountry.toLowerCase().trim();
  
  if (normalizedOrigin.includes("المانيا") || normalizedOrigin.includes("germany") || normalizedOrigin.includes("deutschland")) {
    return {
      userId: germanyUser.id,
      branchId: germanyBranch.id,
      reason: "البلد الأصل: ألمانيا"
    };
  }
  
  if (normalizedOrigin.includes("سويسرا") || normalizedOrigin.includes("switzerland") || normalizedOrigin.includes("schweiz")) {
    return {
      userId: switzerlandUser.id,
      branchId: switzerlandBranch.id,
      reason: "البلد الأصل: سويسرا"
    };
  }
  
  // الافتراضي: ألمانيا لجميع البلدان الأخرى
  return {
    userId: germanyUser.id,
    branchId: germanyBranch.id,
    reason: `البلد الأصل: ${originCountry} (افتراضي: ألمانيا)`
  };
}

// استيراد ملف CSV
router.post("/import-csv", async (req, res) => {
  try {
    // التحقق من وجود الملف
    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({
        success: false,
        error: "لم يتم تحديد ملف CSV",
      });
    }

    const csvFile = req.files.csvFile as UploadedFile;

    // التحقق من نوع الملف
    if (!csvFile.name.endsWith(".csv")) {
      return res.status(400).json({
        success: false,
        error: "يجب أن يكون الملف من نوع CSV",
      });
    }

    // قراءة محتوى الملف
    const csvContent = csvFile.data.toString("utf-8");

    // تحليل البيانات
    const records = parseCSV(csvContent);
    console.log(`تم العثور على ${records.length} سجل في ملف CSV`);

    // إنشاء البيانات الأساسية المطلوبة
    const uniqueCountries = new Set<string>();
    records.forEach((record) => {
      const cleaned = cleanCSVData(record);
      if (cleaned.origin) uniqueCountries.add(cleaned.origin);
      if (cleaned.destination) uniqueCountries.add(cleaned.destination);
    });

    const countries = new Map<string, string>();
    for (const countryName of uniqueCountries) {
      if (countryName && countryName.trim()) {
        try {
          const existing = await prisma.country.findFirst({
            where: { name: countryName },
          });

          if (!existing) {
            // إنشاء كود فريد للبلد
            let countryCode = countryName.substring(0, 2).toUpperCase();
            let codeAttempt = 1;
            
            // التحقق من وجود الكود والبحث عن كود بديل إذا لزم الأمر
            while (true) {
              const existingWithCode = await prisma.country.findFirst({
                where: { code: countryCode },
              });
              
              if (!existingWithCode) {
                break; // الكود متاح
              }
              
              // إنشاء كود بديل
              codeAttempt++;
              if (countryName.length >= 3) {
                countryCode = countryName.substring(0, 1).toUpperCase() + 
                             countryName.substring(2, 3).toUpperCase();
              } else {
                countryCode = countryName.substring(0, 1).toUpperCase() + codeAttempt.toString();
              }
              
              // تجنب اللوب اللانهائي
              if (codeAttempt > 10) {
                countryCode = `C${Date.now().toString().slice(-3)}`;
                break;
              }
            }

            const country = await prisma.country.create({
              data: {
                name: countryName,
                code: countryCode,
                type: CountryType.BOTH,
                isActive: true,
              },
            });
            countries.set(countryName, country.id);
            console.log(`✅ تم إنشاء البلد: ${countryName} بكود: ${countryCode}`);
          } else {
            countries.set(countryName, existing.id);
            console.log(`ℹ️ البلد ${countryName} موجود مسبقاً`);
          }
        } catch (error) {
          console.error(`خطأ في إنشاء البلد ${countryName}:`, error);
          // محاولة العثور على البلد الموجود في حالة فشل الإنشاء
          const fallbackCountry = await prisma.country.findFirst({
            where: { 
              OR: [
                { name: countryName },
                { name: { contains: countryName.substring(0, 3) } }
              ]
            },
          });
          if (fallbackCountry) {
            countries.set(countryName, fallbackCountry.id);
            console.log(`🔄 تم استخدام البلد الموجود: ${fallbackCountry.name} للاسم: ${countryName}`);
          }
        }
      }
    }

    // استخراج المستخدمين من بيانات History للمعلومات فقط (بدون إنشاء مستخدمين جدد)
    console.log("👥 استخراج المستخدمين من بيانات History للمعلومات...");
    const uniqueUsernames = extractUsersFromHistory(records);
    console.log(`ℹ️ تم العثور على ${uniqueUsernames.size} مستخدم في History ولكن لن يتم إنشاؤهم`);

    // إنشاء الحالات المطلوبة
    const statusesNeeded = new Set<string>();
    records.forEach((record) => {
      const cleaned = cleanCSVData(record);
      if (cleaned.status) statusesNeeded.add(cleaned.status);
      // معالجة جميع حقول History للحصول على الحالات الإضافية
      const historyEntries = parseAllHistoryFields(cleaned.allHistoryData);
      historyEntries.forEach((entry) => {
        if (entry.status) statusesNeeded.add(entry.status);
      });
    });

    // إنشاء الحالات المطلوبة
    for (const statusName of statusesNeeded) {
      if (statusName && statusName.trim()) {
        await getOrCreateShipmentStatus(statusName);
      }
    }

    // الحصول على الحالة الافتراضية
    const defaultStatus = await getOrCreateShipmentStatus("قيد المراجعة");

    // إنشاء الفروع المطلوبة
    console.log("🏢 إنشاء الفروع المطلوبة...");
    
    // فرع ألمانيا
    let germanyBranch = await prisma.branch.findFirst({
      where: { name: "فرع المانيا" }
    });
    if (!germanyBranch) {
      germanyBranch = await prisma.branch.create({
        data: {
          name: "فرع المانيا",
          location: "ألمانيا",
          manager: "feneradmi",
          email: "germany@fenertravel.de",
          phone: "+49000000000",
        },
      });
      console.log("✅ تم إنشاء فرع ألمانيا");
    }

    // فرع سويسرا
    let switzerlandBranch = await prisma.branch.findFirst({
      where: { name: "فرع سويسرا" }
    });
    if (!switzerlandBranch) {
      switzerlandBranch = await prisma.branch.create({
        data: {
          name: "فرع سويسرا",
          location: "سويسرا",
          manager: "delo",
          email: "switzerland@fenertravel.de",
          phone: "+41000000000",
        },
      });
      console.log("✅ تم إنشاء فرع سويسرا");
    }

    // إنشاء المستخدمين المطلوبين
    console.log("👥 إنشاء المستخدمين المطلوبين...");
    const hashedPassword = await bcrypt.hash("123456", 10);

    // مستخدم ألمانيا
    let germanyUser = await prisma.user.findFirst({
      where: { email: "feneradmi@fenertravel.de" }
    });
    if (!germanyUser) {
      germanyUser = await prisma.user.create({
        data: {
          name: "feneradmi",
          email: "feneradmi@fenertravel.de",
          password: hashedPassword,
          role: UserRole.MANAGER,
          branchId: germanyBranch.id,
          isActive: true,
        },
      });
      console.log("✅ تم إنشاء مستخدم ألمانيا: feneradmi@fenertravel.de");
    }

    // مستخدم سويسرا
    let switzerlandUser = await prisma.user.findFirst({
      where: { email: "delo@fenertravel.de" }
    });
    if (!switzerlandUser) {
      switzerlandUser = await prisma.user.create({
        data: {
          name: "delo",
          email: "delo@fenertravel.de",
          password: hashedPassword,
          role: UserRole.MANAGER,
          branchId: switzerlandBranch.id,
          isActive: true,
        },
      });
      console.log("✅ تم إنشاء مستخدم سويسرا: delo@fenertravel.de");
    }

    // إنشاء مستخدم افتراضي إذا لم يكن موجود
    let defaultUser = await prisma.user.findFirst({
      where: { email: "system@fenertravel.com" }
    });
    if (!defaultUser) {
      defaultUser = await prisma.user.create({
        data: {
          name: "مستخدم النظام",
          email: "system@fenertravel.com",
          password: hashedPassword,
          role: UserRole.MANAGER,
          branchId: germanyBranch.id, // تعيين الفرع الافتراضي لألمانيا
        },
      });
      console.log("✅ تم إنشاء المستخدم الافتراضي");
    }

    // استيراد الشحنات
    let successCount = 0;
    let errorCount = 0;
    let shipmentsWithHistoryCreator = 0; // عداد الشحنات التي لها منشئ في History
    let germanyShipments = 0; // عداد شحنات ألمانيا
    let switzerlandShipments = 0; // عداد شحنات سويسرا

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const cleaned = cleanCSVData(record);

      try {
        // التحقق من وجود الشحنة
        const existingShipment = await prisma.shipment.findFirst({
          where: { shipmentNumber: cleaned.shipmentTitle },
        });

        if (existingShipment) {
          continue; // تخطي الشحنة الموجودة
        }

        // الحصول على معرفات البلدان
        const originCountryId =
          countries.get(cleaned.origin) || countries.values().next().value;
        const destinationCountryId =
          countries.get(cleaned.destination) || countries.values().next().value;

        if (!originCountryId || !destinationCountryId) {
          errorCount++;
          continue;
        }

        // تحويل التواريخ بدقة
        let receivingDate = parseCSVDate(cleaned.pickupDate);
        let expectedDeliveryDate = parseCSVDate(cleaned.expectedDeliveryDate);

        // إذا لم نجد تاريخ الاستلام، نستخدم التاريخ الحالي
        if (!receivingDate) {
          receivingDate = new Date();
        }

        // إذا لم نجد تاريخ التسليم المتوقع، نضيف أسبوع لتاريخ الاستلام
        if (!expectedDeliveryDate) {
          expectedDeliveryDate = new Date(
            receivingDate.getTime() + 7 * 24 * 60 * 60 * 1000
          );
        }

        // معالجة التواريخ الإضافية إذا كانت متاحة
        const departureTime = parseCSVDate(cleaned.departureTime);
        const pickupTime = parseCSVDate(cleaned.pickupTime);

        // تحديد الحالة الصحيحة للشحنة
        const shipmentStatusId = cleaned.status
          ? await getOrCreateShipmentStatus(cleaned.status)
          : defaultStatus;

        // تحديد منشئ الشحنة والفرع حسب البلد الأصل
        const creatorAndBranch = determineCreatorAndBranchByOrigin(
          cleaned.origin,
          germanyUser,
          germanyBranch,
          switzerlandUser,
          switzerlandBranch
        );
        
        let shipmentCreatorId = creatorAndBranch.userId;
        let shipmentBranchId = creatorAndBranch.branchId;
        let assignmentReason = creatorAndBranch.reason;
        
        // تسجيل معلومة منشئ من History إذا كان متاحاً (للمعلومات فقط)
        const creatorNameFromHistory = getShipmentCreatorFromHistory(cleaned.allHistoryData);
        if (creatorNameFromHistory) {
          console.log(`ℹ️ الشحنة ${cleaned.shipmentTitle}: منشئ من History = ${creatorNameFromHistory}, لكن تم التوزيع حسب البلد`);
          shipmentsWithHistoryCreator++;
        }
        
        // تحديث العدادات
        if (shipmentCreatorId === germanyUser.id) {
          germanyShipments++;
        } else if (shipmentCreatorId === switzerlandUser.id) {
          switzerlandShipments++;
        }
        
        console.log(`📋 الشحنة ${cleaned.shipmentTitle}: ${assignmentReason}`);
        console.log(`   └── المستخدم: ${shipmentCreatorId === germanyUser.id ? 'feneradmi@fenertravel.de' : 'delo@fenertravel.de'}`);
        console.log(`   └── الفرع: ${shipmentBranchId === germanyBranch.id ? 'فرع ألمانيا' : 'فرع سويسرا'}`);

        // إنشاء الشحنة
        const newShipment = await prisma.shipment.create({
          data: {
            shipmentNumber: cleaned.shipmentTitle || `FEN${Date.now()}${i}`,
            branchId: shipmentBranchId,
            createdById: shipmentCreatorId,
            statusId: shipmentStatusId,
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
            notes: cleaned.comments || null,
          },
        });

        // تسجيل الملاحظات إذا كانت موجودة
        if (cleaned.comments && cleaned.comments.trim() !== "") {
          console.log(
            `💬 ملاحظة للشحنة ${cleaned.shipmentTitle}: "${cleaned.comments}"`
          );
        }

        // معالجة جميع سجلات History وإنشاء أحداث التتبع
        const historyEntries = parseAllHistoryFields(cleaned.allHistoryData);
        console.log(
          `معالجة ${historyEntries.length} سجل تاريخي للشحنة ${cleaned.shipmentTitle}`
        );

        for (
          let historyIndex = 0;
          historyIndex < historyEntries.length;
          historyIndex++
        ) {
          const historyEntry = historyEntries[historyIndex];
          try {
            const historyStatusId = await getOrCreateShipmentStatus(
              historyEntry.status
            );

            // العثور على المستخدم المناسب لهذا السجل
            const historyUserId = await findUserForHistoryEntry(
              historyEntry.user,
              germanyUser,
              switzerlandUser,
              defaultUser.id
            );

            // إنشاء حدث تتبع
            await prisma.trackingEvent.create({
              data: {
                shipmentId: newShipment.id,
                statusId: historyStatusId,
                location: cleaned.origin || "غير محدد",
                description: `تغيير الحالة إلى: ${historyEntry.status}`,
                notes: `تم بواسطة: ${historyEntry.user} (سجل ${
                  historyIndex + 1
                })`,
                updatedById: historyUserId,
                eventTime: historyEntry.timestamp,
                createdAt: historyEntry.timestamp,
              },
            });

            // إنشاء سجل في تاريخ الشحنة
            await prisma.shipmentHistory.create({
              data: {
                shipmentId: newShipment.id,
                userId: historyUserId,
                action: "تحديث الحالة",
                field: "status",
                oldValue: null,
                newValue: historyEntry.status,
                statusId: historyStatusId,
                notes: `استيراد من النظام القديم - بواسطة: ${
                  historyEntry.user
                } (سجل ${historyIndex + 1})`,
                timestamp: historyEntry.timestamp,
              },
            });
          } catch (historyError) {
            console.error(
              `خطأ في إنشاء سجل History ${historyIndex + 1} للشحنة ${
                cleaned.shipmentTitle
              }:`,
              historyError
            );
          }
        }

        successCount++;
      } catch (error) {
        console.error(`خطأ في استيراد الشحنة ${cleaned.shipmentTitle}:`, error);
        errorCount++;
      }
    }

    // حساب إجمالي سجلات History المعالجة والملاحظات
    let totalHistoryRecords = 0;
    let commentsCount = 0;
    records.forEach((record) => {
      const cleaned = cleanCSVData(record);
      const historyEntries = parseAllHistoryFields(cleaned.allHistoryData);
      totalHistoryRecords += historyEntries.length;
      // حساب الملاحظات غير الفارغة
      if (cleaned.comments && cleaned.comments.trim() !== "") {
        commentsCount++;
      }
    });

    res.json({
      success: true,
      message:
        "تم استيراد ملف CSV بنجاح مع استخراج المستخدمين والفروع من بيانات History",
      importedData: {
        totalRecords: records.length,
        successfulImports: successCount,
        failedImports: errorCount,
        countriesCreated: uniqueCountries.size,
        statusesCreated: statusesNeeded.size,
        usersFoundInHistory: uniqueUsernames.size,
        predefinedUsers: 2, // feneradmi و delo
        predefinedBranches: 2, // فرع ألمانيا وفرع سويسرا
        shipmentsWithHistoryCreator: shipmentsWithHistoryCreator,
        germanyShipments: germanyShipments,
        switzerlandShipments: switzerlandShipments,
        historyRecordsProcessed: totalHistoryRecords,
        commentsImported: commentsCount,
        importDate: new Date().toISOString(),
        extractedUsernames: Array.from(uniqueUsernames),
        branchDistribution: {
          germany: {
            user: "feneradmi@fenertravel.de",
            branch: "فرع ألمانيا",
            shipments: germanyShipments
          },
          switzerland: {
            user: "delo@fenertravel.de", 
            branch: "فرع سويسرا",
            shipments: switzerlandShipments
          }
        },
        summary: {
          message: `تم استيراد ${successCount} شحنة مع توزيعها على المستخدمين المحددين: ${germanyShipments} لألمانيا و ${switzerlandShipments} لسويسرا`,
          details: [
            `✅ شحنات مستوردة: ${successCount}`,
            `❌ شحنات فاشلة: ${errorCount}`,
            `🌍 بلدان منشأة: ${uniqueCountries.size}`,
            `📊 حالات منشأة: ${statusesNeeded.size}`,
            `👥 مستخدمين موجودين في History: ${uniqueUsernames.size} (للمعلومات فقط)`,
            `👤 مستخدمين محددين: 2 (feneradmi و delo)`,
            `🏢 فروع محددة: 2 (ألمانيا وسويسرا)`,
            `🇩🇪 شحنات فرع ألمانيا (feneradmi): ${germanyShipments}`,
            `🇨🇭 شحنات فرع سويسرا (delo): ${switzerlandShipments}`,
            `📋 شحنات لها منشئ في History: ${shipmentsWithHistoryCreator}`,
            `📚 سجلات تاريخية معالجة: ${totalHistoryRecords}`,
            `💬 ملاحظات مستوردة: ${commentsCount}`,
            `🔄 تم معالجة جميع الأعمدة حتى AL`,
            `🔗 تم ربط سجلات History بالمستخدمين المحددين فقط`,
          ],
        },
      },
    });
  } catch (error) {
    console.error("خطأ في استيراد ملف CSV:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "فشل في استيراد ملف CSV",
    });
  }
});

// استخراج المستخدمين من ملف CSV للمعلومات فقط (بدون إنشاء)
router.post("/extract-users-csv", async (req, res) => {
  try {
    // التحقق من وجود الملف
    if (!req.files || !req.files.csvFile) {
      return res.status(400).json({
        success: false,
        error: "لم يتم تحديد ملف CSV",
      });
    }

    const csvFile = req.files.csvFile as UploadedFile;

    // التحقق من نوع الملف
    if (!csvFile.name.endsWith(".csv")) {
      return res.status(400).json({
        success: false,
        error: "يجب أن يكون الملف من نوع CSV",
      });
    }

    // قراءة محتوى الملف
    const csvContent = csvFile.data.toString("utf-8");

    // تحليل البيانات
    const records = parseCSV(csvContent);
    console.log(`تم العثور على ${records.length} سجل في ملف CSV`);

    // استخراج المستخدمين من بيانات History للمعلومات فقط
    console.log("👥 استخراج المستخدمين من بيانات History للمعلومات...");
    const uniqueUsernames = extractUsersFromHistory(records);
    
    console.log(`ℹ️ تم العثور على ${uniqueUsernames.size} مستخدم في History ولكن لن يتم إنشاؤهم`);

    // حساب إحصائيات History
    let totalHistoryRecords = 0;
    records.forEach((record) => {
      const cleaned = cleanCSVData(record);
      const historyEntries = parseAllHistoryFields(cleaned.allHistoryData);
      totalHistoryRecords += historyEntries.length;
    });

    res.json({
      success: true,
      message: "تم استخراج أسماء المستخدمين من بيانات History للمعلومات فقط",
      extractedData: {
        totalCsvRecords: records.length,
        totalHistoryRecords: totalHistoryRecords,
        usersFoundInHistory: uniqueUsernames.size,
        predefinedUsersOnly: true,
        usernames: Array.from(uniqueUsernames),
        extractionDate: new Date().toISOString(),
        note: "لن يتم إنشاء مستخدمين أو فروع جديدة، سيتم استخدام المستخدمين المحددين فقط",
        summary: {
          message: `تم العثور على ${uniqueUsernames.size} مستخدم في ${totalHistoryRecords} سجل تاريخي (للمعلومات فقط)`,
          details: [
            `📄 سجلات CSV: ${records.length}`,
            `📋 سجلات History: ${totalHistoryRecords}`,
            `👥 مستخدمين موجودين في History: ${uniqueUsernames.size}`,
            `👤 مستخدمين محددين فقط: feneradmi و delo`,
            `🏢 فروع محددة فقط: ألمانيا وسويسرا`,
            `ℹ️ لن يتم إنشاء مستخدمين أو فروع إضافية`,
          ],
        },
      },
    });
  } catch (error) {
    console.error("خطأ في استخراج المستخدمين من ملف CSV:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "فشل في استخراج المستخدمين من ملف CSV",
    });
  }
});

export default router;
