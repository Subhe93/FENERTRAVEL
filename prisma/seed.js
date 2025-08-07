"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var countries, statuses, branches, hashedPassword, users, shipments;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("🌱 بدء تعبئة قاعدة البيانات...");
                    // تنظيف البيانات الموجودة
                    return [4 /*yield*/, prisma.logEntry.deleteMany()];
                case 1:
                    // تنظيف البيانات الموجودة
                    _a.sent();
                    return [4 /*yield*/, prisma.trackingEvent.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.shipmentHistory.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.invoice.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.waybill.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.shipment.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.user.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.branch.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.country.deleteMany()];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, prisma.shipmentStatus.deleteMany()];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.country.create({
                                data: {
                                    name: "السعودية",
                                    code: "SA",
                                    flag: "🇸🇦",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                            prisma.country.create({
                                data: {
                                    name: "الإمارات العربية المتحدة",
                                    code: "AE",
                                    flag: "🇦🇪",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                            prisma.country.create({
                                data: {
                                    name: "الكويت",
                                    code: "KW",
                                    flag: "🇰🇼",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                            prisma.country.create({
                                data: {
                                    name: "قطر",
                                    code: "QA",
                                    flag: "🇶🇦",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                            prisma.country.create({
                                data: {
                                    name: "البحرين",
                                    code: "BH",
                                    flag: "🇧🇭",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                            prisma.country.create({
                                data: {
                                    name: "عُمان",
                                    code: "OM",
                                    flag: "🇴🇲",
                                    type: client_1.CountryType.BOTH,
                                },
                            }),
                        ])];
                case 11:
                    countries = _a.sent();
                    console.log("✅ تم إنشاء البلدان");
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 12:
                    statuses = _a.sent();
                    console.log("✅ تم إنشاء حالات الشحنة");
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 13:
                    branches = _a.sent();
                    console.log("✅ تم إنشاء الفروع");
                    return [4 /*yield*/, bcryptjs_1.default.hash("123456", 10)];
                case 14:
                    hashedPassword = _a.sent();
                    return [4 /*yield*/, Promise.all([
                            prisma.user.create({
                                data: {
                                    name: "مدير النظام",
                                    email: "admin@fenertravel.com",
                                    password: hashedPassword,
                                    role: client_1.UserRole.MANAGER,
                                },
                            }),
                            prisma.user.create({
                                data: {
                                    name: "أحمد محمد",
                                    email: "ahmed@fenertravel.com",
                                    password: hashedPassword,
                                    role: client_1.UserRole.BRANCH,
                                    branchId: branches[0].id,
                                },
                            }),
                            prisma.user.create({
                                data: {
                                    name: "فاطمة علي",
                                    email: "fatima@fenertravel.com",
                                    password: hashedPassword,
                                    role: client_1.UserRole.BRANCH,
                                    branchId: branches[1].id,
                                },
                            }),
                            prisma.user.create({
                                data: {
                                    name: "محمد خالد",
                                    email: "mohammed@fenertravel.com",
                                    password: hashedPassword,
                                    role: client_1.UserRole.BRANCH,
                                    branchId: branches[2].id,
                                },
                            }),
                        ])];
                case 15:
                    users = _a.sent();
                    console.log("✅ تم إنشاء المستخدمين");
                    return [4 /*yield*/, Promise.all([
                            prisma.shipment.create({
                                data: {
                                    shipmentNumber: "FEN001001",
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
                                    paymentMethod: client_1.PaymentMethod.CASH_ON_DELIVERY,
                                    receivingDate: new Date("2024-01-15"),
                                    expectedDeliveryDate: new Date("2024-01-17"),
                                    shippingCost: 150.0,
                                    paidAmount: 0,
                                    paymentStatus: client_1.PaymentStatus.PENDING,
                                    notes: "يرجى التعامل بحذر - مستندات مهمة",
                                },
                            }),
                            prisma.shipment.create({
                                data: {
                                    shipmentNumber: "FEN001002",
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
                                    paymentMethod: client_1.PaymentMethod.PREPAID,
                                    receivingDate: new Date("2024-01-10"),
                                    expectedDeliveryDate: new Date("2024-01-12"),
                                    actualDeliveryDate: new Date("2024-01-12"),
                                    shippingCost: 280.0,
                                    paidAmount: 280.0,
                                    paymentStatus: client_1.PaymentStatus.PAID,
                                    notes: "",
                                },
                            }),
                        ])];
                case 16:
                    shipments = _a.sent();
                    console.log("✅ تم إنشاء الشحنات التجريبية");
                    // إنشاء سجل التتبع
                    return [4 /*yield*/, Promise.all([
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
                        ])];
                case 17:
                    // إنشاء سجل التتبع
                    _a.sent();
                    console.log("✅ تم إنشاء أحداث التتبع");
                    // إنشاء الفواتير
                    return [4 /*yield*/, prisma.invoice.create({
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
                        })];
                case 18:
                    // إنشاء الفواتير
                    _a.sent();
                    console.log("✅ تم إنشاء الفواتير");
                    console.log("🎉 تم الانتهاء من تعبئة قاعدة البيانات بنجاح!");
                    console.log("📧 بيانات تسجيل الدخول:");
                    console.log("   المدير: admin@fenertravel.com / 123456");
                    console.log("   موظف فرع: ahmed@fenertravel.com / 123456");
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
