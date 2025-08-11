import express from "express";
import AdmZip from "adm-zip";
import { PrismaClient } from "@prisma/client";
import { UploadedFile } from "express-fileupload";

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

export default router;
