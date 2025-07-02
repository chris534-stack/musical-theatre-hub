import { Skeleton } from '@/components/ui/skeleton';

export default function ReviewsLoading() {
  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <Skeleton className="h-12 w-1/2 mx-auto mb-3" />
        <Skeleton className="h-6 w-3/4 mx-auto" />
      </div>

      <div className="mb-16">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      <div className="space-y-12">
        <div>
          <Skeleton className="h-9 w-1/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-9 w-1/2 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
