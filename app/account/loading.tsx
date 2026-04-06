import { ProfileSkeleton } from "@/components/skeletons";

export default function LoadingAccount() {
  return (
    <div className="min-h-screen space-y-8 p-4 md:p-8">
      <ProfileSkeleton />
      <ProfileSkeleton />
      <ProfileSkeleton />
    </div>
  );
}
