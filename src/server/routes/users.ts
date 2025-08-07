import express from "express";
import { prisma } from "../../lib/prisma";
import { hashPassword } from "../../lib/auth";
import { requireAuth } from "./auth";

const router = express.Router();

// Middleware للتحقق من صلاحيات المدير
const requireManager = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const user = (req as any).user;
  if (user.role !== "MANAGER") {
    return res.status(403).json({
      success: false,
      error: "غير مصرح لك بهذه العملية",
    });
  }
  next();
};

// GET /api/users - الحصول على جميع المستخدمين (للمدراء فقط)
router.get("/", requireAuth, requireManager, async (req, res) => {
  try {
    const { page = "1", limit = "20", search, role, branchId } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // بناء فلتر البحث
    const where: any = {};

    // فلتر الدور
    if (role) {
      where.role = role;
    }

    // فلتر الفرع
    if (branchId) {
      where.branchId = branchId;
    }

    // البحث النصي
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          branch: true,
          _count: {
            select: {
              createdShipments: true,
              logEntries: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNumber,
      }),
      prisma.user.count({ where }),
    ]);

    // إزالة كلمات المرور من الاستجابة
    const safeUsers = users.map((user) => {
      const { password, ...safeUser } = user;
      return safeUser;
    });

    res.json({
      success: true,
      data: {
        users: safeUsers,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب المستخدمين",
    });
  }
});

// GET /api/users/:id - الحصول على مستخدم واحد
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    // المدراء يمكنهم رؤية جميع المستخدمين، الموظفون يمكنهم رؤية بياناتهم فقط
    if (currentUser.role !== "MANAGER" && currentUser.id !== id) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بعرض هذا المستخدم",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        branch: true,
        _count: {
          select: {
            createdShipments: true,
            logEntries: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "المستخدم غير موجود",
      });
    }

    // إزالة كلمة المرور من الاستجابة
    const { password, ...safeUser } = user;

    res.json({
      success: true,
      data: { user: safeUser },
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب المستخدم",
    });
  }
});

// POST /api/users - إنشاء مستخدم جديد (للمدراء فقط)
router.post("/", requireAuth, requireManager, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { name, email, password, role, branchId } = req.body;

    // التحقق من البيانات المطلوبة
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: "الاسم والبريد الإلكتروني وكلمة المرور والدور مطلوبة",
      });
    }

    // التحقق من أن البريد الإلكتروني غير مستخدم
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "البريد الإلكتروني مستخدم بالفعل",
      });
    }

    // التحقق من الفرع إذا كان الدور BRANCH
    if (role === "BRANCH" && !branchId) {
      return res.status(400).json({
        success: false,
        error: "الفرع مطلوب لموظفي الفروع",
      });
    }

    if (role === "BRANCH" && branchId) {
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch) {
        return res.status(400).json({
          success: false,
          error: "الفرع غير موجود",
        });
      }
    }

    // تشفير كلمة المرور
    const hashedPassword = await hashPassword(password);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        branchId: role === "BRANCH" ? branchId : null,
      },
      include: {
        branch: true,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "إنشاء مستخدم جديد",
        details: `تم إنشاء المستخدم ${name} (${email})`,
        userId: currentUser.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    // إزالة كلمة المرور من الاستجابة
    const { password: _, ...safeUser } = user;

    res.status(201).json({
      success: true,
      data: { user: safeUser },
      message: "تم إنشاء المستخدم بنجاح",
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في إنشاء المستخدم",
    });
  }
});

// PUT /api/users/:id - تحديث مستخدم
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;
    const { name, email, role, branchId, isActive, password } = req.body;

    // التحقق من الصلاحيات
    if (currentUser.role !== "MANAGER" && currentUser.id !== id) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل هذا المستخدم",
      });
    }

    // الموظفون لا يمكنهم تغيير الدور أو الفرع أو حالة النشاط
    if (
      currentUser.role !== "MANAGER" &&
      (role || branchId || isActive !== undefined)
    ) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل هذه البيانات",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: "المستخدم غير موجود",
      });
    }

    // التحقق من أن البريد الإلكتروني غير مستخدم (إذا تم تغييره)
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: "البريد الإلكتروني مستخدم بالفعل",
        });
      }
    }

    // إعداد البيانات للتحديث
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (currentUser.role === "MANAGER") {
      if (role) updateData.role = role;
      if (branchId) updateData.branchId = branchId;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // تشفير كلمة المرور الجديدة إذا تم توفيرها
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        branch: true,
      },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "تحديث مستخدم",
        details: `تم تحديث المستخدم ${updatedUser.name} (${updatedUser.email})`,
        userId: currentUser.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    // إزالة كلمة المرور من الاستجابة
    const { password: _, ...safeUser } = updatedUser;

    res.json({
      success: true,
      data: { user: safeUser },
      message: "تم تحديث المستخدم بنجاح",
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث المستخدم",
    });
  }
});

// DELETE /api/users/:id - حذف مستخدم (للمدراء فقط)
router.delete("/:id", requireAuth, requireManager, async (req, res) => {
  try {
    const currentUser = (req as any).user;
    const { id } = req.params;

    // منع المستخدم من حذف نفسه
    if (currentUser.id === id) {
      return res.status(400).json({
        success: false,
        error: "لا يمكنك حذف حسابك الخاص",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "المستخدم غير موجود",
      });
    }

    // التحقق من وجود شحنات مرتبطة بالمستخدم
    const shipmentsCount = await prisma.shipment.count({
      where: { createdById: id },
    });

    if (shipmentsCount > 0) {
      return res.status(400).json({
        success: false,
        error:
          "لا يمكن حذف المستخدم لوجود شحنات مرتبطة به. يمكنك إلغاء تفعيل الحساب بدلاً من الحذف.",
      });
    }

    // حذف المستخدم
    await prisma.user.delete({
      where: { id },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SYSTEM_ACTION",
        action: "حذف مستخدم",
        details: `تم حذف المستخدم ${user.name} (${user.email})`,
        userId: currentUser.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم حذف المستخدم بنجاح",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في حذف المستخدم",
    });
  }
});

export default router;
