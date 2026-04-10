export function LoadingSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
