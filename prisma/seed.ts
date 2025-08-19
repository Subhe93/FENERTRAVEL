import {
  PrismaClient,
  UserRole,
  PaymentMethod,
  PaymentStatus,
  CountryType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 بدء تعبئة قاعدة البيانات...");

  // تنظيف البيانات الموجودة
  await prisma.logEntry.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.shipmentHistory.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.waybill.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.country.deleteMany();
  await prisma.shipmentStatus.deleteMany();

  // إنشاء البلدان
  const countries = await Promise.all([
    prisma.country.create({
      data: {
        name: "السعودية",
        code: "SA",
        flag: "🇸🇦",
        type: CountryType.BOTH,
      },
    }),
    prisma.country.create({
      data: {
        name: "الإمارات العربية المتحدة",
        code: "AE",
        flag: "🇦🇪",
        type: CountryType.BOTH,
      },
    }),
    prisma.country.create({
      data: {
        name: "الكويت",
        code: "KW",
        flag: "🇰🇼",
        type: CountryType.BOTH,
      },
    }),
    prisma.country.create({
      data: {
        name: "قطر",
        code: "QA",
        flag: "🇶🇦",
        type: CountryType.BOTH,
      },
    }),
    prisma.country.create({
      data: {
        name: "البحرين",
        code: "BH",
        flag: "🇧🇭",
        type: CountryType.BOTH,
      },
    }),
    prisma.country.create({
      data: {
        name: "عُمان",
        code: "OM",
        flag: "🇴🇲",
        type: CountryType.BOTH,
      },
    }),
  ]);

  console.log("✅ تم إنشاء البلدان");

  // إنشاء حالات الشحنة
  const statuses = await Promise.all([
    prisma.shipmentStatus.create({
      data: {
        name: "في المستودع",
        color: "#6366f1",
        description: "الشحنة وصلت إلى المستودع",
        order: 1,
      },
    }),
    prisma.shipmentStatus.create({
      data: {
        name: "في الطريق",
        color: "#f59e0b",
        description: "الشحنة في الطريق للوجهة",
        order: 2,
      },
    }),
    prisma.shipmentStatus.create({
      data: {
        name: "وصلت للوجهة",
        color: "#8b5cf6",
        description: "الشحنة وصلت لمكان الوجهة",
        order: 3,
      },
    }),
    prisma.shipmentStatus.create({
      data: {
        name: "تم التسليم",
        color: "#10b981",
        description: "تم تسليم الشحنة للمستلم",
        order: 4,
      },
    }),
    prisma.shipmentStatus.create({
      data: {
        name: "ملغي",
        color: "#ef4444",
        description: "تم إلغاء الشحنة",
        order: 0,
      },
    }),
  ]);

  console.log("✅ تم إنشاء حالات الشحنة");

  // إنشاء الفروع
  const branches = await Promise.all([
    prisma.branch.create({
      data: {
        name: "فرع الرياض",
        location: "الرياض، المملكة العربية السعودية",
        manager: "أحمد محمد",
        email: "riyadh@fenertravel.com",
        phone: "+966112345678",
      },
    }),
    prisma.branch.create({
      data: {
        name: "فرع جدة",
        location: "جدة، المملكة العربية السعودية",
        manager: "فاطمة علي",
        email: "jeddah@fenertravel.com",
        phone: "+966122345678",
      },
    }),
    prisma.branch.create({
      data: {
        name: "فرع دبي",
        location: "دبي، الإمارات العربية المتحدة",
        manager: "محمد خالد",
        email: "dubai@fenertravel.com",
        phone: "+971501234567",
      },
    }),
  ]);

  console.log("✅ تم إنشاء الفروع");

  // إنشاء المستخدمين
  const hashedPassword = await bcrypt.hash("123456", 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "مدير النظام",
        email: "admin@fenertravel.com",
        password: hashedPassword,
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.create({
      data: {
        name: "أحمد محمد",
        email: "ahmed@fenertravel.com",
        password: hashedPassword,
        role: UserRole.BRANCH,
        branchId: branches[0].id,
      },
    }),
    prisma.user.create({
      data: {
        name: "فاطمة علي",
        email: "fatima@fenertravel.com",
        password: hashedPassword,
        role: UserRole.BRANCH,
        branchId: branches[1].id,
      },
    }),
    prisma.user.create({
      data: {
        name: "محمد خالد",
        email: "mohammed@fenertravel.com",
        password: hashedPassword,
        role: UserRole.BRANCH,
        branchId: branches[2].id,
      },
    }),
  ]);

  console.log("✅ تم إنشاء المستخدمين");

  // إنشاء شحنات تجريبية
  const shipments = await Promise.all([
    prisma.shipment.create({
      data: {
        shipmentNumber: "FEN000001001",
        branchId: branches[0].id,
        createdById: users[1].id,
        statusId: statuses[1].id, // في الطريق
        originCountryId: countries[0].id, // السعودية
        destinationCountryId: countries[1].id, // الإمارات
        senderName: "محمد أحمد السالم",
        senderPhone: "+966501234567",
        senderEmail: "mohammed.salem@example.com",
        senderAddress: "الرياض، حي النخيل، شارع الملك فهد",
        recipientName: "سارة محمد العلي",
        recipientPhone: "+971501234567",
        recipientEmail: "sara.ali@example.com",
        recipientAddress: "دبي، منطقة ديرة، شارع الاتحاد",
        weight: 2.5,
        numberOfBoxes: 1,
        content: "مستندات ووثائق",
        paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
        receivingDate: new Date("2024-01-15"),
        expectedDeliveryDate: new Date("2024-01-17"),
        shippingCost: 150.0,
        paidAmount: 0,
        paymentStatus: PaymentStatus.PENDING,
        notes: "يرجى التعامل بحذر - مستندات مهمة",
      },
    }),
    prisma.shipment.create({
      data: {
        shipmentNumber: "FEN000001002",
        branchId: branches[1].id,
        createdById: users[2].id,
        statusId: statuses[3].id, // تم التسليم
        originCountryId: countries[0].id, // السعودية
        destinationCountryId: countries[2].id, // الكويت
        senderName: "عبدالله حسن",
        senderPhone: "+966502345678",
        senderEmail: "abdullah.hassan@example.com",
        senderAddress: "جدة، حي البلد، شارع قابل",
        recipientName: "نورا عبدالرحمن",
        recipientPhone: "+96550123456",
        recipientEmail: "nora.abdulrahman@example.com",
        recipientAddress: "الكويت، منطقة السالمية، شارع الخليج",
        weight: 5.0,
        numberOfBoxes: 2,
        content: "هدايا وملابس",
        paymentMethod: PaymentMethod.PREPAID,
        receivingDate: new Date("2024-01-10"),
        expectedDeliveryDate: new Date("2024-01-12"),
        actualDeliveryDate: new Date("2024-01-12"),
        shippingCost: 280.0,
        paidAmount: 280.0,
        paymentStatus: PaymentStatus.PAID,
        notes: "",
      },
    }),
  ]);

  console.log("✅ تم إنشاء الشحنات التجريبية");

  // إنشاء سجل التتبع
  await Promise.all([
    prisma.trackingEvent.create({
      data: {
        shipmentId: shipments[0].id,
        statusId: statuses[0].id,
        location: "مستودع الرياض",
        description: "تم استلام الشحنة في المستودع",
        eventTime: new Date("2024-01-15T09:00:00"),
        updatedById: users[1].id,
      },
    }),
    prisma.trackingEvent.create({
      data: {
        shipmentId: shipments[0].id,
        statusId: statuses[1].id,
        location: "في الطريق إلى دبي",
        description: "تم شحن الطرد متجهاً إلى دبي",
        eventTime: new Date("2024-01-15T14:00:00"),
        updatedById: users[1].id,
      },
    }),
  ]);

  console.log("✅ تم إنشاء أحداث التتبع");

  // إنشاء الفواتير
  await prisma.invoice.create({
    data: {
      shipmentId: shipments[1].id,
      invoiceNumber: "INV-2024-001",
      totalAmount: 280.0,
      taxAmount: 42.0,
      discountAmount: 0,
      status: "PAID",
      issueDate: new Date("2024-01-10"),
      dueDate: new Date("2024-01-17"),
      paidDate: new Date("2024-01-10"),
      notes: "تم الدفع مقدماً",
    },
  });

  console.log("✅ تم إنشاء الفواتير");

  console.log("🎉 تم الانتهاء من تعبئة قاعدة البيانات بنجاح!");
  console.log("📧 بيانات تسجيل الدخول:");
  console.log("   المدير: admin@fenertravel.com / 123456");
  console.log("   موظف فرع: ahmed@fenertravel.com / 123456");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
