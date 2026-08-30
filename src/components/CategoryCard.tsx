"use client";

import Link from "next/link";
import { 
  Gamepad2, Wrench, Library, Layout, Sliders, Cpu, Puzzle, Box 
} from "lucide-react";
import { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  "gamepad-2": Gamepad2,
  wrench: Wrench,
  library: Library,
  layout: Layout,
  sliders: Sliders,
  cpu: Cpu,
  puzzle: Puzzle,
  box: Box,
};

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export function CategoryCard({ category, className }: CategoryCardProps) {
  const Icon = iconMap[category.icon] || Box;

  return (
    <Link
      href={`/store?category=${category.slug}`}
      className={cn(
        "group flex items-center gap-4 p-4 rounded-xl bg-aiku-card border border-aiku-border/50 transition-all duration-300 hover:border-aiku-accent/30 hover:bg-aiku-cardHover",
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-aiku-accent/10 flex items-center justify-center shrink-0 group-hover:bg-aiku-accent/20 transition-colors">
        <Icon className="w-6 h-6 text-aiku-accent" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-aiku-text group-hover:text-aiku-accent transition-colors truncate">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-sm text-aiku-muted line-clamp-1 mt-0.5">
            {category.description}
          </p>
        )}
      </div>
    </Link>
  );
}
