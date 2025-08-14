import express from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "./auth";
import { shipmentService } from "../../lib/database";
import type { Prisma } from "@prisma/client";

// Define proper types for user and filters
interface AuthenticatedUser {
  id: string;
  role: "MANAGER" | "BRANCH" | "USER";
  branchId?: string;
}

interface ShipmentFilters {
  search?: string;
  shipmentNumber?: string;
  senderName?: string;
  senderPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  status?: string;
  branch?: string;
  paymentMethod?: string;
  originCountry?: string;
  destinationCountry?: string;
  content?: string;
  dateFrom?: string;
  dateTo?: string;
  weightFrom?: string;
  weightTo?: string;
  boxesFrom?: string;
  boxesTo?: string;
}

const router = express.Router();

// GET /api/shipments - الحصول على جميع الشحنات
router.get("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user as AuthenticatedUser;
    const {
      page = "1",
      limit = "25",
      search,
      shipmentNumber,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      status,
      branch,
      paymentMethod,
      originCountry,
      destinationCountry,
      content,
      dateFrom,
      dateTo,
      weightFrom,
      weightTo,
      boxesFrom,
      boxesTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query as ShipmentFilters & {
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: string;
    };

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    // بناء فلتر البحث
    const where: Prisma.ShipmentWhereInput = {};

    // إذا كان المستخدم موظف فرع، عرض شحنات فرعه فقط
    if (user.role === "BRANCH" && user.branchId) {
      where.branchId = user.branchId;
    }

    // فلتر الفرع (للمدراء فقط)
    if (branch && branch !== "all" && user.role === "MANAGER") {
      // التأكد من تحويل branch إلى string صحيح
      where.branchId = String(branch).trim();
    }

    // فلتر الحالة
    if (status && status !== "all") {
      where.statusId = String(status).trim();
    }

    // فلتر طريقة الدفع
    if (paymentMethod && paymentMethod !== "all") {
      where.paymentMethod = String(paymentMethod).trim() as any;
    }

    // فلتر بلد الأصل
    if (originCountry && originCountry !== "all") {
      where.originCountryId = String(originCountry).trim();
    }

    // فلتر بلد الوجهة
    if (destinationCountry && destinationCountry !== "all") {
      where.destinationCountryId = String(destinationCountry).trim();
    }

    // فلتر المحتوى
    if (content && content !== "all") {
      where.content = {
        contains: String(content).trim(),
        mode: "insensitive",
      };
    }

    // فلتر التاريخ
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const fromDate = new Date(String(dateFrom));
        if (!isNaN(fromDate.getTime())) {
          where.createdAt.gte = fromDate;
        }
      }
      if (dateTo) {
        const toDate = new Date(String(dateTo) + "T23:59:59");
        if (!isNaN(toDate.getTime())) {
          where.createdAt.lte = toDate;
        }
      }
    }

    // فلتر الوزن
    if (weightFrom || weightTo) {
      where.weight = {};
      if (weightFrom) {
        const weight = parseFloat(String(weightFrom));
        if (!isNaN(weight)) {
          where.weight.gte = weight;
        }
      }
      if (weightTo) {
        const weight = parseFloat(String(weightTo));
        if (!isNaN(weight)) {
          where.weight.lte = weight;
        }
      }
    }

    // فلتر عدد الصناديق
    if (boxesFrom || boxesTo) {
      where.numberOfBoxes = {};
      if (boxesFrom) {
        const boxes = parseInt(String(boxesFrom));
        if (!isNaN(boxes)) {
          where.numberOfBoxes.gte = boxes;
        }
      }
      if (boxesTo) {
        const boxes = parseInt(String(boxesTo));
        if (!isNaN(boxes)) {
          where.numberOfBoxes.lte = boxes;
        }
      }
    }

    // البحث النصي العام أو الفلاتر المحددة
    const searchConditions = [];

    if (search) {
      const searchTerm = String(search).trim();
      if (searchTerm) {
        searchConditions.push(
          { shipmentNumber: { contains: searchTerm, mode: "insensitive" } },
          { senderName: { contains: searchTerm, mode: "insensitive" } },
          { recipientName: { contains: searchTerm, mode: "insensitive" } },
          { senderPhone: { contains: searchTerm, mode: "insensitive" } },
          { recipientPhone: { contains: searchTerm, mode: "insensitive" } }
        );
      }
    }

    // فلاتر محددة
    if (shipmentNumber) {
      const term = String(shipmentNumber).trim();
      if (term) {
        searchConditions.push({
          shipmentNumber: { contains: term, mode: "insensitive" },
        });
      }
    }
    if (senderName) {
      const term = String(senderName).trim();
      if (term) {
        searchConditions.push({
          senderName: { contains: term, mode: "insensitive" },
        });
      }
    }
    if (senderPhone) {
      const term = String(senderPhone).trim();
      if (term) {
        searchConditions.push({
          senderPhone: { contains: term, mode: "insensitive" },
        });
      }
    }
    if (recipientName) {
      const term = String(recipientName).trim();
      if (term) {
        searchConditions.push({
          recipientName: { contains: term, mode: "insensitive" },
        });
      }
    }
    if (recipientPhone) {
      const term = String(recipientPhone).trim();
      if (term) {
        searchConditions.push({
          recipientPhone: { contains: term, mode: "insensitive" },
        });
      }
    }

    if (searchConditions.length > 0) {
      if (search) {
        // إذا كان هناك بحث عام، استخدم OR
        where.OR = searchConditions;
      } else {
        // إذا كانت فلاتر محددة، استخدم AND
        Object.assign(where, {
          ...(shipmentNumber && {
            shipmentNumber: {
              contains: String(shipmentNumber).trim(),
              mode: "insensitive",
            },
          }),
          ...(senderName && {
            senderName: {
              contains: String(senderName).trim(),
              mode: "insensitive",
            },
          }),
          ...(senderPhone && {
            senderPhone: {
              contains: String(senderPhone).trim(),
              mode: "insensitive",
            },
          }),
          ...(recipientName && {
            recipientName: {
              contains: String(recipientName).trim(),
              mode: "insensitive",
            },
          }),
          ...(recipientPhone && {
            recipientPhone: {
              contains: String(recipientPhone).trim(),
              mode: "insensitive",
            },
          }),
        });
      }
    }

    // إعداد الترتيب
    const orderBy: Record<string, unknown> = {};
    const validSortFields = [
      "createdAt",
      "shipmentNumber",
      "senderName",
      "recipientName",
      "weight",
      "numberOfBoxes",
      "status",
      "branchId",
      "paymentMethod",
      "originCountry",
      "destinationCountry",
      "content",
    ];

    if (validSortFields.includes(String(sortBy))) {
      if (sortBy === "status") {
        orderBy.status = { name: sortOrder === "asc" ? "asc" : "desc" };
      } else if (sortBy === "originCountry") {
        orderBy.originCountry = { name: sortOrder === "asc" ? "asc" : "desc" };
      } else if (sortBy === "destinationCountry") {
        orderBy.destinationCountry = {
          name: sortOrder === "asc" ? "asc" : "desc",
        };
      } else {
        orderBy[String(sortBy)] = sortOrder === "asc" ? "asc" : "desc";
      }
    } else {
      orderBy.createdAt = "desc";
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          branch: true,
          createdBy: {
            select: { id: true, name: true, email: true, role: true },
          },
          status: true,
          originCountry: true,
          destinationCountry: true,
          trackingEvents: {
            orderBy: { eventTime: "desc" },
            take: 5,
            include: {
              status: true,
              updatedBy: { select: { name: true } },
            },
          },
        },
        orderBy,
        skip,
        take: limitNumber,
      }),
      prisma.shipment.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    console.error("Get shipments error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب الشحنات",
    });
  }
});

// GET /api/shipments/:id - الحصول على شحنة واحدة
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const shipment = await shipmentService.getShipmentById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    // التحقق من الصلاحيات
    if (user.role === "BRANCH" && user.branchId !== shipment.branchId) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بعرض هذه الشحنة",
      });
    }

    res.json({
      success: true,
      data: { shipment },
    });
  } catch (error) {
    console.error("Get shipment error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب الشحنة",
    });
  }
});

// GET /api/shipments/track/:number - تتبع شحنة برقم الشحنة (عام - بدون مصادقة)
router.get("/track/:number", async (req, res) => {
  try {
    const { number } = req.params;

    const shipment = await shipmentService.getShipmentByNumber(number);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    // إرجاع بيانات محدودة للتتبع العام مع معلومات إضافية
    const publicData = {
      id: shipment.id,
      shipmentNumber: shipment.shipmentNumber,
      status: shipment.status,
      statusName: shipment.status?.name,
      statusId: shipment.statusId,
      originCountry: shipment.originCountry,
      destinationCountry: shipment.destinationCountry,
      expectedDeliveryDate: shipment.expectedDeliveryDate,
      receivingDate: shipment.receivingDate,
      weight: shipment.weight,
      numberOfBoxes: shipment.numberOfBoxes,
      content: shipment.content,
      senderName: shipment.senderName,
      senderPhone: shipment.senderPhone,
      senderAddress: shipment.senderAddress,
      senderEmail: shipment.senderEmail,
      recipientName: shipment.recipientName,
      recipientPhone: shipment.recipientPhone,
      recipientAddress: shipment.recipientAddress,
      recipientEmail: shipment.recipientEmail,
      branch: shipment.branch,
      branchName: shipment.branch?.name,
      notes: shipment.notes,
      paymentMethod: shipment.paymentMethod,
      createdAt: shipment.createdAt,
      trackingEvents: shipment.trackingEvents?.map((event) => ({
        description: event.description,
        location: event.location,
        eventTime: event.eventTime,
        statusId: event.statusId,
        status: event.status,
      })),
    };

    res.json({
      success: true,
      data: { shipment: publicData },
    });
  } catch (error) {
    console.error("Track shipment error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تتبع الشحنة",
    });
  }
});

// POST /api/shipments - إنشاء شحنة جديدة
router.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const shipmentData = req.body;

    // التحقق من البيانات المطلوبة
    const requiredFields = [
      "senderName",
      "senderPhone",
      "recipientName",
      "recipientPhone",
      "weight",
      "numberOfBoxes",
      "content",
      "paymentMethod",
      "receivingDate",
      "expectedDeliveryDate",
      "statusId",
      "originCountryId",
      "destinationCountryId",
    ];

    for (const field of requiredFields) {
      if (!shipmentData[field]) {
        return res.status(400).json({
          success: false,
          error: `الحقل ${field} مطلوب`,
        });
      }
    }

    // تحديد الفرع
    const branchId =
      user.role === "BRANCH" ? user.branchId : shipmentData.branchId;
    if (!branchId) {
      return res.status(400).json({
        success: false,
        error: "الفرع مطلوب",
      });
    }

    // إنشاء الشحنة
    const shipment = await shipmentService.createShipment({
      ...shipmentData,
      branchId,
      createdById: user.id,
      weight: parseFloat(shipmentData.weight),
      numberOfBoxes: parseInt(shipmentData.numberOfBoxes),
      shippingCost: shipmentData.shippingCost
        ? parseFloat(shipmentData.shippingCost)
        : undefined,
      paidAmount: shipmentData.paidAmount
        ? parseFloat(shipmentData.paidAmount)
        : 0,
      receivingDate: new Date(shipmentData.receivingDate),
      expectedDeliveryDate: new Date(shipmentData.expectedDeliveryDate),
      actualDeliveryDate: shipmentData.actualDeliveryDate
        ? new Date(shipmentData.actualDeliveryDate)
        : undefined,
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SHIPMENT_UPDATE",
        action: "إنشاء شحنة جديدة",
        details: `تم إنشاء الشحنة ${shipment.shipmentNumber}`,
        userId: user.id,
        shipmentId: shipment.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.status(201).json({
      success: true,
      data: { shipment },
      message: "تم إنشاء الشحنة بنجاح",
    });
  } catch (error) {
    console.error("Create shipment error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في إنشاء الشحنة",
    });
  }
});

// PUT /api/shipments/:id - تحديث شحنة
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const updates = req.body;

    // التحقق من وجود الشحنة
    const existingShipment = await prisma.shipment.findUnique({
      where: { id },
      include: { status: true },
    });

    if (!existingShipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    // التحقق من الصلاحيات
    if (user.role === "BRANCH" && user.branchId !== existingShipment.branchId) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل هذه الشحنة",
      });
    }

    // تحديث الشحنة
    const updatedShipment = await prisma.shipment.update({
      where: { id },
      data: {
        ...updates,
        weight: updates.weight ? parseFloat(updates.weight) : undefined,
        numberOfBoxes: updates.numberOfBoxes
          ? parseInt(updates.numberOfBoxes)
          : undefined,
        shippingCost: updates.shippingCost
          ? parseFloat(updates.shippingCost)
          : undefined,
        paidAmount: updates.paidAmount
          ? parseFloat(updates.paidAmount)
          : undefined,
        receivingDate: updates.receivingDate
          ? new Date(updates.receivingDate)
          : undefined,
        expectedDeliveryDate: updates.expectedDeliveryDate
          ? new Date(updates.expectedDeliveryDate)
          : undefined,
        actualDeliveryDate: updates.actualDeliveryDate
          ? new Date(updates.actualDeliveryDate)
          : undefined,
      },
      include: {
        branch: true,
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        status: true,
        originCountry: true,
        destinationCountry: true,
      },
    });

    // تسجيل التحديثات
    for (const [field, newValue] of Object.entries(updates)) {
      const oldValue = (existingShipment as any)[field];
      if (oldValue !== newValue && field !== "updatedAt") {
        await prisma.shipmentHistory.create({
          data: {
            shipmentId: id,
            userId: user.id,
            action: `تحديث ${field}`,
            field,
            oldValue: String(oldValue || ""),
            newValue: String(newValue || ""),
            statusId: updates.statusId || existingShipment.statusId,
          },
        });
      }
    }

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SHIPMENT_UPDATE",
        action: "تحديث شحنة",
        details: `تم تحديث الشحنة ${existingShipment.shipmentNumber}`,
        userId: user.id,
        shipmentId: id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      data: { shipment: updatedShipment },
      message: "تم تحديث الشحنة بنجاح",
    });
  } catch (error) {
    console.error("Update shipment error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث الشحنة",
    });
  }
});

// PATCH /api/shipments/bulk/status - تحديث حالة شحنات متعددة
router.patch("/bulk/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { shipmentIds, statusId, notes } = req.body;

    console.log("Bulk status update request:", {
      userId: user.id,
      shipmentIds,
      statusId,
      notes,
    });

    if (!statusId) {
      return res.status(400).json({
        success: false,
        error: "معرف الحالة مطلوب",
      });
    }

    if (
      !shipmentIds ||
      !Array.isArray(shipmentIds) ||
      shipmentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        error: "قائمة معرفات الشحنات مطلوبة",
      });
    }

    // التحقق من وجود الشحنات والصلاحيات
    const shipments = await prisma.shipment.findMany({
      where: { id: { in: shipmentIds } },
      include: { status: true },
    });

    if (shipments.length === 0) {
      return res.status(404).json({
        success: false,
        error: "لم يتم العثور على أي شحنات",
      });
    }

    // التحقق من الصلاحيات لكل شحنة
    const unauthorizedShipments = shipments.filter(
      (shipment) =>
        user.role === "BRANCH" && user.branchId !== shipment.branchId
    );

    if (unauthorizedShipments.length > 0) {
      return res.status(403).json({
        success: false,
        error: `غير مصرح لك بتعديل ${unauthorizedShipments.length} من الشحنات المحددة`,
      });
    }

    // تحديث حالات الشحنات
    const results: Array<{
      shipmentId: string;
      shipmentNumber: string;
      success: boolean;
    }> = [];
    const errors: Array<{
      shipmentId: string;
      shipmentNumber: string;
      error: string;
    }> = [];

    for (const shipment of shipments) {
      try {
        await shipmentService.updateShipmentStatus(
          shipment.id,
          statusId,
          user.id,
          notes
        );
        results.push({
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          success: true,
        });
      } catch (error) {
        console.error(
          `Failed to update shipment ${shipment.shipmentNumber}:`,
          error
        );
        errors.push({
          shipmentId: shipment.id,
          shipmentNumber: shipment.shipmentNumber,
          error: error instanceof Error ? error.message : "خطأ غير معروف",
        });
      }
    }

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SHIPMENT_UPDATE",
        action: "تحديث حالة شحنات متعددة",
        details: `تم تحديث حالة ${results.length} شحنة${
          results.length > 1 ? "" : ""
        }. فشل في تحديث ${errors.length} شحنة${errors.length > 1 ? "" : ""}.`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: `تم تحديث ${results.length} شحنة بنجاح${
        errors.length > 0 ? `. فشل في تحديث ${errors.length} شحنة.` : ""
      }`,
      data: {
        updated: results,
        errors: errors,
        totalProcessed: shipments.length,
        successCount: results.length,
        errorCount: errors.length,
      },
    });
  } catch (error) {
    console.error("Bulk update shipment status error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في تحديث حالات الشحنات",
    });
  }
});

// PATCH /api/shipments/:id/status - تحديث حالة الشحنة
router.patch("/:id/status", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { statusId, notes } = req.body;

    if (!statusId) {
      return res.status(400).json({
        success: false,
        error: "معرف الحالة مطلوب",
      });
    }

    // التحقق من وجود الشحنة
    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    // التحقق من الصلاحيات
    if (user.role === "BRANCH" && user.branchId !== shipment.branchId) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بتعديل هذه الشحنة",
      });
    }

    // تحديث حالة الشحنة
    await shipmentService.updateShipmentStatus(id, statusId, user.id, notes);
    // جلب اسم الحالة بدلاً من الـ id
    const status = await prisma.shipmentStatus.findUnique({
      where: { id: statusId },
      select: { name: true },
    });

    await prisma.logEntry.create({
      data: {
        type: "SHIPMENT_UPDATE",
        action: "تحديث حالة شحنة",
        details: `تم تحديث حالة الشحنة ${shipment.shipmentNumber} إلى الحالة ${
          status?.name ?? statusId
        }`,
        userId: user.id,
        shipmentId: id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم تحديث حالة الشحنة بنجاح",
    });
  } catch (error) {
    console.error("Update shipment status error:", error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : "خطأ في تحديث حالة الشحنة",
    });
  }
});

// DELETE /api/shipments/:id - حذف شحنة
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من أن المستخدم مدير
    if (user.role !== "MANAGER") {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بحذف الشحنات",
      });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    // حذف الشحنة (سيتم حذف البيانات المرتبطة تلقائياً بسبب Cascade)
    await prisma.shipment.delete({
      where: { id },
    });

    // تسجيل العملية
    await prisma.logEntry.create({
      data: {
        type: "SHIPMENT_UPDATE",
        action: "حذف شحنة",
        details: `تم حذف الشحنة ${shipment.shipmentNumber}`,
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      message: "تم حذف الشحنة بنجاح",
    });
  } catch (error) {
    console.error("Delete shipment error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في حذف الشحنة",
    });
  }
});

// GET /api/shipments/:id/history - الحصول على تاريخ الشحنة
router.get("/:id/history", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من وجود الشحنة والصلاحيات
    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    if (user.role === "BRANCH" && user.branchId !== shipment.branchId) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بعرض تاريخ هذه الشحنة",
      });
    }

    const history = await prisma.shipmentHistory.findMany({
      where: { shipmentId: id },
      include: {
        user: { select: { name: true } },
        status: true,
      },
      orderBy: { timestamp: "desc" },
    });

    res.json({
      success: true,
      data: { history },
    });
  } catch (error) {
    console.error("Get shipment history error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب تاريخ الشحنة",
    });
  }
});

// GET /api/shipments/:id/tracking - الحصول على أحداث التتبع
router.get("/:id/tracking", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // التحقق من وجود الشحنة والصلاحيات
    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "الشحنة غير موجودة",
      });
    }

    if (user.role === "BRANCH" && user.branchId !== shipment.branchId) {
      return res.status(403).json({
        success: false,
        error: "غير مصرح لك بعرض تتبع هذه الشحنة",
      });
    }

    const trackingEvents = await prisma.trackingEvent.findMany({
      where: { shipmentId: id },
      include: {
        status: true,
        updatedBy: { select: { name: true } },
      },
      orderBy: { eventTime: "desc" },
    });

    res.json({
      success: true,
      data: { trackingEvents },
    });
  } catch (error) {
    console.error("Get tracking events error:", error);
    res.status(500).json({
      success: false,
      error: "خطأ في جلب أحداث التتبع",
    });
  }
});

export default router;
