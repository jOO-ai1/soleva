/**
 * Working Hours Configuration and Utilities
 * Handles time-based availability for Live Chat vs AI Chat
 */

export interface WorkingHours {
  timezone: string;
  days: {
    [key: string]: {
      start: string; // Format: "HH:MM"
      end: string; // Format: "HH:MM"
      enabled: boolean;
    };
  };
}

// Default working hours configuration
export const DEFAULT_WORKING_HOURS: WorkingHours = {
  timezone: 'Africa/Cairo', // Egypt timezone
  days: {
    saturday: { start: '09:00', end: '18:00', enabled: true },
    sunday: { start: '09:00', end: '18:00', enabled: true },
    monday: { start: '09:00', end: '18:00', enabled: true },
    tuesday: { start: '09:00', end: '18:00', enabled: true },
    wednesday: { start: '09:00', end: '18:00', enabled: true },
    thursday: { start: '09:00', end: '18:00', enabled: true },
    friday: { start: '09:00', end: '18:00', enabled: false } // Friday is off
  }
};

export interface ChatAvailability {
  isLiveChatAvailable: boolean;
  isAIAvailable: boolean;
  nextAvailableTime?: Date;
  currentMode: 'AI' | 'LIVE';
  message?: string;
}

/**
 * Get the current day name in English
 */
function getCurrentDayName(): string {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[now.getDay()];
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get current time in minutes since midnight for the configured timezone
 */
function getCurrentTimeInMinutes(timezone: string): number {
  const now = new Date();
  const timeInTimezone = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return timeInTimezone.getHours() * 60 + timeInTimezone.getMinutes();
}

/**
 * Check if current time is within working hours
 */
export function isWithinWorkingHours(workingHours: WorkingHours = DEFAULT_WORKING_HOURS): boolean {
  const currentDay = getCurrentDayName();
  const dayConfig = workingHours.days[currentDay];

  if (!dayConfig || !dayConfig.enabled) {
    return false;
  }

  const currentTime = getCurrentTimeInMinutes(workingHours.timezone);
  const startTime = timeToMinutes(dayConfig.start);
  const endTime = timeToMinutes(dayConfig.end);

  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Get the next available time for Live Chat
 */
export function getNextAvailableTime(workingHours: WorkingHours = DEFAULT_WORKING_HOURS): Date | null {
  const now = new Date();
  const timezone = workingHours.timezone;

  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);

    const dayName = checkDate.toLocaleDateString('en-US', {
      weekday: 'long',
      timeZone: timezone
    }).toLowerCase();

    const dayConfig = workingHours.days[dayName];

    if (dayConfig && dayConfig.enabled) {
      const [startHour, startMinute] = dayConfig.start.split(':').map(Number);
      const nextAvailable = new Date(checkDate);
      nextAvailable.setHours(startHour, startMinute, 0, 0);

      // If it's today and we're past the start time, check if we're before end time
      if (i === 0) {
        const currentTime = getCurrentTimeInMinutes(timezone);
        const startTime = timeToMinutes(dayConfig.start);
        const endTime = timeToMinutes(dayConfig.end);

        if (currentTime < endTime) {
          // Still within today's working hours
          return now;
        }
      } else {
        // Future day
        return nextAvailable;
      }
    }
  }

  return null;
}

/**
 * Get chat availability status
 */
export function getChatAvailability(
workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
language: 'en' | 'ar' = 'en')
: ChatAvailability {
  const isLiveChatAvailable = isWithinWorkingHours(workingHours);
  const isAIAvailable = true; // AI is always available
  const nextAvailableTime = getNextAvailableTime(workingHours);

  let currentMode: 'AI' | 'LIVE' = 'AI';
  let message = '';

  if (isLiveChatAvailable) {
    currentMode = 'LIVE';
  } else {
    currentMode = 'AI';

    if (nextAvailableTime) {
      const nextTimeStr = nextAvailableTime.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
        timeZone: workingHours.timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });

      message = language === 'ar' ?
      `وكلاؤنا المباشرون غير متاحين حالياً. يرجى ترك رسالة أو التحدث مع مساعدنا الذكي. سيكونون متاحين ${nextTimeStr}` :
      `Our live agents are currently offline. Please leave a message or chat with our AI Assistant. They will be available ${nextTimeStr}`;
    } else {
      message = language === 'ar' ?
      'وكلاؤنا المباشرون غير متاحين حالياً. يرجى ترك رسالة أو التحدث مع مساعدنا الذكي.' :
      'Our live agents are currently offline. Please leave a message or chat with our AI Assistant.';
    }
  }

  return {
    isLiveChatAvailable,
    isAIAvailable,
    nextAvailableTime,
    currentMode,
    message
  };
}

/**
 * Format working hours for display
 */
export function formatWorkingHours(workingHours: WorkingHours = DEFAULT_WORKING_HOURS, language: 'en' | 'ar' = 'en'): string {
  const enabledDays = Object.entries(workingHours.days).
  filter(([_, config]) => config.enabled).
  map(([day, config]) => {
    const dayName = language === 'ar' ?
    getArabicDayName(day) :
    day.charAt(0).toUpperCase() + day.slice(1);

    return `${dayName}: ${config.start} - ${config.end}`;
  });

  return enabledDays.join('\n');
}

/**
 * Get Arabic day name
 */
function getArabicDayName(day: string): string {
  const arabicDays: {[key: string]: string;} = {
    saturday: 'السبت',
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة'
  };

  return arabicDays[day] || day;
}

/**
 * Simulate time for testing purposes
 */
export function simulateTime(date: Date, workingHours: WorkingHours = DEFAULT_WORKING_HOURS): ChatAvailability {
  const originalDate = Date;

  // Mock Date constructor for testing
  (global as any).Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(date);
      } else {
        super(...args);
      }
    }

    static now() {
      return date.getTime();
    }
  };

  const availability = getChatAvailability(workingHours, 'en');

  // Restore original Date
  (global as any).Date = originalDate;

  return availability;
}