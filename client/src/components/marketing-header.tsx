import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/how-it-works", label: "How it works", testId: "nav-how-it-works" },
  { href: "/for-families", label: "For families", testId: "nav-for-families" },
  { href: "/for-professionals", label: "For professionals", testId: "nav-for-professionals" },
  { href: "/demo", label: "Sample", testId: "nav-demo" },
];

function isActive(path: string, href: string) {
  return path === href;
}

export function MarketingHeader() {
  const [path] = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/" className="rounded-md" aria-label="Evenkeep home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Marketing">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(path, item.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              data-testid={item.testId}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open menu"
                data-testid="button-nav-menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(22rem,90vw)]">
              <SheetHeader>
                <SheetTitle className="font-serif text-left">Evenkeep</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1" aria-label="Marketing">
                {NAV.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "rounded-lg px-3 py-3 text-base",
                        isActive(path, item.href)
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Link href="/login" className="rounded-lg px-3 py-3 text-base text-muted-foreground">
                    Sign in
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link href="/account" className="mt-2">
                    <Button className="w-full text-base">Create your estate</Button>
                  </Link>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>

          <Link href="/login">
            <Button
              variant="ghost"
              className="text-base text-muted-foreground hover:text-foreground"
              data-testid="link-signin"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/account">
            <Button
              className="hidden text-base shadow-sm sm:inline-flex"
              data-testid="link-create-estate"
            >
              Create your estate
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
