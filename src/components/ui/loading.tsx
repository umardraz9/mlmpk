import { Loader2 } from 'lucide-react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export function Loading({ size = 'md', text, className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-green-600`} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  )
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-200 rounded-md h-4 w-full mb-2"></div>
      <div className="bg-gray-200 rounded-md h-4 w-3/4 mb-2"></div>
      <div className="bg-gray-200 rounded-md h-4 w-1/2"></div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="bg-gray-200 rounded h-6 w-3/4 mb-2"></div>
          <div className="bg-gray-200 rounded h-4 w-full mb-2"></div>
          <div className="bg-gray-200 rounded h-4 w-2/3"></div>
        </div>
        <div className="bg-gray-200 rounded h-8 w-16"></div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="bg-gray-200 rounded-full h-6 w-16"></div>
        <div className="bg-gray-200 rounded-full h-6 w-20"></div>
        <div className="bg-gray-200 rounded-full h-6 w-14"></div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <div className="bg-gray-200 rounded w-4 h-4"></div>
            <div className="bg-gray-200 rounded h-4 w-16"></div>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="bg-gray-200 rounded h-4 w-24"></div>
        <div className="flex space-x-2">
          <div className="bg-gray-200 rounded h-8 w-20"></div>
          <div className="bg-gray-200 rounded h-8 w-16"></div>
          <div className="bg-gray-200 rounded h-8 w-18"></div>
        </div>
      </div>
    </div>
  )
}
