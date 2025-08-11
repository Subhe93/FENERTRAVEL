import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Home,
  Plus,
  Building2,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  Globe,
  HardDrive
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar = ({ onClose }: SidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();

  const navigation = [
    { name: t('nav.home'), href: '/', icon: Home, allowedRoles: ['MANAGER', 'BRANCH'] },
    { name: t('nav.addShipment'), href: '/add-shipment', icon: Plus, allowedRoles: ['MANAGER', 'BRANCH'] },
    { name: 'تتبع الشحنات', href: '/tracking', icon: Package, allowedRoles: ['MANAGER', 'BRANCH'] },
    { name: t('nav.branches'), href: '/branches', icon: Building2, allowedRoles: ['MANAGER'] },
    { name: t('nav.users'), href: '/users', icon: Users, allowedRoles: ['MANAGER'] },
    { name: t('nav.statusManagement'), href: '/status-management', icon: Settings, allowedRoles: ['MANAGER'] },
    { name: 'إدارة البلدان', href: '/countries', icon: Globe, allowedRoles: ['MANAGER'] },
    { name: 'النسخ الاحتياطية', href: '/backup', icon: HardDrive, allowedRoles: ['MANAGER'] },
    { name: t('nav.logs'), href: '/logs', icon: FileText, allowedRoles: ['MANAGER', 'BRANCH'] }
  ];

  const filteredNavigation = navigation.filter(item => 
    user && user.role && item.allowedRoles.includes(user.role)
  );

  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };
  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-full",
      collapsed ? "w-16" : "w-64",
      isRTL ? "border-l border-r-0" : ""
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {/* Mobile Close Button */}
        {onClose && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="lg:hidden p-2 bg-white"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">FENERTRAVEL</span>
          </div>
        )}
        
        {/* Desktop Collapse Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden bg-white lg:flex p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        >
          {isRTL ? (
            collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100",
                collapsed && "justify-center"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 min-w-[25px]" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      {user && !collapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm">
            <div className="font-medium text-gray-900">{user.name}</div>
            <div className="text-gray-500">{user.role === 'MANAGER' ? 'مدير' : 'فرع'}</div>
            {user.branchName && (
              <div className="text-xs text-gray-400">{user.branchName}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;