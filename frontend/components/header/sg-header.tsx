import Image from 'next/image';

export function SocialGardenHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1CBF79]/20 bg-[#0e2e33]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0e2e33]/80">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">Social Garden</span>
            <span className="text-xs text-gray-300">SOW Generator</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden sm:inline text-sm text-gray-400 font-medium">
            Powered by AI
          </span>
          <div className="h-2 w-2 rounded-full bg-[#1CBF79] animate-pulse"></div>
        </div>
      </div>
    </header>
  );
}
