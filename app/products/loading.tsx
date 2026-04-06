import { ProductGridSkeleton } from "@/components/skeletons";

export default function LoadingProducts() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8 space-y-4">
        <div className="h-10 w-40 bg-muted animate-pulse rounded-lg" />
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}
