import express from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

// GET /api/status - الحصول على جميع حالات الشحنة
router.get("/", requireAuth, async (req, res) => {
  try {
    const { active, search } = req.query;

    // بناء فلتر البحث
    const where: any = {};

    // فلتر الحالة النشطة
    if (active !== undefined) {
      where.isActive = active === "true";
    }

    // البحث النصي
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    const statuses = await prisma.shipmentStatus.findMany({
      where,
      include: {
        _count: {
          select: {
            shipments: true,
            shipmentHistories: true,
            trackingEvents: true,
          },
        },
      },
      orderBy: { order: "asc" },
    });

    res.json({
      success: true,
      data: { statuses },
    });
  } catch (error) {
    console.error("Get statuses error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب حالات الشحنة",
    });
  }
});

// GET /api/status/:id - الحصول على حالة واحدة
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const status = await prisma.shipmentStatus.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            shipments: true,
            shipmentHistories: true,
            trackingEvents: true,
          },
        },
      },
    });

    if (!status) {
      return res.status(404).json({
        success: false,
        error: "الحالة غير موجودة",
      });
    }

    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب الحالة",
    });
  }
});

// POST /api/status - إنشاء حالة جديدة (للمدراء فقط)
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بإنشاء حالات الشحنة",
      });
    }

    const { name, color, description, order } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        error: "الاسم واللون مطلوبان",
      });
    }

    // التحقق من أن اسم الحالة غير مستخدم
    const existingStatus = await prisma.shipmentStatus.findUnique({
      where: { name },
    });

    if (existingStatus) {
      return res.status(400).json({
        success: false,
        error: "اسم الحالة مستخدم بالفعل",
      });
    }

    // إنشاء الحالة
    const status = await prisma.shipmentStatus.create({
      data: {
        name,
        color,
        description,
        order: order || 0,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "إنشاء حالة شحنة جديدة",
        details: `تم إنشاء الحالة ${name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      success: true,
      data: { status },
      message: "تم إنشاء الحالة بنجاح",
    });
  } catch (error) {
    console.error("Create status error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في إنشاء الحالة",
    });
  }
});

// PUT /api/status/:id - تحديث حالة (للمدراء فقط)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل حالات الشحنة",
      });
    }

    const { name, color, description, order, isActive } = req.body;

    const existingStatus = await prisma.shipmentStatus.findUnique({
      where: { id },
    });

    if (!existingStatus) {
      return res.status(404).json({
        success: false,
        error: "الحالة غير موجودة",
      });
    }

    // التحقق من أن اسم الحالة غير مستخدم (إذا تم تغييره)
    if (name && name !== existingStatus.name) {
      const nameExists = await prisma.shipmentStatus.findUnique({
        where: { name },
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: "اسم الحالة مستخدم بالفعل",
        });
      }
    }

    // تحديث الحالة
    const updatedStatus = await prisma.shipmentStatus.update({
      where: { id },
      data: {
        name,
        color,
        description,
        order,
        isActive,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "تحديث حالة شحنة",
        details: `تم تحديث الحالة ${updatedStatus.name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { status: updatedStatus },
      message: "تم تحديث الحالة بنجاح",
    });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث الحالة",
    });
  }
});

// DELETE /api/status/:id - حذف حالة (للمدراء فقط)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بحذف حالات الشحنة",
      });
    }

    const status = await prisma.shipmentStatus.findUnique({
      where: { id },
    });

    if (!status) {
      return res.status(404).json({
        success: false,
        error: "الحالة غير موجودة",
      });
    }

    // التحقق من وجود شحنات مرتبطة بالحالة
    const shipmentsCount = await prisma.shipment.count({
      where: { statusId: id },
    });

    if (shipmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "لا يمكن حذف الحالة لوجود شحنات مرتبطة بها. يمكنك إلغاء تفعيل الحالة بدلاً من الحذف.",
      });
    }

    // حذف الحالة
    await prisma.shipmentStatus.delete({
      where: { id },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "حذف حالة شحنة",
        details: `تم حذف الحالة ${status.name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم حذف الحالة بنجاح",
    });
  } catch (error) {
    console.error("Delete status error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في حذف الحالة",
    });
  }
});

export default router;
