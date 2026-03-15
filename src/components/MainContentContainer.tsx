import { ReactNode } from 'react';

interface MainContentContainerProps {
  children: ReactNode;
  title?: string;
}

export function MainContentContainer({ children, title }: MainContentContainerProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {title && (
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 z-10">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        <div className="px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
