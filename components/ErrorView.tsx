interface ErrorViewProps {
  error: string;
  partialData?: Record<string, unknown> | null;
  onRetry: () => void;
}

export default function ErrorView({ error, partialData, onRetry }: ErrorViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-2xl font-semibold text-red-800 mb-2">
          Processing Failed
        </h2>
        <p className="text-red-600 mb-6 break-words">{error}</p>
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
      {partialData !== null && partialData !== undefined && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Partially Extracted Data
          </h3>
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(partialData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
