"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">{error.digest ? `Error reference: ${error.digest}` : "Please try again."}</p>
      <button onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
