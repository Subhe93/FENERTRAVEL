import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Package, 
  Printer,
  Loader2,
  Download
} from 'lucide-react';
import Barcode from '@/components/ui/barcode';
import { toast } from 'sonner';
import { type Shipment } from '@/lib/api-client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ShipmentLabelPrintPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipments, getShipmentById } = useData();
  const printRef = useRef<HTMLDivElement>(null);

  // Local state for the shipment and loading
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load shipment data
  useEffect(() => {
    const loadShipment = async () => {
      if (!id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);

      try {
        // First, try to find in local shipments array
        const localShipment = shipments.find(s => s.id === id);
        if (localShipment) {
          setShipment(localShipment);
          setIsLoading(false);
          return;
        }

        // If not found locally, fetch from API
        const fetchedShipment = await getShipmentById(id);
        if (fetchedShipment) {
          setShipment(fetchedShipment);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading shipment:', error);
        setNotFound(true);
        toast.error('حدث خطأ أثناء تحميل بيانات الشحنة');
      } finally {
        setIsLoading(false);
      }
    };

    loadShipment();
  }, [id, getShipmentById]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">جاري تحميل ملصق الشحنة...</h2>
          <p className="text-gray-600">يرجى الانتظار</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (notFound || !shipment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الشحنة غير موجودة</h2>
          <p className="text-gray-600 mb-4">لم يتم العثور على الشحنة المطلوبة أو حدث خطأ أثناء التحميل</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate('/')}>العودة للرئيسية</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setNotFound(false);
                setIsLoading(true);
                // Trigger reload by changing state
                const currentId = id;
                if (currentId) {
                  const loadShipment = async () => {
                    try {
                      const fetchedShipment = await getShipmentById(currentId);
                      if (fetchedShipment) {
                        setShipment(fetchedShipment);
                      } else {
                        setNotFound(true);
                      }
                    } catch (error) {
                      console.error('Error reloading shipment:', error);
                      setNotFound(true);
                      toast.error('فشل في إعادة تحميل البيانات');
                    } finally {
                      setIsLoading(false);
                    }
                  };
                  loadShipment();
                }
              }}
            >
              إعادة المحاولة
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!shipment || !printRef.current) return;

    try {
      toast.loading('جاري إنشاء ملف PDF...');
      
      // إزالة الـ padding والـ margin من الكونتينر الرئيسي
      const mainContainer = document.querySelector('.for-pdf-print');
      if (mainContainer) {
        mainContainer.classList.add('p-0', 'm-0');
      }
      
      // انتظار تحميل الباركود والصور
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // تحويل العنصر إلى canvas
      const canvas = await html2canvas(printRef.current, {
        width: 384, // 4 inches * 96 DPI
        height: 576, // 6 inches * 96 DPI
        scale: 3, // لتحسين الجودة
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 5000,
        removeContainer: true,
        foreignObjectRendering: false
      });
      
      // إعادة الـ padding والـ margin للكونتينر الرئيسي
      if (mainContainer) {
        mainContainer.classList.remove('p-0', 'm-0');
      }
      
      // إنشاء PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: [4, 6] // 4×6 إنش
      });
      
      // إضافة الصورة إلى PDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 4, 6);
      
      // حفظ الملف
      const fileName = `shipment-label-${shipment.shipmentNumber}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success('تم تصدير ملف PDF بنجاح');
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      
      // إعادة الـ padding والـ margin للكونتينر الرئيسي في حالة الخطأ
      const mainContainer = document.querySelector('.for-pdf-print');
      if (mainContainer) {
        mainContainer.classList.remove('p-0', 'm-0');
      }
      
      toast.dismiss();
      toast.error('حدث خطأ أثناء تصدير ملف PDF');
    }
  };

  return (
    <>
      <style>{`
        @media screen {
          .print-only {
            display: none;
          }
        }
        
        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
            
          }
          
          body * {
            visibility: hidden;
            overflow: hidden;
           
            height: 0 !important;
          }
          
          .print-only, .print-only * {
            visibility: visible;
            height: auto !important;
            
          }
          
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 4in;
            height: 6in;
            max-height: 6in;
            padding: 0.1in;
            font-family: Tahoma, Arial, sans-serif;
            font-size: 12px;
            color: black;
            background: white;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            
          }
          
          .label-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            border-bottom: 1px solid black;
          }
          
          .logo-section {
            width: 100%;
            text-align: right;
          }
          
          .company-logo {
            height: 1in;
            width: auto;
            max-width: 2in;
            object-fit: contain;
            display: block !important;
          }
          
          .company-info {
            width: 100%;
            text-align: right;
            direction: rtl;
            font-family: Tahoma, Arial, sans-serif;
          }
          
          .company-name {
            font-size: 14px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 4px;
          }
          
          .company-desc {
            font-size: 14px;
            color: #374151;
            margin-bottom: 6px;
          }
          
          .destination {
            font-size: 20px;
            font-weight: bold;
            color: black;
          }
          
          .barcode-section {
            text-align: center;
            margin: 0.06in 0;
            padding: 0.04in 0;
            border-bottom: 1px solid #ddd;
          }
          
          .barcode-section canvas {
            display: block !important;
            margin: 0 auto;
            max-width: 100%;
            height: auto !important;
            width: auto !important;
          }
          
          .print-barcode {
            display: block !important;
            visibility: visible !important;
          }
          
          .print-barcode canvas {
            display: block !important;
            visibility: visible !important;
            margin: 0 auto !important;
          }
          
          .tracking-number {
            font-size: 14px;
           
            margin-top: 4px;
            letter-spacing: 1px;
          }
          
          .details-section {
            flex: 1;
            direction: rtl;
            text-align: right;
            font-family: Tahoma, Arial, sans-serif;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 0.08in;
            border-bottom: 1px solid black;
            padding-bottom: 1px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.04in;
            padding: 2px 0;
            border-bottom: 1px solid #e5e7eb;
            font-size: 18px;
            min-height: 24px;
          }
          
          .detail-label {
            color: #374151;
            flex: 0 0 auto;
            text-align: right;
            min-width: 0.7in;
            font-family: Tahoma, Arial, sans-serif;
          }
          
          .detail-value {
            color: black;
            font-weight: bold;
            flex: 1;
            text-align: right;
            direction: rtl;
            overflow: hidden;
            font-family: Tahoma, Arial, sans-serif;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
        }
      `}</style>

      {/* Screen View */}
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
            
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleExportPDF} 
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                تصدير PDF
              </Button>
              
              <Button onClick={handlePrint} className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                طباعة الملصق
              </Button>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">ملصق طباعة الشحنة</h1>
            <p className="text-gray-600">رقم الشحنة: {shipment.shipmentNumber}</p>
            <p className="text-sm text-gray-500">مخصص لطابعة DYMO LabelWriter 5XL - قياس 4×6 بوصة</p>
            <p className="text-xs text-gray-400 mt-1">يمكنك طباعة الملصق أو تصديره كملف PDF</p>
          </div>

          {/* Preview */}
          <div className="bg-white border-2 border-gray-300 rounded-lg  shadow-lg mx-auto" style={{width: '4in', minHeight: '6in', fontFamily: 'Tahoma, Arial, sans-serif'}}>
           
            <div 
              ref={printRef}
              className="border border-gray-200 rounded p-2 bg-white for-pdf-print" 
              style={{fontSize: '24px', fontFamily: 'Tahoma, Arial, sans-serif'}}
            >
              {/* Header Section - Preview */}
              <div className="flex flex-col items-center border-b border-black pb-2 mb-3">
                <div className="w-full text-right">
                  <img 
                    src="/img/fenerlogo.webp" 
                    alt="Fener Travel Logo" 
                    className="max-w-[200px] object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
                <div className="w-full text-right" style={{direction: 'rtl', fontFamily: 'Tahoma, Arial, sans-serif'}}>
                  {/* <div className="text-sm font-bold text-blue-600 mb-1">Fener Travel</div> */}
                  <div className="text-sm text-gray-600 mb-2">شركة فنر للسياحة والسفر والشحن أهلاً وسهلاً بكم</div>
                  <div className="text-lg font-bold text-black">
                    الى : {shipment.destinationCountryName || shipment.destinationCountry?.name || 'سوريا'}
                  </div>
                </div>
              </div>

              {/* Barcode Section - Preview */}
              <div className="text-center my-1 py-2 border-b border-gray-300">
                <Barcode 
                  value={shipment.shipmentNumber}
                  height={80}
                  width={2.5}
                  fontSize={16}
                  margin={4}
                  background="#ffffff"
                  lineColor="#000000"
                  displayValue={false}
                />
                <div className="text-lg tracking-wide" style={{fontSize: '14px'}}>{shipment.shipmentNumber}</div>
              </div>

              {/* Details Section - Preview */}
              <div style={{direction: 'rtl', textAlign: 'right', fontFamily: 'Tahoma, Arial, sans-serif'}}>
                <div className="font-bold  border-b-2 border-black pb-1" style={{fontSize: '18px'}}>تفاصيل المستلم:</div>

                <div className="flex justify-start items-center  py-1 border-b border-gray-200" style={{fontSize: '18px'}}>
                  <span className="text-gray-600">اسم المستلم :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.recipientName}</span>
                </div>

                <div className="flex justify-start items-center  py-1 border-b border-gray-200" style={{fontSize: '18px'}}>
                  <span className="text-gray-600">رقم الهاتف :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.recipientPhone}</span>
                </div>

                <div className="flex justify-start items-center  py-1 border-b border-gray-200" style={{fontSize: '18px'}}> 
                  <span className="text-gray-600">العنوان-المدينة :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.recipientAddress || 'حمص'}</span>
                </div>

                <div className="flex justify-start items-center  py-1 border-b border-gray-200" style={{fontSize: '18px'}}> 
                  <span className="text-gray-600">الوزن :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.weight}</span>
                </div>

                <div className="flex justify-start items-center  py-1 border-b border-gray-200" style={{fontSize: '18px'}}>
                  <span className="text-gray-600">عدد الصناديق :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.numberOfBoxes}</span>
                </div>

                <div className="flex justify-start items-center py-1" style={{fontSize: '18px'}}>
                  <span className="text-gray-600">المحتوى :</span>
                  <span className="text-black font-bold" style={{ direction: 'rtl' }}>{shipment.content || 'البسة واحذية'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Content */}
      <div className="print-only">
        {/* Header Section */}
        <div className="label-header">
          <div className="logo-section">
            <img 
              src="/img/fenerlogo.webp" 
              alt="Fener Travel Logo" 
              className="company-logo"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'block';
                console.log('Logo loaded successfully');
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error('Logo failed to load:', e);
                // Try alternative path
                if (target.src.includes('/img/')) {
                  target.src = './img/fenerlogo.webp';
                } else if (target.src.includes('./img/')) {
                  target.src = '/public/img/fenerlogo.webp';
                } else {
                  target.style.display = 'none';
                }
              }}
            />
          </div>
          <div className="company-info">
            {/* <div className="company-name">Fener Travel</div> */}
            <div className="company-desc">شركة فنر للسياحة والسفر والشحن أهلاً وسهلاً بكم</div>
            <div className="destination">
              الى : {shipment.destinationCountryName || shipment.destinationCountry?.name || 'سوريا'}
            </div>
          </div>
        </div>

        {/* Barcode Section */}
        <div className="barcode-section">
          <Barcode 
            value={shipment.shipmentNumber}
            height={80}
            width={2.5}
            fontSize={16}
            margin={4}
            background="#ffffff"
            lineColor="#000000"
            displayValue={false}
            className="print-barcode"
          />
          <div className="tracking-number">{shipment.shipmentNumber}</div>
        </div>

        {/* Details Section */}
        <div className="details-section">
          <div className="section-title">تفاصيل المستلم:</div>
          
          <div className="detail-row">
            <span className="detail-label">اسم المستلم : </span>
            <span className="detail-value">{shipment.recipientName}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">رقم الهاتف : </span>
            <span className="detail-value">{shipment.recipientPhone}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">العنوان-المدينة :</span>
            <span className="detail-value">{shipment.recipientAddress || 'حمص'}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">الوزن :</span>
            <span className="detail-value">{shipment.weight}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">عدد الصناديق :</span>
            <span className="detail-value">{shipment.numberOfBoxes}</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">المحتوى :</span>
            <span className="detail-value">{shipment.content || 'البسة واحذية'}</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShipmentLabelPrintPage;