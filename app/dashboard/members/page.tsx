import { Suspense } from "react";
import { MembersPage } from "@/components/members/members-page";
import { MembersPageSkeleton } from "@/components/members/members-page-skeleton";

export default function MembersRoute() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Members</h2>
      </div>
      <Suspense fallback={<MembersPageSkeleton />}>
        <MembersPage />
      </Suspense>
    </div>
  );
}