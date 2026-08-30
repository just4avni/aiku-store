"use client";

import Link from "next/link";
import Image from "next/image";
import { Download, Lock, Eye, Crown, User } from "lucide-react";
import { Product } from "@/lib/types";
import { formatPrice, formatFileSize, getAccessTypeLabel, getAccessTypeColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const accessIcons = {
    public: null,
    account: <User className="w-3.5 h-3.5" />,
    premium: <Lock className="w-3.5 h-3.5" />,
    vvip: <Crown className="w-3.5 h-3.5" />,
  };

  return (
    <Link
      href={`/store/${product.slug}`}
      className={cn(
        "group block rounded-xl bg-aiku-card border border-aiku-border/50 overflow-hidden transition-all duration-300 hover:border-aiku-accent/30 hover-glow",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden bg-aiku-bg">
        {product.thumbnail_url ? (
          <Image
            src={product.thumbnail_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-aiku-card to-aiku-bg">
            <div className="w-16 h-16 rounded-2xl bg-aiku-accent/10 flex items-center justify-center">
              <Eye className="w-8 h-8 text-aiku-accent/50" />
            </div>
          </div>
        )}

        {/* Access Badge */}
        <div className="absolute top-3 left-3">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md",
            getAccessTypeColor(product.access_type)
          )}>
            {accessIcons[product.access_type]}
            {getAccessTypeLabel(product.access_type)}
          </span>
        </div>

        {/* Featured Badge */}
        {product.is_featured && (
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-aiku-accent/20 text-aiku-accent backdrop-blur-md">
              Featured
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-aiku-text group-hover:text-aiku-accent transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-aiku-accent shrink-0">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-sm text-aiku-muted line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.short_description || product.description || "No description available"}
        </p>

        <div className="flex items-center justify-between text-xs text-aiku-dim">
          <div className="flex items-center gap-3">
            {product.category && (
              <span className="px-2 py-0.5 rounded-md bg-aiku-bg text-aiku-muted">
                {product.category.name}
              </span>
            )}
            {product.version && (
              <span>v{product.version}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            <span>{product.download_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
