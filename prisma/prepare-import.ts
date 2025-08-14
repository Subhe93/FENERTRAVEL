import { PrismaClient, UserRole, CountryType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 تحضير قاعدة البيانات لاستيراد البيانات...");

  try {
    // إنشاء البلدان الأساسية
    const basicCountries = [
      { name: "سوريا", code: "SY", flag: "🇸🇾" },
      { name: "روجافا", code: "RJ", flag: "" },
      { name: "المانيا", code: "DE", flag: "🇩🇪" },
      { name: "سويسرا", code: "CH", flag: "🇨🇭" },
      { name: "النمسا", code: "AT", flag: "🇦🇹" },
      { name: "هولندا", code: "NL", flag: "🇳🇱" },
      { name: "بلجيكا", code: "BE", flag: "🇧🇪" },
      { name: "فرنسا", code: "FR", flag: "🇫🇷" },
      { name: "السويد", code: "SE", flag: "🇸🇪" },
      { name: "النرويج", code: "NO", flag: "🇳🇴" },
      { name: "الدنمارك", code: "DK", flag: "🇩🇰" }
    ];

    console.log("🌍 إنشاء البلدان الأساسية...");
    for (const countryData of basicCountries) {
      const existing = await prisma.country.findFirst({
        where: { name: countryData.name }
      });

      if (!existing) {
        await prisma.country.create({
          data: {
            name: countryData.name,
            code: countryData.code,
            flag: countryData.flag || null,
            type: CountryType.BOTH,
            isActive: true
          }
        });
        console.log(`✅ تم إنشاء البلد: ${countryData.name}`);
      }
    }

    // إنشاء حالات الشحنة الأساسية
    const basicStatuses = [
      { name: "قيد المراجعة", color: "#f59e0b", description: "الشحنة قيد المراجعة", order: 0 },
      { name: "تم الاستلام", color: "#3b82f6", description: "تم استلام الشحنة", order: 1 },
      { name: "في المستودع", color: "#6366f1", description: "الشحنة في المستودع", order: 2 },
      { name: "في الطريق", color: "#f59e0b", description: "الشحنة في الطريق", order: 3 },
      { name: "وصلت للوجهة", color: "#8b5cf6", description: "الشحنة وصلت للوجهة", order: 4 },
      { name: "جاهزة للتسليم", color: "#06b6d4", description: "الشحنة جاهزة للتسليم", order: 5 },
      { name: "تم التسليم", color: "#10b981", description: "تم تسليم الشحنة", order: 6 },
      { name: "ملغية", color: "#ef4444", description: "تم إلغاء الشحنة", order: -1 },
      { name: "مؤجلة", color: "#6b7280", description: "الشحنة مؤجلة", order: -2 }
    ];

    console.log("📋 إنشاء حالات الشحنة...");
    for (const statusData of basicStatuses) {
      const existing = await prisma.shipmentStatus.findFirst({
        where: { name: statusData.name }
      });

      if (!existing) {
        await prisma.shipmentStatus.create({
          data: statusData
        });
        console.log(`✅ تم إنشاء الحالة: ${statusData.name}`);
      }
    }

    // إنشاء الفروع الأساسية
    const basicBranches = [
      {
        name: "الفرع الرئيسي",
        location: "المكتب الرئيسي",
        manager: "إدارة النظام",
        email: "main@fenertravel.com",
        phone: "+000000000000"
      },
      {
        name: "فرع أوروبا",
        location: "أوروبا",
        manager: "مدير أوروبا",
        email: "europe@fenertravel.com",
        phone: "+000000000001"
      },
      {
        name: "فرع سوريا",
        location: "سوريا",
        manager: "مدير سوريا",
        email: "syria@fenertravel.com",
        phone: "+963000000000"
      }
    ];

    console.log("🏢 إنشاء الفروع...");
    for (const branchData of basicBranches) {
      const existing = await prisma.branch.findFirst({
        where: { name: branchData.name }
      });

      if (!existing) {
        await prisma.branch.create({
          data: branchData
        });
        console.log(`✅ تم إنشاء الفرع: ${branchData.name}`);
      }
    }

    // إنشاء المستخدمين الأساسيين
    const hashedPassword = await bcrypt.hash("123456", 10);
    const mainBranch = await prisma.branch.findFirst({ where: { name: "الفرع الرئيسي" } });

    const basicUsers = [
      {
        name: "مدير النظام",
        email: "admin@fenertravel.com",
        password: hashedPassword,
        role: UserRole.MANAGER,
        branchId: mainBranch?.id
      },
      {
        name: "مستخدم النظام",
        email: "system@fenertravel.com",
        password: hashedPassword,
        role: UserRole.MANAGER,
        branchId: mainBranch?.id
      }
    ];

    console.log("👥 إنشاء المستخدمين...");
    for (const userData of basicUsers) {
      const existing = await prisma.user.findFirst({
        where: { email: userData.email }
      });

      if (!existing) {
        await prisma.user.create({
          data: userData
        });
        console.log(`✅ تم إنشاء المستخدم: ${userData.name}`);
      }
    }

    console.log("\n🎉 تم تحضير قاعدة البيانات بنجاح!");
    console.log("📝 يمكنك الآن تشغيل عملية الاستيراد باستخدام: yarn db:import-csv");
    
    // طباعة إحصائيات
    const countriesCount = await prisma.country.count();
    const statusesCount = await prisma.shipmentStatus.count();
    const branchesCount = await prisma.branch.count();
    const usersCount = await prisma.user.count();
    
    console.log("\n📊 الإحصائيات الحالية:");
    console.log(`   البلدان: ${countriesCount}`);
    console.log(`   حالات الشحنة: ${statusesCount}`);
    console.log(`   الفروع: ${branchesCount}`);
    console.log(`   المستخدمين: ${usersCount}`);

  } catch (error) {
    console.error("❌ خطأ في تحضير قاعدة البيانات:", error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🔌 تم قطع الاتصال بقاعدة البيانات");
  })
  .catch(async (e) => {
    console.error("❌ خطأ نهائي:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
