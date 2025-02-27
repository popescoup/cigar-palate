'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import AxiosInterceptorSetup from './components/AxiosInterceptorSetup';
import { AgeGate } from '@/components/AgeGate';
import LoadingSpinner from './components/loading';

// Separate the content that might use useSearchParams
function ClientLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AgeGate>
      <AxiosInterceptorSetup />
      <header>
        <Navbar />
      </header>
      <main className="flex-1 bg-white">
        {children}
      </main>
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
          {/* Footer Navigation */}
          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 pb-6 border-b border-gray-200">
            {/* Main Navigation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Navigation</h3>
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/discover"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Discover
                </Link>
                <Link 
                  href="/cigars"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  All Cigars
                </Link>
                <Link 
                  href="/brands"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  All Brands
                </Link>
                <Link 
                  href="/forum"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Forum
                </Link>
                <Link 
                  href="/about"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  About
                </Link>
              </div>
            </div>

            {/* Legal Links */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
              <div className="flex flex-col space-y-2">
                <Link 
                  href="/terms"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </Link>
                <Link 
                  href="/privacy"
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          </nav>

          {/* Copyright and Affiliate Disclosure */}
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} CigarPalate.com. All rights reserved.
            </p>
            <p className="text-xs text-gray-500">
              This site contains affiliate links. When you make purchases through these links, 
              we may earn a commission at no additional cost to you. All reviews and opinions 
              remain independent and unbiased.
            </p>
          </div>
        </div>
      </footer>
    </AgeGate>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<LoadingSpinner isGlobal size="md" delay={50} />}>
      <ClientLayoutContent>
        {children}
      </ClientLayoutContent>
    </Suspense>
  );
}