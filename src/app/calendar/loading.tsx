import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 md:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-full lg:max-w-none">
        <div className="lg:col-span-2">
            <Skeleton className="w-full h-full min-h-[720px] rounded-lg" />
        </div>
        <div className="lg:col-span-1 max-h-[80vh] flex flex-col">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="space-y-4 overflow-y-auto pr-2 flex-grow">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border p-4 rounded-lg space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
