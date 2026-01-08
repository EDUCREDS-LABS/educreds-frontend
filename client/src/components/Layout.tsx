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
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navigation = [
  { name: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
  { name: "Certificates", href: "/institution/certificates", icon: FileText },
  { name: "Verification", href: "/institution/verification", icon: Shield },
  { name: "Subscription", href: "/institution/subscription", icon: CreditCard },
  { name: "Profile", href: "/institution/profile", icon: User },
  { name: "Templates", href: "/institution/templates", icon: Palette },
  { name: "Analytics", href: "/institution/analytics", icon: BarChart3 },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (href: string) => location === href;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Link href="/dashboard">
                  <div className="flex items-center space-x-2">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="16" cy="16" r="16" fill="url(#logo-gradient)" />
                      <path d="M10 22L16 10L22 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <defs>
                        <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366F1" />
                          <stop offset="1" stopColor="#06B6D4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent animate-gradient-move drop-shadow-sm" data-testid="logo">
                      EduCreds
                    </h1>
                  </div>
                  <span className="text-xs text-neutral-500">Blockchain Certificates</span>
                </Link>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link key={item.name} href={item.href}>
                  <button
                    className={`${
                      isActive(item.href)
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
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
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
                          className={`flex items-center space-x-2 w-full p-2 rounded-lg text-left ${
                            isActive(item.href)
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
