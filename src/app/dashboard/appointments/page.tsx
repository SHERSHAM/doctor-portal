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

  const filteredAppointments = appointments.filter((app) => {
    if (activeTab === "active") {
      return app.status !== "COMPLETED";
    } else {
      return app.status === "COMPLETED";
    }
  });

  useEffect(() => {
    fetchAppointments();
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
    // Optimistic UI update: immediately change status locally before network request completes
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status, ...additional } : app
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

  return (
    <div className="space-y-8 relative z-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-100 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Clinical Schedules
        </h1>
        <p className="text-slate-400 text-sm">Verify patient check-ins, record observation notes, and assign chairs</p>
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
          Active Queue ({appointments.filter(a => a.status !== "COMPLETED").length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all px-4 ${
            activeTab === "completed"
              ? "border-green-500 text-slate-100 font-extrabold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Completed Treatments ({appointments.filter(a => a.status === "COMPLETED").length})
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

                {app.status === "ARRIVED" && (
                  <button
                    onClick={() => updateStatus(app.id, "COMPLETED")}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> Complete & Bill
                  </button>
                )}

                {app.status === "COMPLETED" && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-950/20 border border-green-900/30 px-4 py-2 rounded-xl">
                    <CheckCircle2 size={14} /> Treatment Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
