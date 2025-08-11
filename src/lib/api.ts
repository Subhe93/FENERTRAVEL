// API service للـ frontend
import {
  apiClient,
  type User,
  type Shipment,
  type Branch,
  type Country,
  type ShipmentStatus,
} from "./api-client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// تحديث base URL
apiClient.baseURL = API_BASE_URL;

// خدمات المصادقة
export const authAPI = {
  async login(email: string, password: string) {
    const response = await apiClient.post<{ user: User; token: string }>(
      "/auth/login",
      {
        email,
        password,
      }
    );

    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  async logout() {
    const response = await apiClient.post("/auth/logout");
    apiClient.setToken(null);
    return response;
  },

  async getMe() {
    return apiClient.get<{ user: User }>("/auth/me");
  },

  setToken(token: string | null) {
    apiClient.setToken(token);
  },
};

// خدمات الشحنات
export const shipmentsAPI = {
  async getShipments(
    params: {
      page?: number;
      limit?: number;
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
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{
      shipments: Shipment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/shipments?${searchParams}`);
  },

  async getShipmentById(id: string) {
    return apiClient.get<{ shipment: Shipment }>(`/shipments/${id}`);
  },

  async trackShipment(shipmentNumber: string) {
    return apiClient.get<{ shipment: any }>(
      `/shipments/track/${shipmentNumber}`
    );
  },

  async createShipment(shipmentData: any) {
    return apiClient.post<{ shipment: Shipment }>("/shipments", shipmentData);
  },

  async updateShipment(id: string, updates: any) {
    return apiClient.put<{ shipment: Shipment }>(`/shipments/${id}`, updates);
  },

  async updateShipmentStatus(id: string, statusId: string, notes?: string) {
    return apiClient.patch(`/shipments/${id}/status`, { statusId, notes });
  },

  async bulkUpdateShipmentStatus(
    shipmentIds: string[],
    statusId: string,
    notes?: string
  ) {
    return apiClient.patch<{
      updated: Array<{
        shipmentId: string;
        shipmentNumber: string;
        success: boolean;
      }>;
      errors: Array<{
        shipmentId: string;
        shipmentNumber: string;
        error: string;
      }>;
      totalProcessed: number;
      successCount: number;
      errorCount: number;
    }>("/shipments/bulk/status", { shipmentIds, statusId, notes });
  },

  async deleteShipment(id: string) {
    return apiClient.delete(`/shipments/${id}`);
  },

  async getShipmentHistory(id: string) {
    return apiClient.get<{ history: any[] }>(`/shipments/${id}/history`);
  },

  async getTrackingEvents(id: string) {
    return apiClient.get<{ trackingEvents: any[] }>(
      `/shipments/${id}/tracking`
    );
  },
};

// خدمات المستخدمين
export const usersAPI = {
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
      branchId?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{
      users: User[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/users?${searchParams}`);
  },

  async getUserById(id: string) {
    return apiClient.get<{ user: User }>(`/users/${id}`);
  },

  async createUser(userData: any) {
    return apiClient.post<{ user: User }>("/users", userData);
  },

  async updateUser(id: string, updates: any) {
    return apiClient.put<{ user: User }>(`/users/${id}`, updates);
  },

  async deleteUser(id: string) {
    return apiClient.delete(`/users/${id}`);
  },
};

// خدمات الفروع
export const branchesAPI = {
  async getBranches(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      active?: boolean;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{
      branches: Branch[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/branches?${searchParams}`);
  },

  async getBranchById(id: string) {
    return apiClient.get<{ branch: Branch }>(`/branches/${id}`);
  },

  async createBranch(branchData: any) {
    return apiClient.post<{ branch: Branch }>("/branches", branchData);
  },

  async updateBranch(id: string, updates: any) {
    return apiClient.put<{ branch: Branch }>(`/branches/${id}`, updates);
  },

  async deleteBranch(id: string) {
    return apiClient.delete(`/branches/${id}`);
  },

  async getBranchStats(id: string) {
    return apiClient.get<{ stats: any }>(`/branches/${id}/stats`);
  },
};

// خدمات البلدان
export const countriesAPI = {
  async getCountries(
    params: {
      type?: string;
      active?: boolean;
      search?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{ countries: Country[] }>(
      `/countries?${searchParams}`
    );
  },

  async getCountryById(id: string) {
    return apiClient.get<{ country: Country }>(`/countries/${id}`);
  },

  async createCountry(countryData: any) {
    return apiClient.post<{ country: Country }>("/countries", countryData);
  },

  async updateCountry(id: string, updates: any) {
    return apiClient.put<{ country: Country }>(`/countries/${id}`, updates);
  },

  async deleteCountry(id: string) {
    return apiClient.delete(`/countries/${id}`);
  },
};

// خدمات حالات الشحنة
export const statusAPI = {
  async getStatuses(
    params: {
      active?: boolean;
      search?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{ statuses: ShipmentStatus[] }>(
      `/status?${searchParams}`
    );
  },

  async getStatusById(id: string) {
    return apiClient.get<{ status: ShipmentStatus }>(`/status/${id}`);
  },

  async createStatus(statusData: any) {
    return apiClient.post<{ status: ShipmentStatus }>("/status", statusData);
  },

  async updateStatus(id: string, updates: any) {
    return apiClient.put<{ status: ShipmentStatus }>(`/status/${id}`, updates);
  },

  async deleteStatus(id: string) {
    return apiClient.delete(`/status/${id}`);
  },
};

// خدمات السجلات
export const logsAPI = {
  async getLogs(
    params: {
      page?: number;
      limit?: number;
      type?: string;
      userId?: string;
      shipmentId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    } = {}
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    return apiClient.get<{
      logs: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/logs?${searchParams}`);
  },

  async getLogById(id: string) {
    return apiClient.get<{ log: any }>(`/logs/${id}`);
  },

  async getLogsStats(period: string = "7d") {
    return apiClient.get<{ stats: any }>(
      `/logs/stats/summary?period=${period}`
    );
  },

  async cleanupLogs(days: number = 30) {
    return apiClient.delete<{
      success: boolean;
      data: { deletedCount: number };
      message: string;
      error?: string;
    }>(`/logs/cleanup?days=${days}`);
  },
};

export default {
  auth: authAPI,
  shipments: shipmentsAPI,
  users: usersAPI,
  branches: branchesAPI,
  countries: countriesAPI,
  status: statusAPI,
  logs: logsAPI,
};
