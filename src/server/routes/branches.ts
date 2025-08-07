import express from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "./auth";

const router = express.Router();

// GET /api/branches - الحصول على جميع الفروع
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { page = "1", limit = "20", search, active } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

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
        { location: { contains: search as string } },
        { manager: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              shipments: true,
            },
          },
        },
        orderBy: { name: "asc" },
        skip,
        take: limitNumber,
      }),
      prisma.branch.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        branches,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب الفروع",
    });
  }
});

// GET /api/branches/:id - الحصول على فرع واحد
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            shipments: true,
          },
        },
      },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: "الفرع غير موجود",
      });
    }

    res.json({
      success: true,
      data: { branch },
    });
  } catch (error) {
    console.error("Get branch error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب الفرع",
    });
  }
});

// POST /api/branches - إنشاء فرع جديد (للمدراء فقط)
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بإنشاء فروع",
      });
    }

    const { name, location, manager, email, phone } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !location || !manager || !email) {
      return res.status(400).json({
        success: false,
        error: "الاسم والموقع والمدير والبريد الإلكتروني مطلوبة",
      });
    }

    // التحقق من أن اسم الفرع غير مستخدم
    const existingBranch = await prisma.branch.findUnique({
      where: { name },
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        error: "اسم الفرع مستخدم بالفعل",
      });
    }

    // التحقق من أن البريد الإلكتروني غير مستخدم
    const existingEmail = await prisma.branch.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "البريد الإلكتروني مستخدم بالفعل",
      });
    }

    // إنشاء الفرع
    const branch = await prisma.branch.create({
      data: {
        name,
        location,
        manager,
        email,
        phone,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "إنشاء فرع جديد",
        details: `تم إنشاء الفرع ${name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      success: true,
      data: { branch },
      message: "تم إنشاء الفرع بنجاح",
    });
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في إنشاء الفرع",
    });
  }
});

// PUT /api/branches/:id - تحديث فرع (للمدراء فقط)
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل الفروع",
      });
    }

    const { name, location, manager, email, phone, isActive } = req.body;

    const existingBranch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!existingBranch) {
      return res.status(404).json({
        success: false,
        error: "الفرع غير موجود",
      });
    }

    // التحقق من أن اسم الفرع غير مستخدم (إذا تم تغييره)
    if (name && name !== existingBranch.name) {
      const nameExists = await prisma.branch.findUnique({
        where: { name },
      });

      if (nameExists) {
        return res.status(400).json({
          success: false,
          error: "اسم الفرع مستخدم بالفعل",
        });
      }
    }

    // التحقق من أن البريد الإلكتروني غير مستخدم (إذا تم تغييره)
    if (email && email !== existingBranch.email) {
      const emailExists = await prisma.branch.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "البريد الإلكتروني مستخدم بالفعل",
        });
      }
    }

    // تحديث الفرع
    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        location,
        manager,
        email,
        phone,
        isActive,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "تحديث فرع",
        details: `تم تحديث الفرع ${updatedBranch.name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { branch: updatedBranch },
      message: "تم تحديث الفرع بنجاح",
    });
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث الفرع",
    });
  }
});

// DELETE /api/branches/:id - حذف فرع (للمدراء فقط)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من صلاحيات المدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بحذف الفروع",
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: "الفرع غير موجود",
      });
    }

    // التحقق من وجود مستخدمين مرتبطين بالفرع
    const usersCount = await prisma.user.count({
      where: { branchId: id },
    });

    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "لا يمكن حذف الفرع لوجود مستخدمين مرتبطين به. يمكنك إلغاء تفعيل الفرع بدلاً من الحذف.",
      });
    }

    // التحقق من وجود شحنات مرتبطة بالفرع
    const shipmentsCount = await prisma.shipment.count({
      where: { branchId: id },
    });

    if (shipmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "لا يمكن حذف الفرع لوجود شحنات مرتبطة به. يمكنك إلغاء تفعيل الفرع بدلاً من الحذف.",
      });
    }

    // حذف الفرع
    await prisma.branch.delete({
      where: { id },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "حذف فرع",
        details: `تم حذف الفرع ${branch.name}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم حذف الفرع بنجاح",
    });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في حذف الفرع",
    });
  }
});

// GET /api/branches/:id/stats - إحصائيات الفرع
router.get("/:id/stats", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من الصلاحيات
    if (user.role === "BRANCH" && user.branchId !== id) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بعرض إحصائيات هذا الفرع",
      });
    }

    const branch = await prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        error: "الفرع غير موجود",
      });
    }

    // جلب الإحصائيات
    const [
      totalShipments,
      activeShipments,
      deliveredShipments,
      cancelledShipments,
      totalUsers,
      thisMonthShipments,
    ] = await Promise.all([
      prisma.shipment.count({ where: { branchId: id } }),
      prisma.shipment.count({
        where: {
          branchId: id,
          status: { name: { in: ["في المستودع", "في الطريق", "وصلت للوجهة"] } },
        },
      }),
      prisma.shipment.count({
        where: {
          branchId: id,
          status: { name: "تم التسليم" },
        },
      }),
      prisma.shipment.count({
        where: {
          branchId: id,
          status: { name: "ملغي" },
        },
      }),
      prisma.user.count({ where: { branchId: id } }),
      prisma.shipment.count({
        where: {
          branchId: id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const stats = {
      totalShipments,
      activeShipments,
      deliveredShipments,
      cancelledShipments,
      totalUsers,
      thisMonthShipments,
      deliveryRate:
        totalShipments > 0
          ? ((deliveredShipments / totalShipments) * 100).toFixed(2)
          : "0",
    };

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    console.error("Get branch stats error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب إحصائيات الفرع",
    });
  }
});

export default router;
