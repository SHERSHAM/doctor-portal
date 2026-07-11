"use client";

import { useEffect, useState } from "react";
import { 
  Calendar,
  CheckCircle2, 
  Hourglass, 
  Armchair, 
  FileEdit,
  Save,
  Check
} from "lucide-react";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [prescribingApptId, setPrescribingApptId] = useState<string | null>(null);
  const [inlineMeds, setInlineMeds] = useState<Array<{ name: string; dosage: string; instructions: string }>>([
    { name: "", dosage: "", instructions: "" }
  ]);
  const [inlineGenInstructions, setInlineGenInstructions] = useState("");
  const [skippedRxApptIds, setSkippedRxApptIds] = useState<string[]>([]);
  const [viewingRxApptId, setViewingRxApptId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Date selection states
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

  useEffect(() => {
    if (selectedDate) {
      const [y, m] = selectedDate.split("-");
      setCurrentYear(Number(y));
      setCurrentMonth(Number(m) - 1);
    }
  }, [selectedDate]);

  // Get all appointments matching the selected date
  const dayAppointmentsList = appointments.filter((app) => {
    const isScheduledSelected = app.date === selectedDate;
    
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const todayStr = `${year}-${month}-${day}`;

    const sessionDurationMs = 20 * 60 * 60 * 1000;
    const isSessionUpdate = (Date.now() - new Date(app.updatedAt).getTime()) < sessionDurationMs && app.date <= todayStr;

    return selectedDate === todayStr 
      ? (isScheduledSelected || isSessionUpdate) 
      : isScheduledSelected;
  });

  const activeCount = dayAppointmentsList.filter((a) => a.status !== "COMPLETED").length;
  const completedCount = dayAppointmentsList.filter((a) => a.status === "COMPLETED").length;

  const filteredAppointments = dayAppointmentsList.filter((app) => {
    if (activeTab === "active") {
      return app.status !== "COMPLETED";
    } else {
      return app.status === "COMPLETED";
    }
  });

  useEffect(() => {
    fetchAppointments();
    // Fetch doctor session details
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchAppointments = (silent = false) => {
    if (!silent) setLoading(true);
    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (data.appointments) {
          setAppointments(data.appointments);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  const updateStatus = async (id: string, status: string, additional: any = {}) => {
    const docInfo: any = {};
    if ((status === "CONFIRMED" || status === "ARRIVED" || status === "COMPLETED") && currentUser) {
      docInfo.doctorName = currentUser.name;
      docInfo.doctorId = currentUser.userId;
    }

    // Optimistic UI update: immediately change status locally before network request completes
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status, ...additional, ...docInfo } : app
      )
    );

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...additional }),
      });

      if (response.ok) {
        fetchAppointments(true); // Silent background fetch
      } else {
        // Revert in case of failure
        fetchAppointments(true);
      }
    } catch (error) {
      console.error(error);
      fetchAppointments(true);
    }
  };

  const saveNotes = async (id: string) => {
    setSubmitting(true);
    // Optimistic notes update
    setAppointments((prev) =>
      prev.map((app) => (app.id === id ? { ...app, notes: notesText } : app))
    );

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesText }),
      });

      if (response.ok) {
        setEditingNotesId(null);
        fetchAppointments(true); // Silent background fetch
      } else {
        fetchAppointments(true);
      }
    } catch (error) {
      console.error(error);
      fetchAppointments(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNotes = (id: string, currentNotes: string) => {
    setEditingNotesId(id);
    setNotesText(currentNotes || "");
  };

  const handleSaveInlinePrescription = async (apptId: string) => {
    if (inlineMeds.some(m => !m.name)) {
      alert("Please enter a name for the medicine.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: apptId,
          medicines: inlineMeds,
          instructions: inlineGenInstructions,
        }),
      });

      if (response.ok) {
        setPrescribingApptId(null);
        setInlineMeds([{ name: "", dosage: "", instructions: "" }]);
        setInlineGenInstructions("");
        fetchAppointments(true); // Silent background fetch to show "Complete & Bill" button!
      } else {
        alert("Failed to save prescription.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while saving the prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddInlineMed = () => {
    setInlineMeds([...inlineMeds, { name: "", dosage: "", instructions: "" }]);
  };

  const handleRemoveInlineMed = (idx: number) => {
    setInlineMeds(inlineMeds.filter((_, i) => i !== idx));
  };

  const handleInlineMedChange = (idx: number, field: string, val: string) => {
    const updated = [...inlineMeds];
    updated[idx] = { ...updated[idx], [field]: val };
    setInlineMeds(updated);
  };

  // Calendar helpers
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

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-100 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Clinical Schedules
          </h1>
          <p className="text-slate-400 text-sm">Verify patient check-ins, record observation notes, and assign chairs by date</p>
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

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-slate-800/60 pb-px">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 ${
            activeTab === "active"
              ? "border-indigo-500 text-slate-100 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Active Queue ({activeCount})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 ${
            activeTab === "completed"
              ? "border-green-500 text-slate-100 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Completed Treatments ({completedCount})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading appointments schedule...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <span className="text-4xl block mb-2">📅</span>
          <h4 className="font-bold text-slate-200 text-sm">
            {activeTab === "active" ? "No Active Appointments" : "No Completed Treatments"}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            {activeTab === "active" 
              ? "All patients have been successfully processed, or there are no new visits." 
              : "No treatments have been marked as completed in this session."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredAppointments.map((app) => {
            // Find chairs currently occupied by other checked-in patients
            const occupiedChairs = appointments
              .filter((a) => a.status === "ARRIVED")
              .map((a) => a.chairNumber);
            const availableChairs = ["Chair 1", "Chair 2", "Chair 3", "Chair 4"].filter(
              (chair) => !occupiedChairs.includes(chair)
            );

            return (
              <div key={app.id} className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex flex-col xl:flex-row xl:items-start justify-between gap-6">
              <div className="space-y-4 flex-1">
                {/* Meta details */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-slate-950/40 border border-slate-800/60 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar size={12} /> {app.date} at {app.time}
                  </span>
                  {app.chairNumber && (
                    <span className="px-3 py-1 rounded-full bg-teal-950/20 border border-teal-900/30 text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                      <Armchair size={12} /> {app.chairNumber}
                    </span>
                  )}
                  {app.doctorName && (
                    <span className="px-3 py-1 rounded-full bg-slate-950/40 border border-slate-800/60 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      👨‍⚕️ {app.status === "COMPLETED" ? "Treated by" : "Assigned"}: {app.doctorName}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    app.status === "COMPLETED" 
                      ? "bg-green-950/20 text-green-400 border border-green-900/30" 
                      : app.status === "ARRIVED" 
                      ? "bg-indigo-950/20 text-indigo-400 border border-indigo-900/30"
                      : app.status === "PENDING"
                      ? "bg-amber-950/20 text-amber-400 border border-amber-900/30"
                      : "bg-slate-800 text-slate-300 border border-slate-700"
                  }`}>
                    {app.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-200 text-base">{app.user?.name || "Patient Profile"}</h4>
                  <p className="text-xs text-slate-400 mt-1">Phone: {app.user?.phone || "N/A"} • Treatment: {app.reason || "General Consultation"}</p>
                </div>

                {/* Observation / Clinical Notes Block */}
                <div className="pt-2">
                  <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Clinical Observations</span>
                  {editingNotesId === app.id ? (
                    <div className="flex flex-col gap-2 max-w-xl">
                      <textarea
                        rows={3}
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Type clinical observations, diagnosis, or recommendations..."
                        className="w-full px-4 py-3 rounded-xl bg-slate-950/40 border border-slate-800 focus:border-primary-500 outline-none text-xs resize-none text-slate-100 placeholder-slate-600"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveNotes(app.id)}
                          disabled={submitting}
                          className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 flex items-center gap-1 shadow-md shadow-primary-600/10"
                        >
                          <Save size={12} /> {submitting ? "Saving..." : "Save Notes"}
                        </button>
                        <button
                          onClick={() => setEditingNotesId(null)}
                          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 bg-slate-950/40 border border-slate-800/40 p-3 rounded-xl max-w-xl">
                      <p className="text-xs text-slate-300 italic flex-1">
                        {app.notes || "No clinical observations recorded yet."}
                      </p>
                      <button
                        onClick={() => handleEditNotes(app.id, app.notes)}
                        className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-300"
                      >
                        <FileEdit size={14} />
                      </button>
                    </div>
                  )}
                  
                  {/* Inline Prescription Writer Form */}
                  {prescribingApptId === app.id && (
                    <div className="mt-4 p-5 rounded-2xl border border-slate-850 bg-slate-950/40 space-y-4 max-w-xl relative z-25">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                        <h4 className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                          💊 Digital Prescription Form
                        </h4>
                        <button
                          type="button"
                          onClick={() => setPrescribingApptId(null)}
                          className="text-[10px] text-slate-500 hover:text-slate-400 font-bold"
                        >
                          Cancel
                        </button>
                      </div>

                      {/* Medicines List */}
                      <div className="space-y-3">
                        {inlineMeds.map((med, idx) => (
                          <div key={idx} className="flex gap-2 items-end border-b border-slate-850/40 pb-3 last:border-none last:pb-0">
                            <div className="flex-1 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Medicine Name</label>
                              <input
                                type="text"
                                value={med.name}
                                onChange={(e) => handleInlineMedChange(idx, "name", e.target.value)}
                                placeholder="e.g. Paracetamol 650mg"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 outline-none text-xs text-slate-200 placeholder-slate-700"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Dosage</label>
                              <input
                                type="text"
                                value={med.dosage}
                                onChange={(e) => handleInlineMedChange(idx, "dosage", e.target.value)}
                                placeholder="e.g. 1-0-1"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 outline-none text-xs text-slate-200 placeholder-slate-700"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Timing</label>
                              <input
                                type="text"
                                value={med.instructions}
                                onChange={(e) => handleInlineMedChange(idx, "instructions", e.target.value)}
                                placeholder="e.g. Post Meals"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 outline-none text-xs text-slate-200 placeholder-slate-700"
                              />
                            </div>
                            {inlineMeds.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveInlineMed(idx)}
                                className="p-2 bg-slate-900 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 rounded-lg text-xs text-slate-400 font-bold transition-all h-9"
                              >
                                &times;
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddInlineMed}
                        className="text-[10px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                      >
                        + Add Medication
                      </button>

                      {/* General Instructions */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">General Instructions & Care Notes</label>
                        <textarea
                          rows={2}
                          value={inlineGenInstructions}
                          onChange={(e) => setInlineGenInstructions(e.target.value)}
                          placeholder="e.g. Warm saline rinse after 24 hrs. Avoid spicy food..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 focus:border-teal-500 outline-none text-xs resize-none text-slate-200 placeholder-slate-700"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveInlinePrescription(app.id)}
                        disabled={submitting}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Save size={12} /> {submitting ? "Saving..." : "Save & Sync Prescription"}
                      </button>
                    </div>
                  )}

                  {/* Expanded Prescription Viewer Details */}
                  {viewingRxApptId === app.id && app.prescriptions && app.prescriptions.length > 0 && (() => {
                    const rx = app.prescriptions[0];
                    let meds = [];
                    try {
                      meds = JSON.parse(rx.medicines) || [];
                    } catch (e) {
                      meds = [];
                    }
                    
                    return (
                      <div className="mt-4 p-5 rounded-2xl border border-slate-850 bg-slate-950/40 space-y-3 max-w-xl">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                          <h4 className="text-[10px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                            💊 Prescribed Medications
                          </h4>
                          <span className="text-[9px] text-slate-500 font-semibold">Signed by {rx.signedBy || "Doctor"}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {meds.map((med: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-900 last:border-none">
                              <span className="font-bold text-slate-200">💊 {med.name}</span>
                              <div className="flex gap-3 text-slate-400 font-semibold">
                                <span>Dosage: {med.dosage}</span>
                                <span>Timing: {med.instructions}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {rx.instructions && (
                          <div className="pt-2 border-t border-slate-900">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Doctor Instructions:</span>
                            <p className="text-xs text-slate-300 italic mt-0.5 leading-relaxed">{rx.instructions}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap gap-2 xl:self-center">
                {app.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateStatus(app.id, "CONFIRMED")}
                      className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-bold hover:bg-primary-700 shadow-md flex items-center gap-1.5"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button
                      onClick={() => updateStatus(app.id, "CANCELLED")}
                      className="px-4 py-2.5 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800"
                    >
                      Reject
                    </button>
                  </>
                )}

                {app.status === "CONFIRMED" && (
                  <div className="flex flex-wrap gap-2">
                    {availableChairs.length > 0 ? (
                      availableChairs.map((chair) => {
                        let bgClass = "bg-indigo-600 hover:bg-indigo-700";
                        if (chair === "Chair 2") bgClass = "bg-teal-600 hover:bg-teal-700";
                        if (chair === "Chair 3") bgClass = "bg-blue-600 hover:bg-blue-700";
                        if (chair === "Chair 4") bgClass = "bg-emerald-600 hover:bg-emerald-700";

                        return (
                          <button
                            key={chair}
                            onClick={() => updateStatus(app.id, "ARRIVED", { chairNumber: chair })}
                            className={`px-3.5 py-2 ${bgClass} text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-[0.98] transition-all`}
                          >
                            <Armchair size={12} /> {chair}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-xs font-bold text-rose-400 bg-rose-950/20 border border-rose-900/30 px-3 py-1.5 rounded-xl flex items-center gap-1">
                        ⚠️ All Chairs Occupied
                      </span>
                    )}
                  </div>
                )}

                {app.status === "ARRIVED" && (() => {
                  const hasRx = app.prescriptions && app.prescriptions.length > 0;
                  const isSkipped = skippedRxApptIds.includes(app.id);

                  if (hasRx || isSkipped) {
                    return (
                      <div className="flex flex-col gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border text-center w-full ${
                          hasRx 
                            ? "bg-teal-950/20 text-teal-400 border-teal-900/30" 
                            : "bg-slate-900 text-slate-400 border-slate-850"
                        }`}>
                          {hasRx ? "✓ Prescription Linked" : "✗ Prescription Skipped"}
                        </span>
                        <button
                          onClick={() => updateStatus(app.id, "COMPLETED")}
                          className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-md flex items-center gap-1.5 justify-center active:scale-[0.98] transition-all"
                        >
                          <CheckCircle2 size={14} /> Complete & Bill
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          setPrescribingApptId(app.id);
                          setInlineMeds([{ name: "", dosage: "", instructions: "" }]);
                          setInlineGenInstructions("");
                        }}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-slate-950 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 justify-center active:scale-[0.98] transition-all"
                      >
                        💊 Write Prescription
                      </button>
                      <button
                        onClick={() => setSkippedRxApptIds([...skippedRxApptIds, app.id])}
                        className="px-4 py-2 border border-slate-700 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold transition-all hover:bg-slate-800"
                      >
                        Skip Prescription
                      </button>
                    </div>
                  );
                })()}

                {app.status === "COMPLETED" && (() => {
                  const hasRx = app.prescriptions && app.prescriptions.length > 0;
                  
                  return (
                    <div className="flex flex-col gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-950/20 border border-green-900/30 px-3 py-1.5 rounded-xl justify-center">
                        <CheckCircle2 size={12} /> Treatment Completed
                      </span>
                      
                      {hasRx ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingRxApptId(viewingRxApptId === app.id ? null : app.id)}
                            className="px-2.5 py-1.5 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            👁️ {viewingRxApptId === app.id ? "Hide Rx" : "View Rx"}
                          </button>
                          <button
                            onClick={() => {
                              const rx = app.prescriptions[0];
                              let parsed = [];
                              try {
                                parsed = JSON.parse(rx.medicines) || [];
                              } catch(e) {
                                parsed = [];
                              }
                              setInlineMeds(parsed);
                              setInlineGenInstructions(rx.instructions || "");
                              setPrescribingApptId(app.id);
                            }}
                            className="px-2.5 py-1.5 bg-teal-950/40 text-teal-400 border border-teal-900/30 hover:bg-teal-900/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            ✏️ Edit Rx
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setPrescribingApptId(app.id);
                            setInlineMeds([{ name: "", dosage: "", instructions: "" }]);
                            setInlineGenInstructions("");
                          }}
                          className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 justify-center"
                        >
                          ➕ Add Rx
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
