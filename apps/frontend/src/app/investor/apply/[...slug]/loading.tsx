export default function Loading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded mb-6"></div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex-1 mx-2">
              <div className="h-2 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <div className="h-10 w-40 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
