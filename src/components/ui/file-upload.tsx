import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  value?: string;
  onChange: (value: string) => void;
  onFile?: (file: File) => void;
  className?: string;
  accept?: string;
}

export function FileUpload({
  value,
  onChange,
  onFile,
  className,
  accept = "image/*"
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    if (onFile) {
      onFile(file);
    }

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className={cn(
        'relative group cursor-pointer',
        className
      )}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
      
      {value ? (
        <div className="relative w-full h-32 rounded-md overflow-hidden">
          <img
            src={value}
            alt="Uploaded flag"
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center w-full h-32 rounded-md border-2 border-dashed transition-colors',
            isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/25',
            'hover:border-primary hover:bg-primary/5'
          )}
        >
          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            اسحب وأفلت الصورة هنا<br />
            أو انقر للاختيار
          </p>
        </div>
      )}
    </div>
  );
} 