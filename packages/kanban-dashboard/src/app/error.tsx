'use client';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center px-4"><Card className="max-w-md p-8 text-center"><p className="text-sm font-medium text-red-300">Something went wrong</p><h1 className="mt-2 text-2xl font-semibold">The workspace could not be loaded.</h1><p className="mt-3 text-sm text-muted">Check the API connection and try again.</p><Button className="mt-6" onClick={reset}>Try again</Button></Card></main>;
}
