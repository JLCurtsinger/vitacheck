
export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-pulse text-xl bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
        Analyzing interactions across multiple databases...
      </div>
    </div>
  );
}
