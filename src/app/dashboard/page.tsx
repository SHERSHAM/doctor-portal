"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  CheckCircle2, 
  Hourglass, 
  MessageSquare,
  ArrowRight,
  Armchair,
  Sparkles,
  ClipboardList,
  Calendar
} from "lucide-react";
import Link from "next/link";

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  const [stats, setStats] = useState({
    todayCount: 0,
    waitingCount: 0,
    completedCount: 0,
  });

  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-");
      setCurrentYear(Number(y));
      setCurrentMonth(Number(m) - 1);
    }
  }, [selectedDate]);

  // Chair allocations (4 distinct active chairs)
  const [chairs, setChairs] = useState<any[]>([
    { id: "Chair 1", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
    { id: "Chair 2", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
    { id: "Chair 3", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
    { id: "Chair 4", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
  ]);

  // Reception notifications/messages
  const receptionMessages = [
    { time: "Just now", text: "Reception: Patient Amit Sharma has checked in for Crown Treatment.", type: "urgent" },
    { time: "10 mins ago", text: "Lab: X-Ray scans uploaded for Patient Kavita Nair's Root Canal consultation.", type: "info" },
  ];

  useEffect(() => {
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.appointments) {
          setAppointments(data.appointments);
          
          // Compute today's date string manually (YYYY-MM-DD) to compare
          const d = new Date();
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const todayStr = `${year}-${month}-${day}`;

          // A session lasts 20 hours to capture late-night operations spanning past midnight
          const sessionDurationMs = 20 * 60 * 60 * 1000;
          const nowMs = Date.now();

          // Today's consultations: scheduled for selectedDate OR updated within the active session duration (if selectedDate is today)
          const todayAppts = data.appointments.filter((a: any) => {
            const isScheduledSelected = a.date === selectedDate;
            const isSessionUpdate = (nowMs - new Date(a.updatedAt).getTime()) < sessionDurationMs;
            if (selectedDate === todayStr) {
              return isScheduledSelected || isSessionUpdate;
            } else {
              return isScheduledSelected;
            }
          });
          
          // Queue waiting: Any checked-in patient (ARRIVED) OR selected date's pending/confirmed visits
          const waiting = data.appointments.filter((a: any) => {
            const isArrived = a.status === "ARRIVED";
            const isTodayPending = a.date === selectedDate && (a.status === "PENDING" || a.status === "CONFIRMED");
            return isArrived || isTodayPending;
          });
          
          // Completed: Any completed treatment scheduled for selected date OR completed during the active session (if selectedDate is today)
          const completed = data.appointments.filter((a: any) => {
            const isCompleted = a.status === "COMPLETED";
            const isTodayOrSession = a.date === selectedDate || 
              (selectedDate === todayStr && (nowMs - new Date(a.updatedAt).getTime()) < sessionDurationMs);
            return isCompleted && isTodayOrSession;
          });

          setStats({
            todayCount: todayAppts.length,
            waitingCount: waiting.length,
            completedCount: completed.length,
          });

          // Sync chairs based on active appointments in status ARRIVED matching specific chair number
          const activeChairs = [
            { id: "Chair 1", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
            { id: "Chair 2", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
            { id: "Chair 3", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
            { id: "Chair 4", patient: "No active patient", status: "Available", color: "text-green-400 bg-green-950/20 border-green-900/30", prescription: null },
          ];
          
          data.appointments.forEach((app: any) => {
            // Display active chairs if checked in, but only if they are associated with the selected date (or active session)
            const isArrived = app.status === "ARRIVED";
            const isSelectedDate = app.date === selectedDate;
            const isRecentSession = (nowMs - new Date(app.updatedAt).getTime()) < sessionDurationMs;
            
            if (isArrived && app.chairNumber && (isSelectedDate || (selectedDate === todayStr && isRecentSession))) {
              const chair = activeChairs.find((c) => c.id === app.chairNumber);
              if (chair) {
                chair.patient = app.user?.name || "Patient";
                chair.status = "Occupied (Arrived)";
                chair.color = "text-amber-400 bg-amber-950/20 border-amber-900/30";
                chair.prescription = app.prescriptions && app.prescriptions.length > 0
                  ? app.prescriptions[0]
                  : null;
              }
            }
          });
          setChairs(activeChairs);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Calendar helper calculations
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
  
  const calendarCells: any[] = [];
  
  // Pad previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      day: i,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }
  
  // Pad next month days to have exactly 42 cells (6 rows)
  const remainingCells = 42 - calendarCells.length;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({
      day: i,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleSelectDay = (cell: typeof calendarCells[0]) => {
    const year = cell.year;
    const month = String(cell.month + 1).padStart(2, "0");
    const day = String(cell.day).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
    setCalendarOpen(false);
  };

  const handleJumpToToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
    setCalendarOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-");
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return dateStr;
    }
  };

  const parseMedicines = (jsonStr: string) => {
    try {
      return JSON.parse(jsonStr) || [];
    } catch (e) {
      return [];
    }
  };

  // Filter appointments for the selected date (including active session updates if selectedDate is today)
  const dayAppointments = appointments.filter((app) => {
    const isScheduledSelected = app.date === selectedDate;
    
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const sessionDurationMs = 20 * 60 * 60 * 1000;
    const isSessionUpdate = (Date.now() - new Date(app.updatedAt).getTime()) < sessionDurationMs && app.date <= todayStr;

    if (selectedDate === todayStr) {
      return isScheduledSelected || isSessionUpdate;
    } else {
      return isScheduledSelected;
    }
  });

  return (
    <div className="space-y-8 relative z-10">
      {/* Welcome Banner & Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-100 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Clinical Workspace
          </h1>
          <p className="text-slate-400 text-sm">Review chair allocations, queue status, and completed treatments by day</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 px-4 py-2.5 rounded-2xl shadow-md hover:bg-slate-900/80 transition-all text-xs font-bold text-slate-200"
          >
            <Calendar size={14} className="text-teal-400" />
            <span>{formatDisplayDate(selectedDate)}</span>
          </button>

          {calendarOpen && (
            <div className="absolute right-0 mt-2 p-4 w-72 rounded-3xl border border-slate-800 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-50 space-y-4">
              {/* Header */}
              <div className="flex justify-between items-center text-slate-200">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-bold text-sm"
                >
                  &larr;
                </button>
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-300">
                  {MONTHS[currentMonth]} {currentYear}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-colors font-bold text-sm"
                >
                  &rarr;
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {DAYS_SHORT.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((cell, idx) => {
                  const [y, m, d] = selectedDate.split("-");
                  const isSelected =
                    cell.day === Number(d) &&
                    cell.month === Number(m) - 1 &&
                    cell.year === Number(y);
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectDay(cell)}
                      className={`h-7 w-7 text-[11px] font-semibold rounded-lg flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-extrabold"
                          : cell.isCurrentMonth
                          ? "text-slate-300 hover:bg-slate-900"
                          : "text-slate-600 hover:bg-slate-900/50"
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="text-teal-400 font-bold hover:text-teal-300 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(false)}
                  className="text-slate-500 font-bold hover:text-slate-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: "Today's Consultations", count: stats.todayCount, icon: Users, color: "from-primary-600 to-indigo-700" },
          { label: "Queue Waiting", count: stats.waitingCount, icon: Hourglass, color: "from-amber-600 to-orange-700" },
          { label: "Treatments Completed", count: stats.completedCount, icon: CheckCircle2, color: "from-teal-600 to-emerald-700" },
        ].map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{s.label}</span>
                <span className="text-3xl font-black text-white mt-2 block">{s.count}</span>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg`}>
                <Icon size={20} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary Grid Layout - Responsive grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Columns: Today's Appointments & Chair Status */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chair Allocations */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-slate-100 text-base flex items-center gap-2">
                <Armchair size={18} className="text-teal-400" /> Active Chairs Status
              </h2>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-950/60 px-2.5 py-0.5 rounded-full border border-slate-800/30 uppercase tracking-wider">Real-time</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {chairs.map((chair) => (
                <div key={chair.id} className="p-4 rounded-2xl border border-slate-800/40 bg-slate-950/40 flex flex-col gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg text-slate-300">💺</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-200">{chair.id}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${chair.color}`}>{chair.status}</span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">{chair.patient}</p>
                    </div>
                  </div>

                  {/* Prescription Section */}
                  {chair.prescription && (
                    <div className="pt-3 border-t border-slate-850 space-y-1.5">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Rx Prescribed:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {parseMedicines(chair.prescription.medicines).map((med: any, idx: number) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-[9px] font-bold bg-slate-900 border border-slate-800 text-teal-400 px-2 py-0.5 rounded-lg">
                            💊 {med.name} ({med.dosage})
                          </span>
                        ))}
                      </div>
                      {chair.prescription.instructions && (
                        <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">
                          Note: {chair.prescription.instructions}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Queue */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-slate-100 text-base flex items-center gap-2">
                <ClipboardList size={18} className="text-teal-400" /> Consultation Queue
              </h2>
              <Link href="/dashboard/appointments" className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
              </div>
            ) : dayAppointments.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                🎉 No consultations scheduled for this date.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-[300px] overflow-y-auto pr-1">
                {dayAppointments.slice(0, 5).map((app) => (
                  <div key={app.id} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">{app.user?.name || "Patient"}</h4>
                      <p className="text-xs text-slate-400 mt-1">{app.time} • {app.reason || "General Consultation"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        app.status === "COMPLETED" 
                          ? "bg-green-950/20 text-green-400 border border-green-900/30" 
                          : app.status === "ARRIVED" 
                          ? "bg-indigo-950/20 text-indigo-400 border border-indigo-900/30"
                          : "bg-slate-900 text-slate-400 border border-slate-800"
                      }`}>
                        {app.status}
                      </span>
                      <Link href="/dashboard/appointments" className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-teal-400">
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Messages & Quick Actions */}
        <div className="space-y-8">
          {/* Messages from Reception */}
          <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-bold text-slate-100 text-base flex items-center gap-2">
                <MessageSquare size={18} className="text-teal-400" /> Internal Clinic Notices
              </h2>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div className="space-y-4">
              {receptionMessages.map((msg, idx) => (
                <div key={idx} className="p-4 rounded-2xl border border-slate-800/40 bg-slate-950/40 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] text-slate-500 font-semibold">{msg.time}</span>
                    {msg.type === "urgent" && <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/20 border border-rose-900/30 px-2 py-0.5 rounded-full">Urgent</span>}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick clinical updates */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl shadow-2xl relative overflow-hidden text-white">
            <div className="absolute top-[-30%] right-[-20%] w-48 h-48 rounded-full bg-primary-600/20 blur-3xl pointer-events-none" />
            <h3 className="font-heading font-bold text-base flex items-center gap-2 mb-2 text-white">
              <Sparkles size={18} className="text-teal-400" /> Clinic Management
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Ensure you mark patients as "Arrived" and click "Complete Consultation" to automatically generate payment invoices.
            </p>
            <Link 
              href="/dashboard/appointments" 
              className="py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-primary-600/10 hover:bg-primary-700"
            >
              Start Practice Management
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
