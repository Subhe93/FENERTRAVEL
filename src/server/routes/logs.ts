import express from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

// GET /api/logs - الحصول على السجلات
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      page = "1",
      limit = "50",
      type,
      userId,
      shipmentId,
      dateFrom,
      dateTo,
      search,
    } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // بناء فلتر البحث
    const where: any = {};

    // للموظفين: عرض السجلات المرتبطة بفرعهم فقط
    if (user.role === "BRANCH" && user.branchId) {
      where.OR = [
        { userId: user.id }, // سجلاته الخاصة
        {
          shipment: {
            branchId: user.branchId,
          },
        }, // سجلات شحنات فرعه
      ];
    }

    // فلتر نوع السجل
    if (type) {
      where.type = type;
    }

    // فلتر المستخدم (للمدراء فقط)
    if (userId && user.role === "MANAGER") {
      where.userId = userId;
    }

    // فلتر الشحنة
    if (shipmentId) {
      where.shipmentId = shipmentId;
    }

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) {
        where.timestamp.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.timestamp.lte = new Date(dateTo as string);
      }
    }

    // البحث النصي
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { action: { contains: search as string } },
        { details: { contains: search as string } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.logEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          shipment: {
            select: {
              id: true,
              shipmentNumber: true,
              senderName: true,
              recipientName: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limitNumber,
      }),
      prisma.logEntry.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get logs error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب السجلات",
    });
  }
});

// GET /api/logs/:id - الحصول على سجل واحد
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const log = await prisma.logEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        shipment: {
          select: {
            id: true,
            shipmentNumber: true,
            senderName: true,
            recipientName: true,
            branchId: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: "السجل غير موجود",
      });
    }

    // التحقق من الصلاحيات
    if (user.role === "BRANCH") {
      // التحقق من أن السجل يخص المستخدم أو شحنة من فرعه
      if (
        log.userId !== user.id &&
        (!log.shipment || log.shipment.branchId !== user.branchId)
      ) {
        return res.status(403).json({
          success: false,
          error: "غير مصرح لك بعرض هذا السجل",
        });
      }
    }

    res.json({
      success: true,
      data: { log },
    });
  } catch (error) {
    console.error("Get log error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب السجل",
    });
  }
});

// GET /api/logs/stats/summary - إحصائيات السجلات
router.get("/stats/summary", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { period = "7d" } = req.query;

    // تحديد فترة الإحصائيات
    let dateFrom: Date;
    switch (period) {
      case "1d":
        dateFrom = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // بناء فلتر البحث
    const where: any = {
      timestamp: { gte: dateFrom },
    };

    // للموظفين: عرض السجلات المرتبطة بفرعهم فقط
    if (user.role === "BRANCH" && user.branchId) {
      where.OR = [
        { userId: user.id },
        { shipment: { branchId: user.branchId } },
      ];
    }

    const [totalLogs, shipmentUpdates, systemActions, userActions, recentLogs] =
      await Promise.all([
        prisma.logEntry.count({ where }),
        prisma.logEntry.count({
          where: { ...where, type: "SHIPMENT_UPDATE" },
        }),
        prisma.logEntry.count({
          where: { ...where, type: "SYSTEM_ACTION" },
        }),
        prisma.logEntry.count({
          where: { ...where, type: "USER_ACTION" },
        }),
        prisma.logEntry.findMany({
          where,
          include: {
            user: { select: { name: true } },
            shipment: { select: { shipmentNumber: true } },
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        }),
      ]);

    const stats = {
      totalLogs,
      shipmentUpdates,
      systemActions,
      userActions,
      recentLogs,
      period,
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get logs stats error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب إحصائيات السجلات",
    });
  }
});

// DELETE /api/logs/cleanup - تنظيف السجلات القديمة (للمدراء فقط)
router.delete("/cleanup", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتنظيف السجلات",
      });
    }

    const { days = "30" } = req.query;
    const daysNumber = parseInt(days as string);

    if (daysNumber < 1) {
      return res.status(400).json({
        success: false,
        error: "عدد الأيام يجب أن يكون أكبر من صفر",
      });
    }

    const cutoffDate = new Date(Date.now() - daysNumber * 24 * 60 * 60 * 1000);

    // حذف السجلات القديمة
    const result = await prisma.logEntry.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    // تسجيل عملية التنظيف
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "تنظيف السجلات",
        details: `تم حذف ${result.count} سجل أقدم من ${daysNumber} يوم`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { deletedCount: result.count },
      message: `تم حذف ${result.count} سجل بنجاح`,
    });
  } catch (error) {
    console.error("Cleanup logs error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تنظيف السجلات",
    });
  }
});

export default router;
