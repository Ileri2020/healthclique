import { FormSkeleton } from "@/components/skeletons";

export default function LoadingContact() {
  return (
    <div className="container mx-auto py-8 px-4 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="h-10 w-48 bg-muted animate-pulse rounded-lg mx-auto" />
          <div className="h-6 w-96 bg-muted animate-pulse rounded-lg mx-auto" />
        </div>
        <FormSkeleton />
      </div>
    </div>
  );
}
