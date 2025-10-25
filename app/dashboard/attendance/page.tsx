import { Suspense } from "react";
import { AttendanceDashboard } from "@/components/attendance/attendance-dashboard";
import { AttendanceDashboardSkeleton } from "@/components/attendance/attendance-dashboard-skeleton";

export default function AttendanceRoute() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
      </div>
      <Suspense fallback={<AttendanceDashboardSkeleton />}>
        <AttendanceDashboard />
      </Suspense>
    </div>
  );
}