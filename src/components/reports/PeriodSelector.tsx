import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { subMonths, subWeeks, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

interface PeriodSelectorProps {
  value: { type: 'monthly' | 'weekly'; period: Date };
  onChange: (value: { type: 'monthly' | 'weekly'; period: Date }) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy')
    };
  });

  const weekOptions = Array.from({ length: 8 }, (_, i) => {
    const date = subWeeks(new Date(), i);
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    return {
      value: date.toISOString(),
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    };
  });

  const currentOptions = value.type === 'monthly' ? monthOptions : weekOptions;
  const currentValue = value.period.toISOString();

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Period Type:</span>
      </div>
      
      <Select
        value={value.type}
        onValueChange={(type: 'monthly' | 'weekly') => {
          const period = type === 'monthly' 
            ? startOfMonth(new Date())
            : startOfWeek(new Date());
          onChange({ type, period });
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentValue}
        onValueChange={(val) => {
          onChange({ type: value.type, period: new Date(val) });
        }}
      >
        <SelectTrigger className="w-[250px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {currentOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
