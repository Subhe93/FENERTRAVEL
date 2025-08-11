import express from "express";
import jwt from "jsonwebtoken";
import { authenticateUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// دالة لإنشاء JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

// دالة للتحقق من JWT token
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

// Middleware للتحقق من المصادقة
export async function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "غير مصرح" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: "رمز غير صحيح" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { branch: true },
    });

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, error: "مستخدم غير موجود أو غير نشط" });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, error: "خطأ في المصادقة" });
  }
}

// POST /api/auth/login - تسجيل الدخول
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "البريد الإلكتروني وكلمة المرور مطلوبان",
      });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "بيانات الدخول غير صحيحة",
      });
    }

    const token = generateToken(user.id);

    // تسجيل عملية تسجيل الدخول
    await prisma.logEntry.create({
      data: {
        type: "USER_ACTION",
        action: "تسجيل دخول",
        details: `تم تسجيل الدخول بنجاح`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { user, token },
      message: "تم تسجيل الدخول بنجاح",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في الخادم",
    });
  }
});

// GET /api/auth/me - الحصول على المستخدم الحالي
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في الخادم",
    });
  }
});

// POST /api/auth/logout - تسجيل الخروج
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;

    // تسجيل عملية تسجيل الخروج
    await prisma.logEntry.create({
      data: {
        type: "USER_ACTION",
        action: "تسجيل خروج",
        details: `تم تسجيل الخروج`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في الخادم",
    });
  }
});

export default router;
