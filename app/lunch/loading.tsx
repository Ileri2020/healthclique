import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingLunch() {
  return (
    <div className="w-[100vw] overflow-clip p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <Skeleton className="h-12 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
