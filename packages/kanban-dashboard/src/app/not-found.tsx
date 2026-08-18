import Link from 'next/link';
import { Card } from '../components/ui/card';
export default function NotFound() { return <main className="grid min-h-screen place-items-center px-4"><Card className="max-w-md p-8 text-center"><p className="text-sm font-semibold text-violet-300">404</p><h1 className="mt-2 text-2xl font-semibold">Page not found</h1><p className="mt-3 text-sm text-muted">This workspace page does not exist.</p><Link href="/dashboard" className="mt-6 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">Return to dashboard</Link></Card></main>; }
