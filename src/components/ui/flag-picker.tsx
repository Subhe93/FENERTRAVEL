import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Search, ChevronDown } from 'lucide-react';

// Common country flags with their names and codes
const COUNTRY_FLAGS = [
  { code: 'SA', name: 'السعودية', flag: '🇸🇦' },
  { code: 'AE', name: 'الإمارات', flag: '🇦🇪' },
  { code: 'KW', name: 'الكويت', flag: '🇰🇼' },
  { code: 'QA', name: 'قطر', flag: '🇶🇦' },
  { code: 'BH', name: 'البحرين', flag: '🇧🇭' },
  { code: 'OM', name: 'عمان', flag: '🇴🇲' },
  { code: 'JO', name: 'الأردن', flag: '🇯🇴' },
  { code: 'LB', name: 'لبنان', flag: '🇱🇧' },
  { code: 'IQ', name: 'العراق', flag: '🇮🇶' },
  { code: 'SY', name: 'سوريا', flag: '🇸🇾' },
  { code: 'YE', name: 'اليمن', flag: '🇾🇪' },
  { code: 'EG', name: 'مصر', flag: '🇪🇬' },
  { code: 'LY', name: 'ليبيا', flag: '🇱🇾' },
  { code: 'TN', name: 'تونس', flag: '🇹🇳' },
  { code: 'DZ', name: 'الجزائر', flag: '🇩🇿' },
  { code: 'MA', name: 'المغرب', flag: '🇲🇦' },
  { code: 'SD', name: 'السودان', flag: '🇸🇩' },
  { code: 'SO', name: 'الصومال', flag: '🇸🇴' },
  { code: 'DJ', name: 'جيبوتي', flag: '🇩🇯' },
  { code: 'KM', name: 'جزر القمر', flag: '🇰🇲' },
  { code: 'MR', name: 'موريتانيا', flag: '🇲🇷' },
  { code: 'US', name: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: 'GB', name: 'المملكة المتحدة', flag: '🇬🇧' },
  { code: 'FR', name: 'فرنسا', flag: '🇫🇷' },
  { code: 'DE', name: 'ألمانيا', flag: '🇩🇪' },
  { code: 'IT', name: 'إيطاليا', flag: '🇮🇹' },
  { code: 'ES', name: 'إسبانيا', flag: '🇪🇸' },
  { code: 'NL', name: 'هولندا', flag: '🇳🇱' },
  { code: 'BE', name: 'بلجيكا', flag: '🇧🇪' },
  { code: 'CH', name: 'سويسرا', flag: '🇨🇭' },
  { code: 'AT', name: 'النمسا', flag: '🇦🇹' },
  { code: 'SE', name: 'السويد', flag: '🇸🇪' },
  { code: 'NO', name: 'النرويج', flag: '🇳🇴' },
  { code: 'DK', name: 'الدنمارك', flag: '🇩🇰' },
  { code: 'FI', name: 'فنلندا', flag: '🇫🇮' },
  { code: 'RU', name: 'روسيا', flag: '🇷🇺' },
  { code: 'CN', name: 'الصين', flag: '🇨🇳' },
  { code: 'JP', name: 'اليابان', flag: '🇯🇵' },
  { code: 'KR', name: 'كوريا الجنوبية', flag: '🇰🇷' },
  { code: 'IN', name: 'الهند', flag: '🇮🇳' },
  { code: 'PK', name: 'باكستان', flag: '🇵🇰' },
  { code: 'BD', name: 'بنغلاديش', flag: '🇧🇩' },
  { code: 'ID', name: 'إندونيسيا', flag: '🇮🇩' },
  { code: 'MY', name: 'ماليزيا', flag: '🇲🇾' },
  { code: 'TH', name: 'تايلاند', flag: '🇹🇭' },
  { code: 'VN', name: 'فيتنام', flag: '🇻🇳' },
  { code: 'PH', name: 'الفلبين', flag: '🇵🇭' },
  { code: 'SG', name: 'سنغافورة', flag: '🇸🇬' },
  { code: 'AU', name: 'أستراليا', flag: '🇦🇺' },
  { code: 'NZ', name: 'نيوزيلندا', flag: '🇳🇿' },
  { code: 'CA', name: 'كندا', flag: '🇨🇦' },
  { code: 'MX', name: 'المكسيك', flag: '🇲🇽' },
  { code: 'BR', name: 'البرازيل', flag: '🇧🇷' },
  { code: 'AR', name: 'الأرجنتين', flag: '🇦🇷' },
  { code: 'CL', name: 'تشيلي', flag: '🇨🇱' },
  { code: 'CO', name: 'كولومبيا', flag: '🇨🇴' },
  { code: 'PE', name: 'بيرو', flag: '🇵🇪' },
  { code: 'ZA', name: 'جنوب أفريقيا', flag: '🇿🇦' },
  { code: 'NG', name: 'نيجيريا', flag: '🇳🇬' },
  { code: 'KE', name: 'كينيا', flag: '🇰🇪' },
  { code: 'ET', name: 'إثيوبيا', flag: '🇪🇹' },
  { code: 'GH', name: 'غانا', flag: '🇬🇭' },
  { code: 'TR', name: 'تركيا', flag: '🇹🇷' },
  { code: 'IR', name: 'إيران', flag: '🇮🇷' },
  { code: 'AF', name: 'أفغانستان', flag: '🇦🇫' },
  { code: 'PL', name: 'بولندا', flag: '🇵🇱' },
  { code: 'CZ', name: 'التشيك', flag: '🇨🇿' },
  { code: 'HU', name: 'المجر', flag: '🇭🇺' },
  { code: 'RO', name: 'رومانيا', flag: '🇷🇴' },
  { code: 'GR', name: 'اليونان', flag: '🇬🇷' },
  { code: 'PT', name: 'البرتغال', flag: '🇵🇹' },
  { code: 'IE', name: 'أيرلندا', flag: '🇮🇪' },
];

interface FlagPickerProps {
  value?: string;
  onChange: (flag: string) => void;
  placeholder?: string;
}

export function FlagPicker({ value, onChange, placeholder = "اختر علم البلد" }: FlagPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedFlag = COUNTRY_FLAGS.find(flag => flag.flag === value);

  const filteredFlags = COUNTRY_FLAGS.filter(flag =>
    flag.name.toLowerCase().includes(search.toLowerCase()) ||
    flag.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedFlag ? (
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedFlag.flag}</span>
                <span>{selectedFlag.name}</span>
                <span className="text-muted-foreground">({selectedFlag.code})</span>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                placeholder="البحث عن البلد..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <CommandList className="max-h-[300px]">
              <CommandEmpty>لم يتم العثور على أي علم.</CommandEmpty>
              <CommandGroup>
                {filteredFlags.map((flag) => (
                  <CommandItem
                    key={flag.code}
                    value={flag.code}
                    onSelect={() => {
                      onChange(flag.flag);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-2xl">{flag.flag}</span>
                    <div className="flex flex-col">
                      <span className="font-medium">{flag.name}</span>
                      <span className="text-sm text-muted-foreground">{flag.code}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
} 