'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import Logout from './Logout';
import NotificationBell from '@/components/notifications/NotificationBell';
import { api } from '@/utils/axiosConfig';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import LoadingSpinner from './loading';

// Separate the loading skeleton into its own component
function NavbarSkeleton() {
  return (
    <nav className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto">
        <div className="animate-pulse h-16"></div>
      </div>
    </nav>
  );
}

// Separate the main content to manage loading state
function NavbarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await api.get('/api/auth/status', { 
          withCredentials: true 
        });
        setIsLoggedIn(response.data.isLoggedIn);
        setIsAdmin(response.data.user?.isAdmin || false);
      } catch (error) {
        console.error('Failed to check auth status', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=all`);
    }
  };

  const handleAddCigarClick = (e: React.MouseEvent) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push('/auth-required');
    }
  };

  if (loading) {
    return <NavbarSkeleton />;
  }

  const NavLink = ({ href, onClick, children }: { href: string; onClick?: (e: React.MouseEvent) => void; children: React.ReactNode }) => {
    const isActive = href === pathname || (href !== '/' && pathname.startsWith(href));
    
    return (
      <Link 
        href={href}
        onClick={onClick}
        className={`relative text-sm font-medium transition-all duration-200 px-3 py-2 rounded-md ${
          isActive
            ? "text-gray-900 bg-gray-100/60" 
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
        }`}
      >
        {children}
        {isActive && (
          <span className="absolute bottom-0 left-0 h-0.5 w-full bg-indigo-500 rounded-full"></span>
        )}
      </Link>
    );
  };

  return (
    <nav className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu Button */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200">
                <Menu className="h-5 w-5 text-gray-700" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[250px] border-r border-gray-200 shadow-lg">
              <div className="flex flex-col gap-2 mt-6">
                <div className="px-3 py-2 mb-4 text-xs uppercase font-semibold text-gray-500">Navigation</div>
                <Link 
                  href="/"
                  onClick={() => setIsSheetOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === "/" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/discover"
                  onClick={() => setIsSheetOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === "/discover" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Discover
                </Link>
                <Link 
                  href="/cigars"
                  onClick={() => setIsSheetOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === "/cigars" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  All Cigars
                </Link>
                <Link 
                  href="/brands"
                  onClick={() => setIsSheetOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === "/brands" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  All Brands
                </Link>
                <Link 
                  href="/forum"
                  onClick={() => setIsSheetOpen(false)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname.startsWith("/forum") ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Forum
                </Link>
                <Link 
                  href="/add-cigar"
                  onClick={(e) => {
                    handleAddCigarClick(e);
                    setIsSheetOpen(false);
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    pathname === "/add-cigar" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Add Cigar
                </Link>
                
                {isLoggedIn && (
                  <>
                    <div className="px-3 py-2 mt-4 mb-2 text-xs uppercase font-semibold text-gray-500">Account</div>
                    {isAdmin && (
                      <Link 
                        href="/admin/pending-approvals"
                        onClick={() => setIsSheetOpen(false)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                          pathname.startsWith("/admin") ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <Link 
                      href="/profile"
                      onClick={() => setIsSheetOpen(false)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        pathname === "/profile" ? "text-indigo-600 bg-indigo-50" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      My Profile
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex items-center space-x-1">
            <li><NavLink href="/">Home</NavLink></li>
            <li><NavLink href="/discover">Discover</NavLink></li>
            <li><NavLink href="/cigars">All Cigars</NavLink></li>
            <li><NavLink href="/brands">All Brands</NavLink></li>
            <li><NavLink href="/forum">Forum</NavLink></li>
            <li><NavLink href="/add-cigar" onClick={handleAddCigarClick}>Add Cigar</NavLink></li>
          </ul>

          {/* Search Bar */}
          <div className="flex-1 max-w-full md:max-w-md mx-2 md:mx-8">
            <form onSubmit={handleSearch} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" strokeWidth={2} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cigars and discussions..."
                  className="w-full py-2 pl-10 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-transparent transition-shadow duration-200"
                />
              </div>
            </form>
          </div>

          {/* Auth Navigation */}
          <ul className="flex items-center space-x-1 md:space-x-2">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                  <li className="hidden md:block">
                    <NavLink href="/admin/pending-approvals">Admin Panel</NavLink>
                  </li>
                )}
                <li className="hidden md:block">
                  <NavLink href="/profile">My Profile</NavLink>
                </li>
                <li className="flex items-center justify-center">
                  <div className="p-1.5 rounded-full hover:bg-gray-100 transition-colors duration-200">
                    <NotificationBell />
                  </div>
                </li>
                <li>
                  <Logout />
                </li>
              </>
            ) : (
              <>
                <li className="hidden md:block">
                  <Link 
                    href="/register" 
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/login" 
                    className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md shadow-sm transition-colors duration-200"
                  >
                    Login
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Main Navbar component with Suspense
export default function Navbar() {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarContent />
    </Suspense>
  );
}