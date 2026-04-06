import { CartPageSkeleton } from "@/components/skeletons";

export default function LoadingCart() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CartPageSkeleton />
    </div>
  );
}
