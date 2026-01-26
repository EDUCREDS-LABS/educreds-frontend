import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  FileText,
  Shield,
  CreditCard,
  LogOut,
  User,
  Wallet,
  Store,
  Palette,
  Settings,
  Upload,
  BarChart3,
  Zap,
  Award,
  Vote
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
  { name: "Certificates", href: "/institution/certificates", icon: FileText },
  { name: "Verification", href: "/institution/verification", icon: Shield },
  { name: "Subscription", href: "/institution/subscription", icon: CreditCard },
  { name: "Profile", href: "/institution/profile", icon: User },
  { name: "Templates", href: "/institution/templates", icon: Palette },
  { name: "Issuance", href: "/certificate-issuance", icon: Zap },
  { name: "Analytics", href: "/institution/analytics", icon: BarChart3 },
  { name: "Governance", href: "/institution/governance", icon: Vote },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Link href="/dashboard">
                  <div className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="h-9 w-9 bg-primary rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-xl font-bold text-primary" data-testid="logo">
                        EduCreds
                      </h1>
                      <span className="text-xs text-neutral-500 font-medium -mt-0.5">Blockchain Certification</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <button
                    className={`${isActive(item.href)
                      ? "text-primary border-b-2 border-primary font-medium"
                      : "text-neutral-600 hover:text-neutral-900"
                      } transition-colors`}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    {item.name}
                  </button>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/student">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                  data-testid="student-portal-btn"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Student Portal
                </Button>
              </Link>

              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right text-sm">
                  <div className="font-medium text-neutral-900" data-testid="institution-name">
                    {user?.name}
                  </div>
                  <div className="text-neutral-500">
                    {user?.isVerified ? "Verified Institution" : "Pending Verification"}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user?.name?.charAt(0) || "I"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-4">
                    {navigation.map((item) => (
                      <Link key={item.name} href={item.href}>
                        <button
                          className={`flex items-center space-x-2 w-full p-2 rounded-lg text-left ${isActive(item.href)
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-neutral-100"
                            }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </button>
                      </Link>
                    ))}

                    <Button
                      onClick={logout}
                      variant="ghost"
                      className="justify-start"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>


    </div>
  );
}
