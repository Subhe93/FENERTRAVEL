import { ReactNode } from 'react';
import { useReturnPath } from '@/hooks/useReturnPath';

interface ProtectedPageWrapperProps {
  children: ReactNode;
}

const ProtectedPageWrapper = ({ children }: ProtectedPageWrapperProps) => {
  // استخدام الـ hook لحفظ المسار تلقائياً
  useReturnPath();
  
  return <>{children}</>;
};

export default ProtectedPageWrapper;
