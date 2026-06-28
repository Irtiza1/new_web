export default function ProductSkeleton() {
    return (
        <div className="group flex flex-col bg-white dark:bg-[#1b0e10] rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 animate-pulse">
            {/* Image Skeleton */}
            <div className="w-full aspect-[4/5] bg-gray-200 dark:bg-white/5" />
            
            {/* Content Skeleton */}
            <div className="p-5 flex flex-col gap-3 flex-1 justify-between">
                <div>
                    {/* Title Skeleton */}
                    <div className="h-5 bg-gray-200 dark:bg-white/10 rounded-md w-3/4 mb-2" />
                    
                    {/* Size Badges Skeleton */}
                    <div className="flex gap-2">
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-8" />
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-8" />
                        <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-8" />
                    </div>
                </div>
                
                {/* Price Skeleton */}
                <div className="h-6 bg-gray-200 dark:bg-white/10 rounded-md w-1/3 mt-2" />
            </div>
        </div>
    );
}
