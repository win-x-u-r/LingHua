import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Languages, BookOpen, BarChart3, Info, Globe, Mic, User, LogOut,
  MessageCircle, GraduationCap, Menu, X,
} from "lucide-react";
import lanternLogo from "@/assets/lantern-logo.png";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/", labelKey: "nav.home", icon: Languages },
    { path: "/translator", labelKey: "nav.translator", icon: Languages },
    { path: "/flashcards", labelKey: "nav.flashcards", icon: BookOpen },
    { path: "/practice", labelKey: "nav.practice", icon: Mic },
    ...(user
      ? [
          { path: "/grammar", labelKey: "nav.grammar", icon: GraduationCap },
          { path: "/dashboard", labelKey: "nav.dashboard", icon: BarChart3 },
          { path: "/tutor", labelKey: "nav.tutor", icon: MessageCircle },
        ]
      : []),
    { path: "/about", labelKey: "nav.about", icon: Info },
  ];

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
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

          {/* Desktop Nav Links */}
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

          {/* Mobile: just a hamburger button — drawer below holds everything */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-150">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-11 ${
                      active ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{t(item.labelKey)}</span>
                  </Button>
                </Link>
              );
            })}

            <div className="flex items-center gap-2 pt-2 mt-2 border-t border-border">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
              >
                <Globe className="w-4 h-4" />
                {language === "ar" ? "English" : "العربية"}
              </Button>

              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex-1">
                    <Button variant="ghost" className="w-full gap-2">
                      <User className="w-4 h-4" />
                      <span className="truncate">{profile?.full_name ?? "Profile"}</span>
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex-1">
                  <Button className="w-full bg-gradient-coral font-semibold">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
