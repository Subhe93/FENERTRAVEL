import { useState, useEffect, useCallback } from "react";
import { shipmentsAPI } from "../lib/api";
import { type Shipment } from "../lib/api-client";
import { useAuth } from "../contexts/AuthContext";

export interface ShipmentsFilters {
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

export interface ShipmentsSorting {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ShipmentsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface UseShipmentsReturn {
  shipments: Shipment[];
  pagination: ShipmentsPagination;
  isLoading: boolean;
  error: string | null;
  filters: ShipmentsFilters;
  sorting: ShipmentsSorting;
  setFilters: (filters: Partial<ShipmentsFilters>) => void;
  setSorting: (sorting: Partial<ShipmentsSorting>) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
}

export const useShipments = (initialLimit: number = 25): UseShipmentsReturn => {
  const { isAuthenticated } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [pagination, setPagination] = useState<ShipmentsPagination>({
    page: 1,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ShipmentsFilters>({});
  const [sorting, setSortingState] = useState<ShipmentsSorting>({
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const fetchShipments = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await shipmentsAPI.getShipments({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...sorting,
      });

      if (response.success && response.data) {
        setShipments(response.data.shipments);
        setPagination(response.data.pagination);
      } else {
        setError("فشل في تحميل الشحنات");
      }
    } catch (err) {
      setError("حدث خطأ في تحميل الشحنات");
      console.error("Failed to fetch shipments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, pagination.page, pagination.limit, filters, sorting]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const setFilters = useCallback((newFilters: Partial<ShipmentsFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setSorting = useCallback((newSorting: Partial<ShipmentsSorting>) => {
    setSortingState((prev) => ({ ...prev, ...newSorting }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchShipments();
  }, [fetchShipments]);

  return {
    shipments,
    pagination,
    isLoading,
    error,
    filters,
    sorting,
    setFilters,
    setSorting,
    setPage,
    setLimit,
    clearFilters,
    refresh,
  };
};
