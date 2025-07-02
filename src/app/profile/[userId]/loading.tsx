import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="w-full">
      <Skeleton className="h-48 md:h-64 w-full" />
      <div className="container mx-auto -mt-20 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:gap-8">
          <Skeleton className="h-36 w-36 rounded-full border-4 border-background" />
          <div className="mt-4 md:mt-0 flex-grow space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
