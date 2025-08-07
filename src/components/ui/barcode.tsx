import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF14';
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  className?: string;
}

const Barcode: React.FC<BarcodeProps> = ({
  value,
  width = 2,
  height = 80,
  format = 'CODE128',
  displayValue = true,
  fontSize = 14,
  margin = 10,
  background = '#ffffff',
  lineColor = '#000000',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          margin: margin,
          background: background,
          lineColor: lineColor,
          textAlign: 'center',
          textPosition: 'bottom',
          textMargin: 5,
          font: 'Arial, sans-serif',
          fontOptions: 'bold'
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [value, width, height, format, displayValue, fontSize, margin, background, lineColor]);

  if (!value) {
    return (
      <div className={`flex items-center justify-center p-4 bg-gray-100 border border-dashed border-gray-300 rounded ${className}`}>
        <span className="text-gray-500">لا يوجد رقم شحنة</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <canvas ref={canvasRef} className="border border-gray-200 rounded" />
    </div>
  );
};

export default Barcode; 