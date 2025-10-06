import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from 'date-fns';
import { cn } from '@/lib/utils';

interface PeriodSelectorProps {
  onPeriodChange: (startDate: Date, endDate: Date) => void;
}

type PeriodType = 'this-month' | 'last-month' | 'this-week' | 'last-week' | 'custom';

export const PeriodSelector = ({ onPeriodChange }: PeriodSelectorProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('this-month');
  const [customStart, setCustomStart] = useState<Date>();
  const [customEnd, setCustomEnd] = useState<Date>();

  const handlePeriodSelect = (period: PeriodType) => {
    setSelectedPeriod(period);
    
    let start: Date;
    let end: Date;
    const now = new Date();

    switch (period) {
      case 'this-month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'last-month':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      case 'this-week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'last-week':
        start = startOfWeek(subWeeks(now, 1));
        end = endOfWeek(subWeeks(now, 1));
        break;
      case 'custom':
        if (customStart && customEnd) {
          start = customStart;
          end = customEnd;
        } else {
          return;
        }
        break;
      default:
        return;
    }

    onPeriodChange(start, end);
  };

  const handleCustomDateSelect = () => {
    if (customStart && customEnd) {
      onPeriodChange(customStart, customEnd);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Button
        variant={selectedPeriod === 'this-month' ? 'default' : 'outline'}
        onClick={() => handlePeriodSelect('this-month')}
        size="sm"
      >
        This Month
      </Button>
      <Button
        variant={selectedPeriod === 'last-month' ? 'default' : 'outline'}
        onClick={() => handlePeriodSelect('last-month')}
        size="sm"
      >
        Last Month
      </Button>
      <Button
        variant={selectedPeriod === 'this-week' ? 'default' : 'outline'}
        onClick={() => handlePeriodSelect('this-week')}
        size="sm"
      >
        This Week
      </Button>
      <Button
        variant={selectedPeriod === 'last-week' ? 'default' : 'outline'}
        onClick={() => handlePeriodSelect('last-week')}
        size="sm"
      >
        Last Week
      </Button>

      <div className="flex gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customStart ? format(customStart, 'MMM dd, yyyy') : 'Start Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customStart}
              onSelect={(date) => {
                setCustomStart(date);
                setSelectedPeriod('custom');
              }}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={selectedPeriod === 'custom' ? 'default' : 'outline'}
              size="sm"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customEnd ? format(customEnd, 'MMM dd, yyyy') : 'End Date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={customEnd}
              onSelect={(date) => {
                setCustomEnd(date);
                setSelectedPeriod('custom');
              }}
              disabled={(date) => customStart ? date < customStart : false}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>

        {selectedPeriod === 'custom' && customStart && customEnd && (
          <Button onClick={handleCustomDateSelect} size="sm">
            Apply
          </Button>
        )}
      </div>
    </div>
  );
};
