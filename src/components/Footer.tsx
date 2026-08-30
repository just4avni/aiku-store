import Link from "next/link";
import { Package, Send, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-aiku-border/50 bg-aiku-card/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Package className="w-6 h-6 text-aiku-accent" />
              <span className="text-lg font-bold">
                Aiku <span className="text-aiku-accent">Store</span>
              </span>
            </Link>
            <p className="text-aiku-muted text-sm leading-relaxed">
              Premium digital assets marketplace. Discover, access, and manage high-quality digital resources.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-aiku-muted mb-4">
              Navigation
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/store", label: "Store" },
                { href: "/categories", label: "Categories" },
                { href: "/vvip", label: "VVIP Access" },
                { href: "/account", label: "My Account" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-aiku-muted hover:text-aiku-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-aiku-muted mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/support", label: "Help Center" },
                { href: "/terms", label: "Terms of Service" },
                { href: "/privacy", label: "Privacy Policy" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-aiku-muted hover:text-aiku-text transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="https://t.me/ebpff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-aiku-accent hover:text-aiku-accentHover transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  @ebpff
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-aiku-muted mb-4">
              Contact
            </h3>
            <p className="text-sm text-aiku-muted mb-4">
              Need help with your purchase or have questions? Reach out to our support team.
            </p>
            <a
              href="https://t.me/ebpff"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-aiku-card border border-aiku-border text-sm font-medium text-aiku-text hover:border-aiku-accent/50 hover:bg-aiku-cardHover transition-all"
            >
              <Send className="w-4 h-4 text-aiku-accent" />
              Contact Support
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-aiku-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-aiku-dim">
            &copy; {new Date().getFullYear()} Aiku Store. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-aiku-dim hover:text-aiku-muted transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-aiku-dim hover:text-aiku-muted transition-colors">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
