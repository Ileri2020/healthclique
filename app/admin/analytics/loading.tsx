import { PageSkeleton } from "@/components/skeletons";

export default function LoadingAnalytics() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <PageSkeleton />
    </div>
  );
}
