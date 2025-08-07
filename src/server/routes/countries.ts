import express from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

// GET /api/countries - الحصول على جميع البلدان
router.get("/", requireAuth, async (req, res) => {
  try {
    const { type, active, search } = req.query;

    // بناء فلتر البحث
    const where: any = {};

    // فلتر نوع البلد
    if (type) {
      where.type = type;
    }

    // فلتر الحالة النشطة
    if (active !== undefined) {
      where.isActive = active === "true";
    }

    // البحث النصي
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { code: { contains: search as string } },
      ];
    }

    const countries = await prisma.country.findMany({
      where,
      include: {
        _count: {
          select: {
            originShipments: true,
            destinationShipments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: { countries },
    });
  } catch (error) {
    console.error("Get countries error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب البلدان",
    });
  }
});

// GET /api/countries/:id - الحصول على بلد واحد
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const country = await prisma.country.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            originShipments: true,
            destinationShipments: true,
          },
        },
      },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: "البلد غير موجود",
      });
    }

    res.json({
      success: true,
      data: { country },
    });
  } catch (error) {
    console.error("Get country error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب البلد",
    });
  }
});

// POST /api/countries - إنشاء بلد جديد (للمدراء فقط)
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بإنشاء بلدان",
      });
    }

    const { name, code, flag, type } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !code || !type) {
      return res.status(400).json({
        success: false,
        error: "الاسم والرمز والنوع مطلوبة",
      });
    }

    // التحقق من أن اسم البلد غير مستخدم
    const existingName = await prisma.country.findUnique({
      where: { name },
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        error: "اسم البلد مستخدم بالفعل",
      });
    }

    // التحقق من أن رمز البلد غير مستخدم
    const existingCode = await prisma.country.findUnique({
      where: { code },
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        error: "رمز البلد مستخدم بالفعل",
      });
    }

    // إنشاء البلد
    const country = await prisma.country.create({
      data: {
        name,
        code: code.toUpperCase(),
        flag,
        type,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "إنشاء بلد جديد",
        details: `تم إنشاء البلد ${name} (${code})`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      success: true,
      data: { country },
      message: "تم إنشاء البلد بنجاح",
    });
  } catch (error) {
    console.error("Create country error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في إنشاء البلد",
    });
  }
});

// PUT /api/countries/:id - تحديث بلد (للمدراء فقط)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل البلدان",
      });
    }

    const { name, code, flag, type, isActive } = req.body;

    const existingCountry = await prisma.country.findUnique({
      where: { id },
    });

    if (!existingCountry) {
      return res.status(404).json({
        success: false,
        error: "البلد غير موجود",
      });
    }

    // التحقق من أن اسم البلد غير مستخدم (إذا تم تغييره)
    if (name && name !== existingCountry.name) {
      const nameExists = await prisma.country.findUnique({
        where: { name },
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: "اسم البلد مستخدم بالفعل",
        });
      }
    }

    // التحقق من أن رمز البلد غير مستخدم (إذا تم تغييره)
    if (code && code !== existingCountry.code) {
      const codeExists = await prisma.country.findUnique({
        where: { code: code.toUpperCase() },
      });

      if (codeExists) {
        return res.status(400).json({
          success: false,
          error: "رمز البلد مستخدم بالفعل",
        });
      }
    }

    // تحديث البلد
    const updatedCountry = await prisma.country.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        flag,
        type,
        isActive,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "تحديث بلد",
        details: `تم تحديث البلد ${updatedCountry.name} (${updatedCountry.code})`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { country: updatedCountry },
      message: "تم تحديث البلد بنجاح",
    });
  } catch (error) {
    console.error("Update country error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث البلد",
    });
  }
});

// DELETE /api/countries/:id - حذف بلد (للمدراء فقط)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بحذف البلدان",
      });
    }

    const country = await prisma.country.findUnique({
      where: { id },
    });

    if (!country) {
      return res.status(404).json({
        success: false,
        error: "البلد غير موجود",
      });
    }

    // التحقق من وجود شحنات مرتبطة بالبلد
    const [originShipmentsCount, destinationShipmentsCount] = await Promise.all(
      [
        prisma.shipment.count({ where: { originCountryId: id } }),
        prisma.shipment.count({ where: { destinationCountryId: id } }),
      ]
    );

    if (originShipmentsCount > 0 || destinationShipmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "لا يمكن حذف البلد لوجود شحنات مرتبطة به. يمكنك إلغاء تفعيل البلد بدلاً من الحذف.",
      });
    }

    // حذف البلد
    await prisma.country.delete({
      where: { id },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "حذف بلد",
        details: `تم حذف البلد ${country.name} (${country.code})`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم حذف البلد بنجاح",
    });
  } catch (error) {
    console.error("Delete country error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في حذف البلد",
    });
  }
});

export default router;
