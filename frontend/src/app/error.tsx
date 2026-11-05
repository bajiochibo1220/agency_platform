"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container standalone">
      <p className="eyebrow">A little interruption</p>
      <h1>We couldn’t load this page.</h1>
      <p>Check that the backend is running, then give it another try.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
      <a href="/">Back to home</a>
    </main>
  );
}
