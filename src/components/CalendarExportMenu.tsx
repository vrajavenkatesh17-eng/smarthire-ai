import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Download, ExternalLink } from "lucide-react";
import {
  createInterviewCalendarEvent,
  downloadICSFile,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateYahooCalendarUrl,
  InterviewCalendarData,
} from "@/lib/calendarUtils";
import { toast } from "sonner";

interface CalendarExportMenuProps {
  interview: InterviewCalendarData;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export const CalendarExportMenu = ({ 
  interview, 
  variant = "outline",
  size = "sm" 
}: CalendarExportMenuProps) => {
  const event = createInterviewCalendarEvent(interview);

  const handleGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, "_blank");
    toast.success("Opening Google Calendar");
  };

  const handleOutlookCalendar = () => {
    const url = generateOutlookCalendarUrl(event);
    window.open(url, "_blank");
    toast.success("Opening Outlook Calendar");
  };

  const handleYahooCalendar = () => {
    const url = generateYahooCalendarUrl(event);
    window.open(url, "_blank");
    toast.success("Opening Yahoo Calendar");
  };

  const handleDownloadICS = () => {
    const filename = `interview-${interview.candidateName.replace(/\s+/g, "-").toLowerCase()}.ics`;
    downloadICSFile(event, filename);
    toast.success("Calendar file downloaded");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleGoogleCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlookCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Outlook Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleYahooCalendar}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Yahoo Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
