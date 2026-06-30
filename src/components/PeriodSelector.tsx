import { useState, useEffect, useRef } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const YEARS = [2024, 2025, 2026, 2027];

interface PeriodSelectorProps {
  month: string;
  year: number;
  onSelect: (month: string, year: number) => void;
  /** When true, months without data for the selected year are greyed out */
  dataAware?: boolean;
  /** Pre-fetched set of months with data — parent can pass this in */
  monthsWithData?: Set<string>;
  /** Called when the year changes so parent can refetch monthsWithData */
  onYearPreview?: (year: number) => void;
}

export function PeriodSelector({
  month,
  year,
  onSelect,
  dataAware = false,
  monthsWithData,
  onYearPreview,
}: PeriodSelectorProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'year' | 'month'>('year');
  const [pendingYear, setPendingYear] = useState<number>(year);
  const [internalMonthsWithData, setInternalMonthsWithData] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  const effectiveMonthsWithData = monthsWithData ?? internalMonthsWithData;

  useEffect(() => {
    if (!open) {
      setStep('year');
      setPendingYear(year);
    }
  }, [open, year]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleYearClick = async (y: number) => {
    setPendingYear(y);
    if (dataAware && !monthsWithData) {
      const { data } = await supabase
        .from('amazon_monthly_sales')
        .select('report_month')
        .eq('report_year', y);
      setInternalMonthsWithData(new Set(data?.map(r => r.report_month) ?? []));
    }
    onYearPreview?.(y);
    setStep('month');
  };

  const handleMonthClick = (m: string) => {
    const isDisabled = dataAware && effectiveMonthsWithData.size > 0 && !effectiveMonthsWithData.has(m);
    if (isDisabled) return;
    onSelect(m, pendingYear);
    setOpen(false);
  };

  const label = month ? `${month} ${year}` : 'Select Period';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className={`flex-1 text-left ${!month ? 'text-muted-foreground' : ''}`}>
          {label}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
          {step === 'year' ? (
            <div className="p-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
                Select Year
              </p>
              <div className="grid grid-cols-2 gap-2">
                {YEARS.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearClick(y)}
                    className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors text-left
                      ${y === pendingYear
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3">
              <button
                type="button"
                onClick={() => setStep('year')}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 mb-3 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {pendingYear}
              </button>

              <div className="grid grid-cols-3 gap-1.5">
                {MONTHS.map((m, i) => {
                  const hasData = !dataAware || effectiveMonthsWithData.size === 0 || effectiveMonthsWithData.has(m);
                  const isSelected = m === month && pendingYear === year;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleMonthClick(m)}
                      disabled={!hasData}
                      className={`rounded-md px-1 py-2 text-xs font-medium transition-colors
                        ${isSelected
                          ? 'bg-gray-900 text-white'
                          : hasData
                            ? 'bg-gray-50 text-gray-800 hover:bg-gray-100'
                            : 'bg-gray-50 text-gray-300 cursor-not-allowed opacity-50'
                        }`}
                    >
                      {MONTH_SHORT[i]}
                    </button>
                  );
                })}
              </div>

              {dataAware && effectiveMonthsWithData.size > 0 && (
                <p className="text-xs text-gray-400 mt-2.5 text-center">
                  Greyed months have no data
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
