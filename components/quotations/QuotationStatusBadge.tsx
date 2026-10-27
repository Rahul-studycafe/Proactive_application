import { Badge } from "@/components/ui/badge";
import { QuotationStatus } from "@/lib/types/quotation";
import {
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  FileCheck,
  HelpCircle,
} from "lucide-react";

interface QuotationStatusBadgeProps {
  status: QuotationStatus | string;
  className?: string;
  showIcon?: boolean;
}

export function QuotationStatusBadge({
  status,
  className = "",
  showIcon = true,
}: QuotationStatusBadgeProps) {
  switch (status) {
    case "Draft":
      return (
        <Badge
          variant="outline"
          className={`border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 font-medium ${className}`}
        >
          {showIcon && <Clock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />}
          Draft
        </Badge>
      );
    case "Sent":
      return (
        <Badge
          variant="outline"
          className={`border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-medium ${className}`}
        >
          {showIcon && <Send className="mr-1.5 h-3.5 w-3.5 text-blue-500" />}
          Sent
        </Badge>
      );
    case "Accepted":
      return (
        <Badge
          variant="outline"
          className={`border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 font-medium ${className}`}
        >
          {showIcon && (
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
          )}
          Accepted
        </Badge>
      );
    case "Declined":
      return (
        <Badge
          variant="outline"
          className={`border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-medium ${className}`}
        >
          {showIcon && <XCircle className="mr-1.5 h-3.5 w-3.5 text-rose-500" />}
          Declined
        </Badge>
      );
    case "Converted":
      return (
        <Badge
          variant="outline"
          className={`border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 font-medium ${className}`}
        >
          {showIcon && (
            <FileCheck className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
          )}
          Converted
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className={`border-muted bg-muted/50 text-muted-foreground ${className}`}
        >
          {showIcon && <HelpCircle className="mr-1.5 h-3.5 w-3.5" />}
          {status}
        </Badge>
      );
  }
}
