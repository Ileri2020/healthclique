import { SidebarWithContentSkeleton } from "@/components/skeletons";

export default function LoadingStore() {
  return (
    <div className="w-full overflow-clip p-2 md:p-4">
      <SidebarWithContentSkeleton />
    </div>
  );
}
