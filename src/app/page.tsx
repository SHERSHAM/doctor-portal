"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldAlert, ArrowRight, ShieldCheck } from "lucide-react";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quick-login configuration to make validation and testing effortless!
  const DOCTOR_PRESETS = [
    { name: "Dr. Ajith Madhav", title: "Chief Dental Surgeon", email: "ajith@madhavdental.com" },
    { name: "Dr. Priya Nair", title: "Orthodontist", email: "priya@madhavdental.com" },
    { name: "Dr. Rahul Das", title: "Oral Surgeon", email: "rahul@madhavdental.com" },
  ];

  const handlePresetClick = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("Password123");
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Redirect to doctor dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 py-12 relative overflow-hidden">
      {/* Visual background glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary-900/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-400 mb-4 shadow-xl shadow-primary-500/10">
            <span className="text-3xl text-white font-black">M</span>
          </div>
          <h1 className="text-2xl font-black font-heading tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            MADHAV DENTAL CLINIC
          </h1>
          <p className="text-sm text-slate-400 mt-2">Clinical Portal & Practice Manager</p>
        </div>

        {/* Login form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 bg-teal-950/40 border border-teal-800/25 px-3 py-1.5 rounded-full mb-6 w-fit">
            <ShieldCheck size={14} /> Authorized Personnel Only
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  placeholder="doctor@madhavdental.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-950/40 outline-none text-sm transition-all text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-950/40 outline-none text-sm transition-all text-slate-100 placeholder-slate-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 border border-rose-900/30 p-3.5 rounded-xl">
                <ShieldAlert size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-600 to-teal-500 text-white font-bold text-sm shadow-xl shadow-primary-950/40 hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Authenticating..." : "Access Portal"} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Preset Selector */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Clinical Presets</h4>
            <div className="space-y-2">
              {DOCTOR_PRESETS.map((doc) => (
                <button
                  key={doc.email}
                  type="button"
                  onClick={() => handlePresetClick(doc.email)}
                  className="w-full text-left p-3 rounded-xl bg-slate-900/35 hover:bg-slate-900/70 border border-slate-700/30 hover:border-slate-700/80 transition-all flex justify-between items-center group"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-200 group-hover:text-primary-400 transition-colors">{doc.name}</p>
                    <p className="text-[10px] text-slate-500">{doc.title}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold px-2 py-1 rounded bg-slate-800 border border-slate-700 group-hover:bg-primary-950 group-hover:text-primary-400 group-hover:border-primary-900 transition-all">
                    Load Account
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
