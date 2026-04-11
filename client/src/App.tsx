import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, authStore } from "./api";
import type { Application, ParseResponse, Status } from "./types";

const statuses: Status[] = ["Applied", "Phone Screen", "Interview", "Offer", "Rejected"];

function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => (mode === "login" ? api.login(email, password) : api.register(email, password)),
    onSuccess: ({ token }) => {
      authStore.set(token);
      onAuth();
    },
    onError: (err) => setError((err as Error).message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090b14] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] p-4 text-slate-200">
      <main className="w-full max-w-md rounded-2xl border border-slate-800/80 bg-[#0f111a]/95 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">JobLens</span>
        </h1>
        <p className="mb-8 text-center text-sm text-slate-400">Your AI-powered application tracker</p>
        
        <div className="space-y-4">
          <input className="w-full rounded-xl border border-slate-800 bg-[#151823] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-800 bg-[#151823] p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="mt-4 text-center text-sm font-medium text-rose-500">{error}</p>}
        
        <button className="mt-6 w-full rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-fuchsia-500 active:scale-[0.98] transition-all disabled:opacity-70" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "Connecting..." : mode === "login" ? "Sign In" : "Create Account"}
        </button>
        
        <button className="mt-6 w-full text-center text-sm text-slate-400 hover:text-white transition-colors" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Don't have an account? Register" : "Already have an account? Log in"}
        </button>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const gradients: Record<string, string> = {
    indigo: "from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20",
    sky: "from-sky-500/20 to-sky-500/5 text-sky-400 border-sky-500/20",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20",
    rose: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${gradients[color] || gradients.indigo} backdrop-blur-md`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(Boolean(authStore.get()));
  const [currentView, setCurrentView] = useState<"analyzer" | "board">("analyzer");
  
  const [jobDescription, setJobDescription] = useState("");
  const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
  const [selected, setSelected] = useState<Application | null>(null);
  const queryClient = useQueryClient();

  const appsQuery = useQuery({
    queryKey: ["applications"],
    queryFn: api.listApplications,
    enabled: authed,
  });

  const parseMutation = useMutation({
    mutationFn: () => api.parseJobDescription(jobDescription),
    onSuccess: setParseResult,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createApplication({
        company: parseResult?.companyName || "",
        role: parseResult?.role || "",
        requiredSkills: parseResult?.requiredSkills || [],
        niceToHaveSkills: parseResult?.niceToHaveSkills || [],
        seniority: parseResult?.seniority || "",
        location: parseResult?.location || "",
        resumeSuggestions: parseResult?.resumeSuggestions || [],
        status: "Applied",
        dateApplied: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      setParseResult(null);
      setJobDescription("");
      setCurrentView("board"); // Auto-redirect to board on save!
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Application> }) => api.updateApplication(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteApplication(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["applications"] }),
  });

  const grouped = useMemo(() => {
    const apps = appsQuery.data || [];
    return statuses.map((status) => ({ status, items: apps.filter((app) => app.status === status) }));
  }, [appsQuery.data]);

  const stats = useMemo(() => {
    const apps = appsQuery.data || [];
    return {
      total: apps.length,
      active: apps.filter(a => a.status === 'Phone Screen' || a.status === 'Interview').length,
      offers: apps.filter(a => a.status === 'Offer').length,
      rejected: apps.filter(a => a.status === 'Rejected').length,
    };
  }, [appsQuery.data]);

  if (!authed) return <AuthScreen onAuth={() => setAuthed(true)} />;

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#090b14] text-slate-200 font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-slate-800/60 bg-[#0f111a]/90 px-6 py-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-white cursor-pointer" onClick={() => setCurrentView("analyzer")}>
          <svg className="h-6 w-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line></svg>
          JobLens
        </div>
        
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border border-slate-800 bg-[#121520] p-1 shadow-inner">
          <button 
            onClick={() => setCurrentView("analyzer")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentView === 'analyzer' ? 'bg-[#1a1e2d] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            Analyzer
          </button>
          <button 
            onClick={() => setCurrentView("board")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${currentView === 'board' ? 'bg-[#1a1e2d] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            Tracker
            <span className="flex h-5 items-center justify-center rounded-full bg-indigo-500/20 px-2 text-[10px] font-bold text-indigo-300">{stats.total}</span>
          </button>
        </div>
        
        <button className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors" onClick={() => { authStore.clear(); setAuthed(false); }}>
          <svg className="h-4 w-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </nav>

      {/* Analyzer Landing Page View */}
      {currentView === 'analyzer' && (
        <main className="relative flex flex-1 flex-col items-center p-6 lg:p-12 bg-cover bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] overflow-y-auto">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="z-10 mt-10 mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 uppercase tracking-widest shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse"></span> AI-Powered Analysis
          </div>
          
          <h1 className="z-10 mb-6 max-w-3xl text-center text-4xl font-extrabold tracking-tight text-white md:text-5xl lg:text-6xl text-balance">
            Decode Any <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">Job Description</span> Instantly
          </h1>
          
          <p className="z-10 mb-12 max-w-2xl text-center text-lg text-slate-400 text-balance leading-relaxed">
            Paste a job posting below and get structured insights, skill breakdowns, and tailored resume bullet points precisely matching what they want.
          </p>

          <div className="z-10 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0f111a]/80 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#151823]/80 px-5 py-3 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Job Description
              </div>
            </div>
            
            <div className="relative">
              <textarea 
                className="h-[300px] w-full resize-none bg-transparent p-6 text-[15px] leading-relaxed text-slate-200 placeholder-slate-600 focus:outline-none" 
                placeholder="Paste the full job description here... Our AI will automatically extract the company, role, requirements, and provide custom resume bullets."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              {parseMutation.isError && <p className="absolute bottom-6 left-6 text-sm font-medium text-rose-400">Error: {(parseMutation.error as Error).message}</p>}
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 bg-[#151823] px-6 py-4">
              <span className="text-xs font-mono text-slate-500">{jobDescription.length} characters</span>
              <button 
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-fuchsia-400 active:scale-95 transition-all disabled:opacity-50"
                onClick={() => parseMutation.mutate()}
                disabled={parseMutation.isPending || !jobDescription.trim()}
              >
                {parseMutation.isPending ? "Analyzing..." : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Analyze Job
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Overlay Section below */}
          {parseResult && (
            <div className="z-10 mt-8 w-full max-w-4xl animate-in slide-in-from-top-8 fade-in duration-500 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-6 md:p-8 shadow-2xl backdrop-blur-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-emerald-500/20 pb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    {parseResult.companyName || "Unknown Company"}
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-medium">Auto-Extracted</span>
                  </h3>
                  <p className="text-emerald-100 text-lg mt-1">{parseResult.role || "-"}</p>
                </div>
                <button 
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50"
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate()}
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Save to Tracker
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div>
                  <p className="text-xs text-emerald-500/80 uppercase font-semibold mb-1">Seniority</p>
                  <p className="font-medium text-emerald-50">{parseResult.seniority || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-500/80 uppercase font-semibold mb-1">Location</p>
                  <p className="font-medium text-emerald-50">{parseResult.location || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-emerald-500/80 uppercase font-semibold mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {parseResult.requiredSkills.slice(0, 8).map((skill, i) => (
                      <span key={i} className="rounded-md bg-emerald-900/50 border border-emerald-500/30 px-2.5 py-1 text-xs font-medium text-emerald-200">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
              
              {parseResult.resumeSuggestions.length > 0 && (
                <div className="rounded-2xl bg-[#0f111a]/50 p-6 border border-emerald-500/10">
                  <p className="text-sm text-emerald-400 font-semibold mb-4 flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Tailored Resume Bullet Points
                  </p>
                  <div className="space-y-3">
                    {parseResult.resumeSuggestions.map((b, i) => (
                      <div key={i} className="group/bullet flex items-start justify-between gap-4 rounded-xl bg-emerald-950/20 p-4 hover:bg-emerald-900/30 transition-colors border border-transparent hover:border-emerald-500/20">
                        <span className="text-sm text-slate-300 leading-relaxed">• {b}</span>
                        <button className="shrink-0 rounded bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 opacity-0 group-hover/bullet:opacity-100 hover:bg-slate-700 hover:text-white transition-all shadow-sm" onClick={() => navigator.clipboard.writeText(b)}>Copy</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* Tracker / Board View */}
      {currentView === 'board' && (
        <main className="flex h-full flex-1 flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-6 py-8 md:px-12 custom-scrollbar">
            
            {/* Quick Metrics */}
            <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total Apps" value={stats.total} color="indigo" />
              <StatCard label="In Progress" value={stats.active} color="sky" />
              <StatCard label="Offers" value={stats.offers} color="emerald" />
              <StatCard label="Rejected" value={stats.rejected} color="rose" />
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 pb-12">
              {grouped.map((col) => (
                <div 
                  key={col.status} 
                  className="flex flex-col h-fit min-h-[250px] rounded-2xl border border-slate-800/60 bg-[#121520]/80 p-3 xl:p-4 transition-colors hover:border-slate-700/60"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    const app = appsQuery.data?.find(a => a._id === id);
                    if (app && app.status !== col.status) {
                      updateMutation.mutate({ id, payload: { status: col.status as Status } });
                    }
                  }}
                >
                  <div className="mb-4 flex items-center justify-between px-2">
                    <h3 className="font-medium tracking-tight text-slate-100">{col.status}</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800/80 text-xs font-semibold text-slate-400">{col.items.length}</span>
                  </div>
                  
                  <div className="flex flex-col flex-1 gap-3">
                    {col.items.map((item) => (
                      <div
                        key={item._id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", item._id)}
                        onClick={() => setSelected(item)}
                        className="group cursor-grab active:cursor-grabbing hover:-translate-y-1 rounded-xl border border-slate-700/50 bg-[#1a1e2d] p-4 shadow-sm hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:shadow-lg transition-all"
                      >
                        <p className="font-semibold text-slate-100">{item.company}</p>
                        <p className="mt-1 text-sm font-medium text-slate-400">{item.role}</p>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                            {new Date(item.dateApplied || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          
                          {item.requiredSkills && item.requiredSkills.length > 0 && (
                            <div className="flex -space-x-1">
                              {item.requiredSkills.slice(0, 3).map((skill, i) => (
                                <div key={i} className="flex h-5 items-center rounded-full border border-slate-700 bg-slate-800 px-2 text-[10px] text-slate-300" title={skill}>
                                  {skill.slice(0,1)}
                                </div>
                              ))}
                              {item.requiredSkills.length > 3 && (
                                 <div className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] text-slate-400">+{item.requiredSkills.length - 3}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {col.items.length === 0 && (
                      <div className="flex flex-1 min-h-[100px] items-center justify-center rounded-xl border border-dashed border-slate-800 pointer-events-none opacity-50">
                        <p className="text-xs text-slate-500">Drop here</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* Editor Modal Overlay */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-[#0f111a] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="border-b border-slate-800 bg-[#151823] px-6 py-5">
              <h3 className="text-xl font-bold text-white">{selected.company}</h3>
              <p className="text-sm text-indigo-400 font-medium mt-1">{selected.role}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Link to JD</label>
                  <input 
                    className="w-full rounded-xl border border-slate-800 bg-[#151823] p-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors" 
                    value={selected.jdLink || ""} 
                    onChange={(e) => setSelected({ ...selected, jdLink: e.target.value })} 
                    placeholder="https://..." 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Salary Expectation</label>
                  <input 
                    className="w-full rounded-xl border border-slate-800 bg-[#151823] p-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors" 
                    value={selected.salaryRange || ""} 
                    onChange={(e) => setSelected({ ...selected, salaryRange: e.target.value })} 
                    placeholder="$120k - $140k" 
                  />
                </div>
              </div>
              
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase text-slate-400">Personal Notes</label>
                <textarea 
                  className="h-28 w-full resize-none rounded-xl border border-slate-800 bg-[#151823] p-3 text-sm focus:border-indigo-500 focus:outline-none transition-colors" 
                  value={selected.notes || ""} 
                  onChange={(e) => setSelected({ ...selected, notes: e.target.value })} 
                  placeholder="Interview key points, recruiter name, etc." 
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 bg-[#151823] px-6 py-4">
              <button 
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors" 
                onClick={() => { deleteMutation.mutate(selected._id); setSelected(null); }}
              >
                Delete Application
              </button>
              <div className="flex gap-3">
                <button className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors" onClick={() => setSelected(null)}>Cancel</button>
                <button 
                  className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 active:scale-95 transition-all" 
                  onClick={() => { updateMutation.mutate({ id: selected._id, payload: selected }); setSelected(null); }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
