import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import AddShipmentPage from '@/pages/AddShipmentPage';
import ShipmentDetailPage from '@/pages/ShipmentDetailPage';
import BranchManagementPage from '@/pages/BranchManagementPage';
import UserManagementPage from '@/pages/UserManagementPage';
import StatusManagementPage from '@/pages/StatusManagementPage';
import LogsPage from '@/pages/LogsPage';
import PublicTrackingPage from '@/pages/PublicTrackingPage';
import ShipmentTrackingPage from '@/pages/ShipmentTrackingPage';
import CountryManagementPage from '@/pages/CountryManagementPage';
import InvoicePage from '@/pages/InvoicePage';
import WaybillPage from '@/pages/WaybillPage';
import EditShipmentPage from '@/pages/EditShipmentPage';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <DataProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/track" element={<PublicTrackingPage />} />
                <Route path="/tracking" element={<ShipmentTrackingPage />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout>
                      <HomePage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/add-shipment" element={
                  <ProtectedRoute>
                    <Layout>
                      <AddShipmentPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/shipment/:id" element={
                  <ProtectedRoute>
                    <Layout>
                      <ShipmentDetailPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/shipment/:id/edit" element={
                  <ProtectedRoute>
                    <Layout>
                      <EditShipmentPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/branches" element={
                  <ProtectedRoute requiredRole="MANAGER">
                    <Layout>
                      <BranchManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/users" element={
                  <ProtectedRoute requiredRole="MANAGER">
                    <Layout>
                      <UserManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/status-management" element={
                  <ProtectedRoute requiredRole="MANAGER">
                    <Layout>
                      <StatusManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/countries" element={
                  <ProtectedRoute requiredRole="MANAGER">
                    <Layout>
                      <CountryManagementPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/logs" element={
                  <ProtectedRoute>
                    <Layout>
                      <LogsPage />
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="/invoice/:id" element={
                  <ProtectedRoute>
                    <InvoicePage />
                  </ProtectedRoute>
                } />
                <Route path="/waybill/:id" element={
                  <ProtectedRoute>
                    <WaybillPage />
                  </ProtectedRoute>
                } />
              </Routes>
              <Toaster />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;