import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
      <Link 
        href="/" 
        className="flex items-center gap-1.5 text-text-muted hover:text-info transition-colors"
      >
        <Home size={12} strokeWidth={3} />
        <span>Hub</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight size={10} className="text-card-border" strokeWidth={4} />
          {item.href ? (
            <Link 
              href={item.href} 
              className="text-text-muted hover:text-info transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-text-primary">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
