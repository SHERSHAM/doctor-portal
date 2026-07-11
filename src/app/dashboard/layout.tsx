"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  FileText, 
  LogOut, 
  Menu, 
  X,
  Stethoscope,
  HeartPulse
} from "lucide-react";
import ThreeBackground from "../../components/animations/ThreeBackground";
import MouseGlow from "../../components/animations/MouseGlow";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("doctor_portal_theme") as "dark" | "light";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("doctor_portal_theme", nextTheme);
  };

  // Authenticate session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          setDoctor(data.user);
        }
      })
      .catch(() => {
        router.push("/");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Appointments", path: "/dashboard/appointments", icon: CalendarDays },
    { name: "Prescriptions", path: "/dashboard/prescriptions", icon: FileText },
    { name: "Patients", path: "/dashboard/patients", icon: Users },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent mx-auto" />
          <p className="text-sm font-semibold mt-3 text-slate-300">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased relative overflow-hidden ${
      theme === "light" ? "light-theme" : "dark"
    }`}>
      {/* Background visual components */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-primary-900/10 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-teal-900/10 blur-[130px] pointer-events-none z-0" />
      
      {/* Dynamic 3D particles and mouse follows */}
      <ThreeBackground />
      <MouseGlow />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900/30 border-r border-slate-800/80 backdrop-blur-xl text-slate-100 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col z-30`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-800/80 bg-slate-950/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-teal-400 flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <h2 className="font-heading font-black text-sm tracking-tight text-white">MADHAV DENTAL</h2>
            <p className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">Doctor Portal</p>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-primary-600/90 text-white shadow-lg shadow-primary-600/20" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon size={18} /> {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Doctor Details Summary */}
        {doctor && (
          <div className="p-4 mx-4 mb-4 rounded-2xl bg-slate-950/40 border border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-primary-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                {doctor.name.split(" ").slice(-1)[0][0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-100 truncate">{doctor.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{doctor.doctorSpecialization || "Dental Specialist"}</p>
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen relative z-10">
        {/* Main Header bar */}
        <header className="h-16 bg-slate-950/60 border-b border-slate-900/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-400 hover:bg-slate-900 rounded-lg"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {doctor && (
              <div>
                <h3 className="font-heading font-bold text-white text-sm md:text-base leading-none">{doctor.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{doctor.doctorTitle || "Practice Surgeon"}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                // Sun Icon (switching to light)
                <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                // Moon Icon (switching to dark)
                <svg className="w-4.5 h-4.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="flex items-center gap-1.5 text-xs text-teal-400 bg-teal-950/40 border border-teal-800/30 px-3 py-1 rounded-full font-semibold">
              <HeartPulse size={12} className="animate-pulse" /> Clinic Active
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 p-6 md:p-8 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
