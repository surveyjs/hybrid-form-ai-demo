interface ErrorViewProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorView({ error, onRetry }: ErrorViewProps) {
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
    </div>
  );
}
