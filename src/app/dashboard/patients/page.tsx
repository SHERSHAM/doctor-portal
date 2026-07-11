"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Calendar, 
  FileText, 
  ShieldCheck 
} from "lucide-react";

export default function DoctorPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => {
        if (data.patients) {
          setPatients(data.patients);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone?.includes(searchQuery) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-8 relative z-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-black text-slate-100 tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Patient Medical Records
        </h1>
        <p className="text-slate-400 text-sm">Access treatment timelines, diagnostic notes, and patient files securely</p>
      </div>

      {loading ? (
        <div className="text-center py-12 bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto" />
          <p className="text-xs text-slate-500 mt-2">Loading medical records...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patients Directory List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search patient registry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 focus:border-primary-500 outline-none text-xs text-slate-200 placeholder-slate-500 shadow-sm"
              />
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-4 shadow-2xl space-y-1 max-h-[500px] overflow-y-auto">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Patients ({filteredPatients.length})</span>
              {filteredPatients.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No patient records found.</p>
              ) : (
                filteredPatients.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPatientId(p.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 border ${
                      selectedPatientId === p.id 
                        ? "bg-primary-950/20 border-primary-900/50 text-primary-400 font-semibold" 
                        : "hover:bg-slate-800/40 border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs uppercase border border-slate-700/40">
                      {p.name.split(" ").slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.phone || "No phone"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Patient Details & Clinical History Timeline */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl text-center py-24">
                <span className="text-4xl block mb-2">📋</span>
                <h4 className="font-bold text-slate-200 text-sm">Select a Patient</h4>
                <p className="text-xs text-slate-500 mt-1">Choose a patient from the directory list on the left to review their clinical timeline.</p>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl space-y-6">
                {/* Header Profile summary */}
                <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-800/60">
                  <div>
                    <h2 className="font-heading font-bold text-slate-100 text-lg">{selectedPatient.name}</h2>
                    <p className="text-xs text-slate-400 mt-1">Email: {selectedPatient.email} • Mobile: {selectedPatient.phone || "N/A"}</p>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-teal-400 bg-teal-950/20 border border-teal-900/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldCheck size={10} /> Active Patient
                  </span>
                </div>

                {/* Treatment History Timeline */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Treatment History & Clinical Logs</h3>
                  {selectedPatient.appointments?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">No consultation logs found for this patient.</p>
                  ) : (
                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-800/80">
                      {selectedPatient.appointments.map((app: any) => (
                        <div key={app.id} className="flex gap-4 relative">
                          {/* Timeline dot */}
                          <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-xs text-slate-500 z-10 flex-shrink-0 mt-0.5">
                            🩺
                          </div>
                          <div className="flex-1 bg-slate-950/40 border border-slate-800/40 p-4 rounded-2xl space-y-3">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <div>
                                <span className="text-xs font-bold text-slate-200">{app.reason || "General Consultation"}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">{app.date} • {app.time}</span>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                app.status === "COMPLETED" 
                                  ? "bg-green-950/20 text-green-400 border border-green-900/30" 
                                  : "bg-slate-900 text-slate-400 border border-slate-800"
                              }`}>
                                {app.status}
                              </span>
                            </div>

                            {/* Clinical observations */}
                            <div>
                              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Doctor Notes</span>
                              <p className="text-xs text-slate-400 italic">
                                {app.notes || "No observations written."}
                              </p>
                            </div>

                            {/* Linked Prescriptions */}
                            {app.prescriptions && app.prescriptions.length > 0 && (
                              <div className="pt-2 border-t border-slate-800/60">
                                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <FileText size={10} /> Prescriptions
                                </span>
                                {app.prescriptions.map((pres: any) => {
                                  let meds = [];
                                  try {
                                    meds = JSON.parse(pres.medicines);
                                  } catch (e) {
                                    meds = [];
                                  }
                                  return (
                                    <div key={pres.id} className="text-xs text-slate-400 space-y-1 pl-2 border-l border-primary-900">
                                      {meds.map((m: any, i: number) => (
                                        <p key={i}>
                                          • <strong className="text-slate-200">{m.name}</strong> - {m.dosage} ({m.instructions})
                                        </p>
                                      ))}
                                      {pres.instructions && <p className="text-[10px] text-slate-500 mt-1 italic">Note: {pres.instructions}</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
