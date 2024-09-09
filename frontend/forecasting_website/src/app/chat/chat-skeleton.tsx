import React from 'react'
import { BookmarkIcon, FileTextIcon } from '@radix-ui/react-icons'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatSkeletonProps {
  showSources: boolean;
  showAnswer: boolean;
}

const ChatSkeleton: React.FC<ChatSkeletonProps> = ({ showSources, showAnswer }) => (
  <div>
    {showSources && (
      <div>
        <p className='mb-2 flex items-center text-sm font-semibold'>
          <BookmarkIcon className='mr-2 size-4' /> Sources
        </p>
        <div className='grid grid-cols-4 gap-2'>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className='h-20 w-full rounded-xl' key={index} />
          ))}
        </div>
      </div>
    )}
    {showAnswer && (
      <div className='mt-4'>
        <p className='flex items-center gap-2 py-3 text-lg font-semibold'>
          <FileTextIcon className='size-5' /> Answer
        </p>
        <Skeleton className='h-20 w-full rounded-3xl' />
      </div>
    )}
  </div>
)

export default ChatSkeleton