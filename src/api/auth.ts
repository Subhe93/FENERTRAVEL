import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { authenticateUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// دالة لإنشاء JWT token
export function generateToken(userId: string): string {
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
export async function requireAuth(req: NextApiRequest): Promise<any> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("غير مصرح");
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  if (!decoded) {
    throw new Error("رمز غير صحيح");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { branch: true },
  });

  if (!user || !user.isActive) {
    throw new Error("مستخدم غير موجود أو غير نشط");
  }

  return user;
}

// دالة مساعدة لإرسال الردود
export function sendResponse(
  res: NextApiResponse,
  success: boolean,
  data?: any,
  error?: string,
  statusCode: number = 200
) {
  res.status(statusCode).json({
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
  });
}

// API handler لتسجيل الدخول
export async function loginHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return sendResponse(res, false, null, "طريقة غير مدعومة", 405);
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(
        res,
        false,
        null,
        "البريد الإلكتروني وكلمة المرور مطلوبان",
        400
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return sendResponse(res, false, null, "بيانات الدخول غير صحيحة", 401);
    }

    const token = generateToken(user.id);

    // تسجيل عملية تسجيل الدخول
    await prisma.logEntry.create({
      data: {
        type: "USER_ACTION",
        action: "تسجيل دخول",
        details: `تم تسجيل الدخول بنجاح`,
        userId: user.id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
    });

    sendResponse(res, true, { user, token });
  } catch (error) {
    console.error("Login error:", error);
    sendResponse(res, false, null, "خطأ في الخادم", 500);
  }
}

// API handler للحصول على المستخدم الحالي
export async function meHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return sendResponse(res, false, null, "طريقة غير مدعومة", 405);
  }

  try {
    const user = await requireAuth(req);
    sendResponse(res, true, { user });
  } catch (error) {
    console.error("Me error:", error);
    sendResponse(
      res,
      false,
      null,
      error instanceof Error ? error.message : "خطأ في المصادقة",
      401
    );
  }
}

// API handler لتسجيل الخروج
export async function logoutHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return sendResponse(res, false, null, "طريقة غير مدعومة", 405);
  }

  try {
    const user = await requireAuth(req);

    // تسجيل عملية تسجيل الخروج
    await prisma.logEntry.create({
      data: {
        type: "USER_ACTION",
        action: "تسجيل خروج",
        details: `تم تسجيل الخروج`,
        userId: user.id,
        ipAddress:
          (req.headers["x-forwarded-for"] as string) ||
          req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
    });

    sendResponse(res, true, { message: "تم تسجيل الخروج بنجاح" });
  } catch (error) {
    console.error("Logout error:", error);
    sendResponse(res, false, null, "خطأ في الخادم", 500);
  }
}
