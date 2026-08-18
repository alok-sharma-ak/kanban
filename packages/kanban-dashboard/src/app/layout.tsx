import './global.css';

export const metadata = {
  title: { default: 'Kanban', template: '%s · Kanban' },
  description: 'A focused workspace for planning and shipping work.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="bg-canvas">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
