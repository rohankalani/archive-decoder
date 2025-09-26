import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

// Building card skeleton
function BuildingCardSkeleton() {
  return (
    <div className="bg-card border-2 border-border/20 rounded-lg p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      
      <div className="text-center p-4 rounded-lg bg-muted/30 space-y-2">
        <Skeleton className="h-4 w-20 mx-auto" />
        <Skeleton className="h-10 w-16 mx-auto" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
      </div>
    </div>
  );
}

// Device card skeleton
function DeviceCardSkeleton() {
  return (
    <div className="bg-card border-2 border-border/20 rounded-lg aspect-[4/3]">
      <div className="p-4 space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-2 w-2 rounded-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* AQI Display */}
        <div className="text-center flex-1 flex flex-col justify-center space-y-2">
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-12 w-16 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading grid skeletons
function BuildingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <BuildingCardSkeleton key={i} />
      ))}
    </div>
  );
}

function DeviceGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="h-px bg-border/50" />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <DeviceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export { 
  Skeleton, 
  BuildingCardSkeleton, 
  DeviceCardSkeleton, 
  BuildingGridSkeleton, 
  DeviceGridSkeleton 
};
