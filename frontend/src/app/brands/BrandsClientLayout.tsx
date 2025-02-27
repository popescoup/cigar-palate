// app/brands/BrandsClientLayout.tsx
'use client';

export default function BrandsClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add any client-side functionality here
  return <div className="brands-layout">{children}</div>;
}