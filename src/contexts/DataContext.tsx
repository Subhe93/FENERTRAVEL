import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  shipmentsAPI, 
  branchesAPI, 
  countriesAPI, 
  statusAPI,
  usersAPI,
  logsAPI
} from '../lib/api';
import { 
  type Shipment, 
  type Branch, 
  type Country, 
  type ShipmentStatus,
  type User,
  type ShipmentHistory,
  type LogEntry
} from '../lib/api-client';
import { useAuth } from './AuthContext';

interface DataContextType {
  shipments: Shipment[];
  branches: Branch[];
  countries: Country[];
  statuses: ShipmentStatus[];
  users: User[];
  logs: LogEntry[];
  
  // Loading states
  isLoadingShipments: boolean;
  isLoadingBranches: boolean;
  isLoadingCountries: boolean;
  isLoadingStatuses: boolean;
  isLoadingUsers: boolean;
  isLoadingLogs: boolean;
  
  // Shipments methods
  refreshShipments: () => Promise<void>;
  getShipmentById: (id: string) => Promise<Shipment | null>;
  getShipmentByNumber: (shipmentNumber: string) => Shipment | null;
  getShipmentHistory: (shipmentId: string) => ShipmentHistory[];
  createShipment: (shipmentData: Partial<Shipment>) => Promise<boolean>;
  updateShipment: (id: string, updates: Partial<Shipment>) => Promise<boolean>;
  deleteShipment: (id: string) => Promise<boolean>;
  updateShipmentStatus: (id: string, statusId: string, notes?: string) => Promise<boolean>;
  trackShipment: (shipmentNumber: string) => Promise<Shipment | null>;
  
  // Branches methods
  refreshBranches: () => Promise<void>;
  addBranch: (branchData: Partial<Branch>) => Promise<boolean>;
  updateBranch: (id: string, updates: Partial<Branch>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  
  // Countries methods
  refreshCountries: () => Promise<void>;
  
  // Statuses methods
  refreshStatuses: () => Promise<void>;
  addStatus: (statusData: Partial<ShipmentStatus>) => Promise<boolean>;
  updateStatus: (id: string, updates: Partial<ShipmentStatus>) => Promise<boolean>;
  deleteStatus: (id: string) => Promise<boolean>;
  
  // Users methods
  refreshUsers: () => Promise<void>;
  addUser: (userData: Partial<User>) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;

  // Logs methods
  refreshLogs: () => Promise<void>;
  getLogs: (params?: Record<string, unknown>) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  // States
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [statuses, setStatuses] = useState<ShipmentStatus[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [shipmentHistories, setShipmentHistories] = useState<ShipmentHistory[]>([]);
  
  // Loading states
  const [isLoadingShipments, setIsLoadingShipments] = useState(false);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    } else {
      // Clear data when not authenticated
      setShipments([]);
      setBranches([]);
      setCountries([]);
      setStatuses([]);
      setUsers([]);
      setLogs([]);
      setShipmentHistories([]);
    }
  }, [isAuthenticated]);

  const loadInitialData = async () => {
    await Promise.all([
      refreshShipments(),
      refreshBranches(),
      refreshCountries(),
      refreshStatuses(),
      refreshUsers(),
      refreshLogs()
    ]);
  };

  // Helper function to get shipment with complete data
  const getEnrichedShipment = (shipment: Shipment): Shipment => {
    const branch = branches.find(b => b.id === shipment.branchId);
    const status = statuses.find(s => s.id === shipment.statusId);
    const originCountry = countries.find(c => c.id === shipment.originCountryId);
    const destinationCountry = countries.find(c => c.id === shipment.destinationCountryId);
    const createdBy = users.find(u => u.id === shipment.createdById);

    return {
      ...shipment,
      branch,
      status,
      originCountry,
      destinationCountry,
      createdBy,
      branchName: branch?.name,
      statusName: status?.name,
      originCountryName: originCountry?.name,
      destinationCountryName: destinationCountry?.name
    };
  };

  // Shipments methods
  const refreshShipments = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingShipments(true);
    try {
      const response = await shipmentsAPI.getShipments();
      if (response.success && response.data) {
        setShipments(response.data.shipments);
      }
    } catch (error) {
      console.error('Failed to load shipments:', error);
    } finally {
      setIsLoadingShipments(false);
    }
  };

  const getShipmentById = async (id: string): Promise<Shipment | null> => {
    try {
      const response = await shipmentsAPI.getShipmentById(id);
      if (response.success && response.data) {
        return getEnrichedShipment(response.data.shipment);
      }
      return null;
    } catch (error) {
      console.error('Failed to get shipment:', error);
      return null;
    }
  };

  const getShipmentByNumber = (shipmentNumber: string): Shipment | null => {
    const shipment = shipments.find(s => s.shipmentNumber === shipmentNumber);
    return shipment ? getEnrichedShipment(shipment) : null;
  };

  const getShipmentHistory = (shipmentId: string): ShipmentHistory[] => {
    return shipmentHistories
      .filter(h => h.shipmentId === shipmentId)
      .map(history => {
        const user = users.find(u => u.id === history.userId);
        const status = statuses.find(s => s.id === history.statusId);
        return {
          ...history,
          user,
          status,
          userName: user?.name || 'غير معروف'
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const createShipment = async (shipmentData: Partial<Shipment>): Promise<boolean> => {
    try {
      const response = await shipmentsAPI.createShipment(shipmentData);
      if (response.success) {
        await refreshShipments(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create shipment:', error);
      return false;
    }
  };

  const updateShipment = async (id: string, updates: Partial<Shipment>): Promise<boolean> => {
    try {
      const response = await shipmentsAPI.updateShipment(id, updates);
      if (response.success) {
        // Update local state
        setShipments(prev => prev.map(shipment => 
          shipment.id === id ? { ...shipment, ...updates } : shipment
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update shipment:', error);
      return false;
    }
  };

  const deleteShipment = async (id: string): Promise<boolean> => {
    try {
      const response = await shipmentsAPI.deleteShipment(id);
      if (response.success) {
        setShipments(prev => prev.filter(shipment => shipment.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete shipment:', error);
      return false;
    }
  };

  const updateShipmentStatus = async (id: string, statusId: string, notes?: string): Promise<boolean> => {
    try {
      const response = await shipmentsAPI.updateShipmentStatus(id, statusId, notes);
      if (response.success) {
        // Update local state
        setShipments(prev => prev.map(shipment => 
          shipment.id === id ? { ...shipment, statusId } : shipment
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      return false;
    }
  };

  const trackShipment = async (shipmentNumber: string): Promise<Shipment | null> => {
    try {
      const response = await shipmentsAPI.trackShipment(shipmentNumber);
      if (response.success && response.data) {
        return getEnrichedShipment(response.data.shipment);
      }
      return null;
    } catch (error) {
      console.error('Failed to track shipment:', error);
      return null;
    }
  };

  // Branches methods
  const refreshBranches = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingBranches(true);
    try {
      const response = await branchesAPI.getBranches();
      if (response.success && response.data) {
        setBranches(response.data.branches);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    } finally {
      setIsLoadingBranches(false);
    }
  };

  // Countries methods
  const refreshCountries = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingCountries(true);
    try {
      const response = await countriesAPI.getCountries({ active: true });
      if (response.success && response.data) {
        setCountries(response.data.countries);
      }
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setIsLoadingCountries(false);
    }
  };

  // Branches methods
  const addBranch = async (branchData: Partial<Branch>): Promise<boolean> => {
    try {
      const response = await branchesAPI.createBranch(branchData);
      if (response.success) {
        await refreshBranches(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create branch:', error);
      return false;
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>): Promise<boolean> => {
    try {
      const response = await branchesAPI.updateBranch(id, updates);
      if (response.success) {
        await refreshBranches(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update branch:', error);
      return false;
    }
  };

  const deleteBranch = async (id: string): Promise<boolean> => {
    try {
      const response = await branchesAPI.deleteBranch(id);
      if (response.success) {
        setBranches(prev => prev.filter(branch => branch.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete branch:', error);
      return false;
    }
  };

  // Statuses methods
  const refreshStatuses = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingStatuses(true);
    try {
      const response = await statusAPI.getStatuses({ active: true });
      if (response.success && response.data) {
        setStatuses(response.data.statuses);
      }
    } catch (error) {
      console.error('Failed to load statuses:', error);
    } finally {
      setIsLoadingStatuses(false);
    }
  };

  const addStatus = async (statusData: Partial<ShipmentStatus>): Promise<boolean> => {
    try {
      const response = await statusAPI.createStatus(statusData);
      if (response.success) {
        await refreshStatuses(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create status:', error);
      return false;
    }
  };

  const updateStatus = async (id: string, updates: Partial<ShipmentStatus>): Promise<boolean> => {
    try {
      const response = await statusAPI.updateStatus(id, updates);
      if (response.success) {
        await refreshStatuses(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update status:', error);
      return false;
    }
  };

  const deleteStatus = async (id: string): Promise<boolean> => {
    try {
      const response = await statusAPI.deleteStatus(id);
      if (response.success) {
        setStatuses(prev => prev.filter(status => status.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete status:', error);
      return false;
    }
  };

  // Users methods
  const refreshUsers = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingUsers(true);
    try {
      const response = await usersAPI.getUsers();
      if (response.success && response.data) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const addUser = async (userData: Partial<User>): Promise<boolean> => {
    try {
      const response = await usersAPI.createUser(userData);
      if (response.success) {
        await refreshUsers(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to create user:', error);
      return false;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<boolean> => {
    try {
      const response = await usersAPI.updateUser(id, updates);
      if (response.success) {
        await refreshUsers(); // Refresh list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update user:', error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const response = await usersAPI.deleteUser(id);
      if (response.success) {
        setUsers(prev => prev.filter(user => user.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete user:', error);
      return false;
    }
  };

  // Logs methods
  const refreshLogs = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingLogs(true);
    try {
      const response = await logsAPI.getLogs();
      if (response.success && response.data) {
        // Enrich logs with user and shipment info
        const enrichedLogs = response.data.logs.map((log: LogEntry) => {
          const user = users.find(u => u.id === log.userId);
          const shipment = shipments.find(s => s.id === log.shipmentId);
          return {
            ...log,
            user,
            shipment,
            userName: user?.name || 'غير معروف'
          };
        });
        setLogs(enrichedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const getLogs = async (params?: Record<string, unknown>) => {
    if (!isAuthenticated) return;
    
    setIsLoadingLogs(true);
    try {
      const response = await logsAPI.getLogs(params);
      if (response.success && response.data) {
        const enrichedLogs = response.data.logs.map((log: LogEntry) => {
          const user = users.find(u => u.id === log.userId);
          const shipment = shipments.find(s => s.id === log.shipmentId);
          return {
            ...log,
            user,
            shipment,
            userName: user?.name || 'غير معروف'
          };
        });
        setLogs(enrichedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load shipment histories when shipments or users change
  useEffect(() => {
    const loadShipmentHistories = async () => {
      if (shipments.length > 0) {
        try {
          const histories: ShipmentHistory[] = [];
          for (const shipment of shipments) {
            const response = await shipmentsAPI.getShipmentHistory(shipment.id);
            if (response.success && response.data) {
              histories.push(...response.data.history);
            }
          }
          setShipmentHistories(histories);
        } catch (error) {
          console.error('Failed to load shipment histories:', error);
        }
      }
    };

    loadShipmentHistories();
  }, [shipments.length]);

  // Load logs when users change (to enrich with user data)
  useEffect(() => {
    if (users.length > 0 && logs.length > 0) {
      const enrichedLogs = logs.map(log => {
        const user = users.find(u => u.id === log.userId);
        const shipment = shipments.find(s => s.id === log.shipmentId);
        return {
          ...log,
          user,
          shipment,
          userName: user?.name || 'غير معروف'
        };
      });
      setLogs(enrichedLogs);
    }
  }, [users.length, shipments.length]);

  const value = {
    shipments,
    branches,
    countries,
    statuses,
    users,
    logs,
    
    isLoadingShipments,
    isLoadingBranches,
    isLoadingCountries,
    isLoadingStatuses,
    isLoadingUsers,
    isLoadingLogs,
    
    refreshShipments,
    getShipmentById,
    getShipmentByNumber,
    getShipmentHistory,
    createShipment,
    updateShipment,
    deleteShipment,
    updateShipmentStatus,
    trackShipment,
    
    refreshBranches,
    addBranch,
    updateBranch,
    deleteBranch,
    
    refreshCountries,
    
    refreshStatuses,
    addStatus,
    updateStatus,
    deleteStatus,
    
    refreshUsers,
    addUser,
    updateUser,
    deleteUser,

    refreshLogs,
    getLogs
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};