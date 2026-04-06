import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHelp() {
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen space-y-8">
      <div className="text-center space-y-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mx-auto" />
        <div className="h-6 w-96 bg-muted animate-pulse rounded-lg mx-auto" />
      </div>
      <div className="grid gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
