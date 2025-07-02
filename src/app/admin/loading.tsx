import { Skeleton } from '@/components/ui/skeleton';

export default function AdminLoading() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="w-full space-y-4">
        <div className="flex space-x-1 rounded-md bg-muted p-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
        <div className="border rounded-lg">
            <Skeleton className="h-12 w-full" />
            <div className="space-y-px">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
        </div>
      </div>
    </div>
  );
}
