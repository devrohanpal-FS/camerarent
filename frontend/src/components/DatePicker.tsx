import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { apiRequest } from '../utils/api';

interface DateRangePickerProps {
  productId: string;
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

export default function DateRangePicker({ productId, startDate, endDate, onChange }: DateRangePickerProps) {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    async function loadBlockedDates() {
      try {
        const dates = await apiRequest(`/products/${productId}/unavailable-dates`);
        setUnavailableDates(dates);
      } catch (err) {
        console.error('Failed to load product unavailable dates:', err);
      }
    }
    loadBlockedDates();
  }, [productId]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateUnavailable = (date: Date) => {
    const formatted = formatDateStr(date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    return unavailableDates.includes(formatted);
  };

  const handleDateClick = (date: Date) => {
    if (isDateUnavailable(date)) return;

    if (!startDate || (startDate && endDate)) {
      onChange(date, null);
    } else if (startDate && !endDate) {
      if (date < startDate) {
        onChange(date, null);
      } else {
        if (hasBlockedDatesInRange(startDate, date)) {
          alert('Selected range overlaps with unavailable/booked dates. Please choose another range.');
          onChange(null, null);
        } else {
          onChange(startDate, date);
          setShowCalendar(false);
        }
      }
    }
  };

  const hasBlockedDatesInRange = (start: Date, end: Date) => {
    const curr = new Date(start);
    while (curr <= end) {
      if (isDateUnavailable(curr)) {
        return true;
      }
      curr.setDate(curr.getDate() + 1);
    }
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (startDate && formatDateStr(date) === formatDateStr(startDate)) return true;
    if (endDate && formatDateStr(date) === formatDateStr(endDate)) return true;
    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate) return false;
    
    const dStr = formatDateStr(date);
    const startStr = formatDateStr(startDate);

    if (endDate) {
      const endStr = formatDateStr(endDate);
      return dStr > startStr && dStr < endStr;
    }

    if (hoverDate) {
      const hoverStr = formatDateStr(hoverDate);
      return dStr > startStr && dStr < hoverStr && date > startDate;
    }

    return false;
  };

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays: Date[] = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    const prevDate = new Date(year, month, -firstDayOfMonth + i + 1);
    calendarDays.push(prevDate);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="relative w-full">
      <label className="block text-xs font-semibold text-dark-muted uppercase tracking-wider mb-2">
        Rental Period
      </label>

      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm transition text-left cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-brand-400" />
          {startDate ? (
            <span className="font-semibold text-slate-800">
              {startDate.toLocaleDateString()}
              {endDate ? ` — ${endDate.toLocaleDateString()}` : ' (Select End Date)'}
            </span>
          ) : (
            <span className="text-slate-400">Select rental dates...</span>
          )}
        </span>
        <span className="text-xs text-brand-400 hover:underline">Change</span>
      </button>

      {showCalendar && (
        <div className="absolute left-0 right-0 mt-2 z-50 p-4 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-slate-200/90 max-w-full">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-extrabold text-sm text-slate-900">
              {monthNames[month]} {year}
            </h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 mb-2">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              const isCurrentMonthDay = date.getMonth() === month;
              const isUnavailable = isDateUnavailable(date);
              const isSelected = isDateSelected(date);
              const inRange = isDateInRange(date);

              let dayClass = "h-8 w-8 text-xs flex items-center justify-center rounded-lg transition-all mx-auto cursor-pointer ";
              
              if (!isCurrentMonthDay) {
                dayClass += "text-slate-300 pointer-events-none ";
              } else if (isUnavailable) {
                dayClass += "text-slate-400 line-through bg-slate-100/80 cursor-not-allowed ";
              } else if (isSelected) {
                dayClass += "bg-[#2a1872] text-white font-bold scale-105 shadow-md shadow-[#2a1872]/20 ";
              } else if (inRange) {
                dayClass += "bg-purple-100 text-[#2a1872] font-bold rounded-md ";
              } else {
                dayClass += "text-slate-700 hover:bg-[#2a1872]/10 hover:text-[#2a1872] font-semibold ";
              }

              return (
                <div
                  key={idx}
                  onClick={() => isCurrentMonthDay && handleDateClick(date)}
                  onMouseEnter={() => isCurrentMonthDay && setHoverDate(date)}
                  onMouseLeave={() => setHoverDate(null)}
                  className={dayClass}
                  title={isUnavailable ? 'Date booked / unavailable' : undefined}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              {startDate && `From: ${startDate.toLocaleDateString()}`}
              {endDate && ` To: ${endDate.toLocaleDateString()}`}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setShowCalendar(false);
              }}
              className="text-brand-600 hover:text-brand-700 hover:underline font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
