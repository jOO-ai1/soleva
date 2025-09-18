import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  width = '100%', 
  height = '1rem', 
  rounded = false 
}) => (
  <div
    className={`bg-gray-200 animate-pulse ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
    style={{ width, height }}
  />
);

export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
    <Skeleton height="200px" className="w-full" />
    <div className="p-4 space-y-3">
      <Skeleton height="1.25rem" width="80%" />
      <Skeleton height="1rem" width="60%" />
      <div className="flex justify-between items-center">
        <Skeleton height="1.5rem" width="40%" />
        <Skeleton height="2rem" width="3rem" rounded />
      </div>
    </div>
  </div>
);

export const HomePageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50">
    {/* Header skeleton */}
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Skeleton height="2rem" width="8rem" />
          <div className="flex space-x-4">
            <Skeleton height="2rem" width="6rem" />
            <Skeleton height="2rem" width="6rem" />
            <Skeleton height="2rem" width="6rem" />
          </div>
        </div>
      </div>
    </div>

    {/* Hero section skeleton */}
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 h-96 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Skeleton height="3rem" width="24rem" className="mx-auto" />
        <Skeleton height="1.5rem" width="32rem" className="mx-auto" />
        <Skeleton height="3rem" width="12rem" className="mx-auto rounded-full" />
      </div>
    </div>

    {/* Products grid skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton height="2.5rem" width="16rem" className="mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
