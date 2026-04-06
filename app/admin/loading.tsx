import { TableSkeleton, PageSkeleton } from "@/components/skeletons";

export default function LoadingAdmin() {
  return (
    <div className="w-[100vw] p-4">
      <div className="text-4xl font-semibold w-full text-center mb-6">
        Admin Dashboard
      </div>
      <PageSkeleton />
      <div className="mt-12 space-y-6">
        <TableSkeleton rows={8} columns={4} />
      </div>
    </div>
  );
}
