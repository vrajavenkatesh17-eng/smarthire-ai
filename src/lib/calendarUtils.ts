import { format } from "date-fns";

interface CalendarEvent {
  title: string;
  description: string;
  location?: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Generate ICS file content for calendar download
 */
export const generateICSFile = (event: CalendarEvent): string => {
  const formatICSDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const escapeICS = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HR Resume Analyzer//Interview Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `DTSTART:${formatICSDate(event.startTime)}`,
    `DTEND:${formatICSDate(event.endTime)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : "",
    `UID:${Date.now()}@hranalyzer.app`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Interview reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return icsContent;
};

/**
 * Download ICS file
 */
export const downloadICSFile = (event: CalendarEvent, filename: string = "interview.ics") => {
  const icsContent = generateICSFile(event);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generate Google Calendar URL
 */
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const formatGoogleDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGoogleDate(event.startTime)}/${formatGoogleDate(event.endTime)}`,
    details: event.description,
    ...(event.location && { location: event.location }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

/**
 * Generate Outlook Calendar URL (Outlook.com/Office 365)
 */
export const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    ...(event.location && { location: event.location }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};

/**
 * Generate Yahoo Calendar URL
 */
export const generateYahooCalendarUrl = (event: CalendarEvent): string => {
  const formatYahooDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss");
  };

  // Calculate duration in HHMM format
  const durationMs = event.endTime.getTime() - event.startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${String(durationHours).padStart(2, "0")}${String(durationMinutes).padStart(2, "0")}`;

  const params = new URLSearchParams({
    v: "60",
    title: event.title,
    st: formatYahooDate(event.startTime),
    dur: duration,
    desc: event.description,
    ...(event.location && { in_loc: event.location }),
  });

  return `https://calendar.yahoo.com/?${params.toString()}`;
};

export interface InterviewCalendarData {
  candidateName: string;
  interviewType: string;
  scheduledAt: Date;
  durationMinutes: number;
  location?: string | null;
  interviewerName?: string | null;
  notes?: string | null;
}

/**
 * Create calendar event from interview data
 */
export const createInterviewCalendarEvent = (interview: InterviewCalendarData): CalendarEvent => {
  const endTime = new Date(interview.scheduledAt.getTime() + interview.durationMinutes * 60 * 1000);
  
  let description = `Interview with ${interview.candidateName}\n`;
  description += `Type: ${interview.interviewType}\n`;
  description += `Duration: ${interview.durationMinutes} minutes\n`;
  if (interview.interviewerName) {
    description += `Interviewer: ${interview.interviewerName}\n`;
  }
  if (interview.notes) {
    description += `\nNotes: ${interview.notes}`;
  }

  return {
    title: `Interview: ${interview.candidateName} (${interview.interviewType})`,
    description,
    location: interview.location || undefined,
    startTime: interview.scheduledAt,
    endTime,
  };
};
