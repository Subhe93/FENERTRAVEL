import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RETURN_PATH_KEY = 'fener_return_path';

export const useReturnPath = () => {
  const location = useLocation();

  // حفظ المسار الحالي عند تغييره (فقط للصفحات المحمية)
  useEffect(() => {
    // تجاهل صفحات معينة
    const ignoredPaths = ['/login', '/track', '/tracking'];
    
    if (!ignoredPaths.some(path => location.pathname.startsWith(path))) {
      sessionStorage.setItem(RETURN_PATH_KEY, location.pathname + location.search);
    }
  }, [location]);

  // الحصول على المسار المحفوظ
  const getSavedPath = (): string | null => {
    return sessionStorage.getItem(RETURN_PATH_KEY);
  };

  // مسح المسار المحفوظ
  const clearSavedPath = () => {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  };

  return {
    getSavedPath,
    clearSavedPath
  };
};
