import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, LayoutDashboard, FileText, LogIn, LogOut, History, User, Calendar, Building2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "Pricing", href: "#pricing" },
  { label: "Creators", href: "/creators" },
];

const Navbar = () => {
const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isCompany, role } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate("/" + href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.a 
              href="/" 
              className="flex items-center gap-2 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div 
                className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">ResumeAI</span>
            </motion.a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {link.href.startsWith("/") ? (
                    <Link
                      to={link.href}
                      className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
                    >
                      {link.label}
                      <motion.span 
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                      />
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      onClick={(e) => handleAnchorClick(e, link.href)}
                      className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
                    >
                      {link.label}
                      <motion.span 
                        className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"
                      />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-2">
              <ThemeToggle />
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link to="/resume-analyzer">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <FileText className="w-4 h-4" />
                    Analyze Resume
                  </Button>
                </Link>
              </motion.div>
              
              {user && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.33 }}
                >
                  <Link to="/resume-history">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <History className="w-4 h-4" />
                      History
                    </Button>
                  </Link>
                </motion.div>
              )}
              
              {/* Company-only links */}
              {user && isCompany && (
                <>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <Link to="/dashboard">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.36 }}
                  >
                    <Link to="/interviews">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Calendar className="w-4 h-4" />
                        Interviews
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.37 }}
                  >
                    <Link to="/company-admin">
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  </motion.div>
                </>
              )}
              
              {user && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.38 }}
                >
                  <Link to="/profile">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </Link>
                </motion.div>
              )}
              
              
              {/* Role badge */}
              {user && role && (
                <Badge variant={isCompany ? "default" : "secondary"} className="ml-1">
                  {isCompany ? (
                    <><Building2 className="w-3 h-3 mr-1" /> Company</>
                  ) : (
                    "Common"
                  )}
                </Badge>
              )}
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {user ? (
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => signOut()}>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                ) : (
                  <Link to="/auth">
                    <Button variant="default" size="sm" className="gap-2">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <motion.button
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                whileTap={{ scale: 0.9 }}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-background border-b border-border overflow-hidden"
            >
              <div className="container mx-auto px-6 py-4 flex flex-col gap-2">
                {/* Role badge for mobile */}
                {user && role && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isCompany ? "default" : "secondary"}>
                      {isCompany ? (
                        <><Building2 className="w-3 h-3 mr-1" /> Company</>
                      ) : (
                        "Common User"
                      )}
                    </Badge>
                  </div>
                )}
                
                {navLinks.map((link, index) => (
                  link.href.startsWith("/") ? (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={link.href}
                        className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all py-3 px-4 rounded-lg"
                        onClick={() => setIsOpen(false)}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all py-3 px-4 rounded-lg cursor-pointer"
                      onClick={(e) => {
                        handleAnchorClick(e, link.href);
                        setIsOpen(false);
                      }}
                    >
                      {link.label}
                    </motion.a>
                  )
                ))}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col gap-2 pt-4 border-t border-border mt-2"
                >
                  <Link to="/resume-analyzer" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <FileText className="w-4 h-4" />
                      Analyze Resume
                    </Button>
                  </Link>
                  {user && (
                    <Link to="/resume-history" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <History className="w-4 h-4" />
                        History
                      </Button>
                    </Link>
                  )}
                  {/* Company-only links */}
                  {user && isCompany && (
                    <>
                      <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Button>
                      </Link>
                      <Link to="/interviews" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                          <Calendar className="w-4 h-4" />
                          Interviews
                        </Button>
                      </Link>
                    </>
                  )}
                  {user && (
                    <Link to="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </Button>
                    </Link>
                  )}
                  {/* Company admin link for mobile */}
                  {user && isCompany && (
                    <Link to="/company-admin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                        <Shield className="w-4 h-4" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {user ? (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => { signOut(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      <Button variant="default" size="sm" className="w-full gap-2">
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
};

export default Navbar;
