import { FormSkeleton } from "@/components/skeletons";

export default function LoadingLogin() {
  return (
    <div className="mt-10 max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-card border border-border">
      <FormSkeleton />
    </div>
  );
}
