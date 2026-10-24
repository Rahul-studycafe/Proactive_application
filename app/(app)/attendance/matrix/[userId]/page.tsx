import { StaffSummaryPageView } from "@/components/attendance/StaffSummaryPageView";

export const metadata = {
  title: "Staff Attendance Summary | Proactive SaaS",
  description:
    "Comprehensive employee monthly attendance breakdown, payable days audit, and punch history.",
};

export default async function StaffAttendanceSummaryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <StaffSummaryPageView userId={userId} />;
}
