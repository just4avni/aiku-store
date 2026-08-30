"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Menu,
  X,
  Search,
  User,
  LogOut,
  Shield,
  Store,
  Home,
  Grid3X3,
  Crown,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: adminRole } = await supabase
          .from("admin_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        setIsAdmin(!!adminRole);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          supabase.from("admin_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single()
            .then(({ data }) => setIsAdmin(!!data));
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/store", label: "Store", icon: Store },
    { href: "/categories", label: "Categories", icon: Grid3X3 },
    { href: "/vvip", label: "VVIP", icon: Crown },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-aiku-bg/90 backdrop-blur-xl border-b border-aiku-border/50"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Package className="w-7 h-7 text-aiku-accent group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">
              Aiku <span className="text-aiku-accent">Store</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive(link.href)
                    ? "text-aiku-accent bg-aiku-accent/10"
                    : "text-aiku-muted hover:text-aiku-text hover:bg-aiku-card"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/store"
              className="p-2 rounded-lg text-aiku-muted hover:text-aiku-text hover:bg-aiku-card transition-all"
            >
              <Search className="w-5 h-5" />
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className="p-2 rounded-lg text-aiku-muted hover:text-aiku-accent hover:bg-aiku-accent/10 transition-all"
              >
                <Shield className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    pathname.startsWith("/account")
                      ? "bg-aiku-accent/10 text-aiku-accent"
                      : "bg-aiku-card text-aiku-text hover:bg-aiku-cardHover"
                  )}
                >
                  <User className="w-4 h-4" />
                  Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-aiku-muted hover:text-aiku-danger hover:bg-aiku-danger/10 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-lg bg-aiku-accent text-aiku-bg font-semibold text-sm hover:bg-aiku-accentHover transition-all hover:shadow-lg hover:shadow-aiku-accent/20"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-aiku-muted hover:text-aiku-text hover:bg-aiku-card transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-aiku-bg/95 backdrop-blur-xl border-b border-aiku-border/50">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive(link.href)
                    ? "text-aiku-accent bg-aiku-accent/10"
                    : "text-aiku-muted hover:text-aiku-text hover:bg-aiku-card"
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}

            <div className="pt-2 border-t border-aiku-border/50">
              {user ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-aiku-text hover:bg-aiku-card"
                  >
                    <User className="w-5 h-5" />
                    Account
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-aiku-text hover:bg-aiku-card"
                    >
                      <Shield className="w-5 h-5" />
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-aiku-danger hover:bg-aiku-danger/10 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-aiku-accent text-aiku-bg font-semibold text-sm"
                >
                  <User className="w-5 h-5" />
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
