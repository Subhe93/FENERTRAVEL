import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.addShipment': 'إضافة شحنة',
    'nav.branches': 'إدارة الفروع',
    'nav.users': 'إدارة المستخدمين',
    'nav.statusManagement': 'إدارة الحالات',
    'nav.logs': 'سجل العمليات',
    'nav.logout': 'تسجيل الخروج',
    
    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.add': 'إضافة',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.print': 'طباعة',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    
    // Shipments
    'shipments.title': 'إدارة الشحنات',
    'shipments.shipmentNumber': 'رقم الشحنة',
    'shipments.sender': 'المرسل',
    'shipments.recipient': 'المستلم',
    'shipments.weight': 'الوزن',
    'shipments.boxes': 'عدد الصناديق',
    'shipments.status': 'الحالة',
    'shipments.actions': 'الإجراءات',
    
    // Add more translations as needed...
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.addShipment': 'Add Shipment',
    'nav.branches': 'Branch Management',
    'nav.users': 'User Management',
    'nav.statusManagement': 'Status Management',
    'nav.logs': 'Activity Logs',
    'nav.logout': 'Logout',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.print': 'Print',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    
    // Shipments
    'shipments.title': 'Shipment Management',
    'shipments.shipmentNumber': 'Shipment Number',
    'shipments.sender': 'Sender',
    'shipments.recipient': 'Recipient',
    'shipments.weight': 'Weight',
    'shipments.boxes': 'Number of Boxes',
    'shipments.status': 'Status',
    'shipments.actions': 'Actions',
    
    // Add more translations as needed...
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  const isRTL = language === 'ar';

  const value = {
    language,
    setLanguage,
    t,
    isRTL
  };

  return (
    <LanguageContext.Provider value={value}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : 'font-english'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};