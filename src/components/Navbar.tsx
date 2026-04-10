import { Link, useLocation, useNavigate } from "react-router-dom";
import { Languages, BookOpen, BarChart3, Info, Globe, Mic, User, LogOut } from "lucide-react";
import lanternLogo from "@/assets/lantern-logo.png";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", labelKey: "nav.home", icon: Languages },
    { path: "/translator", labelKey: "nav.translator", icon: Languages },
    { path: "/flashcards", labelKey: "nav.flashcards", icon: BookOpen },
    { path: "/practice", labelKey: "nav.practice", icon: Mic },
    ...(user
      ? [{ path: "/dashboard", labelKey: "nav.dashboard", icon: BarChart3 }]
      : []),
    { path: "/about", labelKey: "nav.about", icon: Info },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 border-primary-foreground">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:scale-105 transition-transform">
            <img src={lanternLogo} alt="Líng Huà" className="w-10 h-10 rounded-full object-contain" />
            <span className="text-xl font-bold bg-gradient-coral bg-clip-text text-transparent">
              Líng Huà
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    className={`gap-2 transition-all ${
                      active ? "bg-primary/10 text-primary shadow-soft" : "hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold">{t(item.labelKey)}</span>
                  </Button>
                </Link>
              );
            })}

            {/* Language Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              className="ms-2"
              title={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            >
              <Globe className="w-4 h-4" />
            </Button>

            {/* Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-2 ms-2">
                <Link to="/profile">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="ms-2">
                <Button className="bg-gradient-coral font-semibold" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={active ? "bg-primary/10 text-primary" : ""}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
            >
              <Globe className="w-4 h-4" />
            </Button>
            {user ? (
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
