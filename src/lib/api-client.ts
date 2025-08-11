// API Client للتواصل مع الخادم
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = "") {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "فشل في الطلب");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "خطأ غير متوقع",
      };
    }
  }

  // طرق HTTP الأساسية
  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  patch<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// إنشاء instance واحد للتطبيق
export const apiClient = new ApiClient();

// نماذج البيانات لـ TypeScript
export interface User {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "BRANCH";
  branchId?: string;
  branch?: Branch;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  email: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: string;
  name: string;
  code: string;
  flag?: string;
  flagImage?: string;
  type: "ORIGIN" | "DESTINATION" | "BOTH";
  isActive: boolean;
  createdAt: string;
}

export interface ShipmentStatus {
  id: string;
  name: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface Shipment {
  id: string;
  shipmentNumber: string;
  branchId: string;
  createdById: string;
  statusId: string;
  originCountryId: string;
  destinationCountryId: string;
  senderName: string;
  senderPhone: string;
  senderEmail?: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  recipientAddress: string;
  weight: number;
  numberOfBoxes: number;
  content: string;
  paymentMethod:
    | "CASH_ON_DELIVERY"
    | "PREPAID"
    | "CREDIT_CARD"
    | "BANK_TRANSFER";
  receivingDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate?: string;
  notes?: string;
  shippingCost?: number;
  paidAmount?: number;
  paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";
  createdAt: string;
  updatedAt: string;

  // العلاقات
  branch?: Branch;
  createdBy?: User;
  status?: ShipmentStatus;
  originCountry?: Country;
  destinationCountry?: Country;
  histories?: ShipmentHistory[];
  trackingEvents?: TrackingEvent[];
  invoice?: Invoice;
  waybill?: Waybill;

  // الخصائص المحسوبة للاستخدام في الواجهة
  branchName?: string;
  statusName?: string;
  originCountryName?: string;
  destinationCountryName?: string;
  createdByName?: string;
}

export interface ShipmentHistory {
  id: string;
  shipmentId: string;
  userId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  statusId?: string;
  notes?: string;
  timestamp: string;
  user?: User;
  status?: ShipmentStatus;

  // الخصائص المحسوبة للاستخدام في الواجهة
  userName?: string;
}

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  statusId: string;
  location?: string;
  description: string;
  notes?: string;
  updatedById: string;
  eventTime: string;
  createdAt: string;
  status?: ShipmentStatus;
  updatedBy?: User;
}

export interface LogEntry {
  id: string;
  type: "SHIPMENT_UPDATE" | "SYSTEM_ACTION" | "USER_ACTION";
  action: string;
  details: string;
  userId: string;
  shipmentId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: User;
  shipment?: Shipment;

  // الخصائص المحسوبة للاستخدام في الواجهة
  userName?: string;
}

export interface Invoice {
  id: string;
  shipmentId: string;
  invoiceNumber: string;
  totalAmount: number;
  taxAmount?: number;
  discountAmount?: number;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Waybill {
  id: string;
  shipmentId: string;
  waybillNumber: string;
  carrierName?: string;
  carrierRefNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
