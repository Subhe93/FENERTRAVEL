import { prisma } from "./prisma";
import type {
  // User,
  Branch,
  Country,
  ShipmentStatus,
  Shipment,
  ShipmentHistory,
  // LogEntry,
  TrackingEvent,
  Invoice,
  Waybill,
} from "@prisma/client";

// نوع موسع للشحنة مع العلاقات
export type ShipmentWithRelations = Shipment & {
  branch: Branch;
  createdBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: ShipmentStatus;
  originCountry: Country;
  destinationCountry: Country;
  histories?: ShipmentHistory[];
  trackingEvents?: TrackingEvent[];
  invoice?: Invoice | null;
  waybill?: Waybill | null;
};

// خدمات قاعدة البيانات للشحنات
export const shipmentService = {
  // الحصول على جميع الشحنات مع العلاقات
  async getAllShipments(): Promise<any[]> {
    return prisma.shipment.findMany({
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        status: true,
        originCountry: true,
        destinationCountry: true,
        trackingEvents: {
          orderBy: { eventTime: "desc" },
          take: 5,
          include: {
            status: true,
            updatedBy: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  // الحصول على شحنة واحدة بالمعرف
  async getShipmentById(id: string): Promise<ShipmentWithRelations | null> {
    return prisma.shipment.findUnique({
      where: { id },
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        status: true,
        originCountry: true,
        destinationCountry: true,
        histories: {
          orderBy: { timestamp: "desc" },
          include: {
            user: {
              select: { name: true },
            },
            status: true,
          },
        },
        trackingEvents: {
          orderBy: { eventTime: "desc" },
          include: {
            status: true,
            updatedBy: {
              select: { name: true },
            },
          },
        },
        invoice: true,
        waybill: true,
      },
    });
  },

  // البحث عن شحنة برقم الشحنة
  async getShipmentByNumber(
    shipmentNumber: string
  ): Promise<ShipmentWithRelations | null> {
    return prisma.shipment.findUnique({
      where: { shipmentNumber },
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        status: true,
        originCountry: true,
        destinationCountry: true,
        trackingEvents: {
          orderBy: { eventTime: "desc" },
          include: {
            status: true,
            updatedBy: {
              select: { name: true },
            },
          },
        },
      },
    });
  },

  // إنشاء شحنة جديدة
  async createShipment(data: any): Promise<any> {
    // توليد رقم شحنة جديد - العثور على أعلى رقم موجود
    const allShipments = await prisma.shipment.findMany({
      select: { shipmentNumber: true },
    });

    let nextNumber = 1;
    if (allShipments.length > 0) {
      // استخراج جميع الأرقام وإيجاد الأعلى
      const numbers = allShipments
        .map((s) => {
          const match = s.shipmentNumber.match(/FEN(\d+)/);
          return match ? parseInt(match[1]) : 0;
        })
        .filter((n) => !isNaN(n));

      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }

    const shipmentNumber = `FEN${nextNumber.toString().padStart(9, "0")}`;

    // Extract only valid Prisma fields
    const shipmentData = {
      branchId: data.branchId,
      createdById: data.createdById,
      statusId: data.statusId,
      originCountryId: data.originCountryId,
      destinationCountryId: data.destinationCountryId,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      senderEmail: data.senderEmail,
      senderAddress: data.senderAddress,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      recipientEmail: data.recipientEmail,
      recipientAddress: data.recipientAddress,
      weight: data.weight,
      numberOfBoxes: data.numberOfBoxes,
      content: data.content,
      paymentMethod: data.paymentMethod,
      receivingDate: new Date(data.receivingDate),
      expectedDeliveryDate: new Date(data.expectedDeliveryDate),
      shippingCost: data.shippingCost || null,
      paidAmount: data.paidAmount || 0,
      paymentStatus: data.paymentStatus || "PENDING",
      notes: data.notes || null,
      shipmentNumber,
    };

    const shipment = await prisma.shipment.create({
      data: shipmentData,
      include: {
        branch: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        status: true,
        originCountry: true,
        destinationCountry: true,
      },
    });

    // إضافة حدث تتبع أولي
    await prisma.trackingEvent.create({
      data: {
        shipmentId: shipment.id,
        statusId: data.statusId,
        location: shipment.branch.name,
        description: "تم إنشاء الشحنة",
        eventTime: new Date(),
        updatedById: data.createdById,
      },
    });

    return shipment;
  },

  // تحديث حالة الشحنة
  async updateShipmentStatus(
    id: string,
    statusId: string,
    updatedById: string,
    notes?: string
  ): Promise<void> {
    const shipment = await prisma.shipment.findUnique({
      where: { id },
      include: { status: true },
    });

    if (!shipment) {
      throw new Error("الشحنة غير موجودة");
    }

    const newStatus = await prisma.shipmentStatus.findUnique({
      where: { id: statusId },
    });

    if (!newStatus) {
      throw new Error("الحالة غير صحيحة");
    }

    // تحديث الشحنة
    await prisma.shipment.update({
      where: { id },
      data: { statusId },
    });

    // إضافة سجل في التاريخ
    await prisma.shipmentHistory.create({
      data: {
        shipmentId: id,
        userId: updatedById,
        action: "تحديث الحالة",
        field: "status",
        oldValue: shipment.status.name,
        newValue: newStatus.name,
        statusId: statusId,
        notes,
      },
    });

    // إضافة حدث تتبع
    await prisma.trackingEvent.create({
      data: {
        shipmentId: id,
        statusId: statusId,
        description: `تم تحديث الحالة إلى: ${newStatus.name}`,
        eventTime: new Date(),
        updatedById,
        notes,
      },
    });
  },
};

// خدمات أخرى
export const branchService = {
  async getAllBranches() {
    return prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  },
};

export const countryService = {
  async getAllCountries() {
    return prisma.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  },
};

export const statusService = {
  async getAllStatuses() {
    return prisma.shipmentStatus.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
  },
};
