import { ProductGridSkeleton } from "@/components/skeletons";

export default function LoadingBlog() {
  return (
    <div className="container mx-auto py-10 px-4 min-h-screen">
      <div className="flex flex-col items-center mb-12 text-center space-y-4">
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mx-auto" />
        <div className="h-6 w-96 bg-muted animate-pulse rounded-lg mx-auto" />
      </div>
      <div className="flex gap-8">
        <div className="w-1/4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
        <div className="w-3/4">
          <ProductGridSkeleton count={6} />
        </div>
      </div>
    </div>
  );
}
