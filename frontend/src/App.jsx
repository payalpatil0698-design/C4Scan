import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Search, UploadCloud, FileText, BarChart2,
  Clock, Stethoscope, ChevronRight, User, Settings,
  BrainCircuit, LayoutDashboard, ShieldCheck, HeartPulse,
  Sun, Moon
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell, PieChart, Pie
} from 'recharts';
import { io } from 'socket.io-client';
import { Send, X, MessageSquare, Bot } from 'lucide-react';
import { supabase } from './supabaseClient';

// Mock Data
const recentScans = [
  { id: 1, type: 'Skin Cancer Detection', status: 'Completed', conf: 96, time: '2m ago', result: 'Melanoma', color: 'text-red-400' },
  { id: 2, type: 'Brain MRI Scan', status: 'Completed', conf: 93, time: '15m ago', result: 'Tumor Detected', color: 'text-orange-400' },
  { id: 3, type: 'Lung CT Scan', status: 'Completed', conf: 89, time: '1h ago', result: 'Normal', color: 'text-emerald-400' },
  { id: 4, type: 'Breast Mammogram', status: 'Completed', conf: 98, time: '2h ago', result: 'Benign', color: 'text-emerald-400' },
  { id: 5, type: 'Histopathology', status: 'Processing', conf: null, time: 'Just now', result: '-', color: 'text-slate-400' },
];

const accuracyData = [
  { name: 'Jan', value: 88 },
  { name: 'Feb', value: 92 },
  { name: 'Mar', value: 91 },
  { name: 'Apr', value: 96 },
  { name: 'May', value: 94 },
  { name: 'Jun', value: 97 },
];

const cancerTypeData = [
  { name: 'Skin', value: 400, color: '#06b6d4' },
  { name: 'Lung', value: 300, color: '#3b82f6' },
  { name: 'Brain', value: 300, color: '#8b5cf6' },
  { name: 'Breast', value: 200, color: '#ec4899' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  React.useEffect(() => {
    // Check for existing session or demo bypass
    const isDemo = window.localStorage.getItem('demo_access') === 'true';
    if (isDemo) {
      setIsAuthenticated(true);
      setCurrentUser({
        id: 'demo-user',
        username: 'Demo Surgeon',
        email: 'demo@c4scan.ai',
        role: 'doctor'
      });
      return; 
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        // Map Supabase user metadata or fetch Profile if needed
        setCurrentUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'patient'
        });
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setCurrentUser({
          id: session.user.id,
          username: session.user.user_metadata?.username || session.user.email,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'patient'
        });
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const features = [
    { name: 'Clinical Dashboard', tab: 'dashboard', icon: <LayoutDashboard size={14} />, desc: 'Main overview & stats' },
    { name: 'Run AI Engine', tab: 'run', icon: <UploadCloud size={14} />, desc: 'Diagnostic scan analysis' },
    { name: 'Patient Records', tab: 'records', icon: <FileText size={14} />, desc: 'Past case history' },
    { name: 'Activity Tracker', tab: 'activity', icon: <HeartPulse size={14} />, desc: 'Physical health trends' },
    { name: 'Model Insights', tab: 'insights', icon: <BarChart2 size={14} />, desc: 'AI performance metrics' },
    { name: 'System Settings', tab: 'settings', icon: <Settings size={14} />, desc: 'Profile & App configuration' },
  ];

  const filteredFeatures = features.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    window.localStorage.removeItem('demo_access');
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen overflow-hidden text-slate-200">

      {/* Sidebar Navigation */}
      <motion.aside
        initial={{ x: -280 }} animate={{ x: 0 }}
        className="w-64 flex-shrink-0 glass-card m-4 mr-0 p-5 flex flex-col relative z-20 border-r border-slate-700/50 hidden md:flex"
      >
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex justify-center items-center shadow-lg shadow-cyan-500/20">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">C4<span className="text-cyan-400">Scan</span></h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<UploadCloud size={20} />} label="Run AI Engine" active={activeTab === 'run'} onClick={() => setActiveTab('run')} neon />
          <NavItem icon={<FileText size={20} />} label="Patient Records" active={activeTab === 'records'} onClick={() => setActiveTab('records')} />
          <NavItem icon={<HeartPulse size={20} />} label="Activity Tracker" active={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
          <NavItem icon={<BarChart2 size={20} />} label="Model Insights" active={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <div className={`flex items-center gap-3 mt-4 px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeTab === 'settings' ? 'bg-indigo-500/10 border border-indigo-500/30' : 'bg-slate-800/50 hover:bg-slate-700/50'}`} onClick={() => setActiveTab('settings')}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/50">
              <User size={16} className="text-indigo-400" />
            </div>
            <div className="text-sm flex-1">
              <p className="font-semibold text-slate-200">{currentUser?.username || "Dr. Collins"}</p>
              <p className="text-xs text-slate-400 capitalize">{currentUser?.role || "Doctor"}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">

        {isSearchFocused && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-30"
          />
        )}

        {/* Header */}
        <header className={`h-20 flex-shrink-0 flex items-center justify-between px-8 py-4 m-4 ml-6 mb-0 glass-card relative transition-all duration-300 ${isSearchFocused ? 'z-40 border-cyan-500/30' : 'z-20'}`}>
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search features or patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500/50 transition-all text-slate-200 placeholder-slate-500"
            />

            {/* Quick Navigation Dropdown */}
            <AnimatePresence>
              {isSearchFocused && (searchQuery || isSearchFocused) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full mt-3 bg-slate-900/98 border border-slate-700/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl z-50 overflow-hidden p-2"
                >
                  <p className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 mb-2">Navigate to Feature</p>
                  {filteredFeatures.length > 0 ? filteredFeatures.map(f => (
                    <div
                      key={f.tab}
                      onClick={() => { setActiveTab(f.tab); setSearchQuery(''); }}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-colors group"
                    >
                      <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/50 transition-colors">
                        {f.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-200">{f.name}</p>
                        <p className="text-[10px] text-slate-500">{f.desc}</p>
                      </div>
                      <ChevronRight size={12} className="ml-auto text-slate-600 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  )) : (
                    <div className="p-4 text-center text-xs text-slate-500 italic">No matching features found...</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors relative">
              <Activity className="w-5 h-5" />
              <span className="absolute top-1 right-2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <DashboardView key="dashboard" onNavigate={setActiveTab} />
            ) : activeTab === 'settings' ? (
              <ProfileView key="settings" currentUser={currentUser} onLogout={handleLogout} />
            ) : activeTab === 'activity' ? (
              <ActivityTrackerView key="activity" />
            ) : activeTab === 'records' ? (
              <PatientRecordsView key="records" />
            ) : activeTab === 'insights' ? (
              <ModelInsightsView key="insights" />
            ) : (
              <RunAIView key="run" />
            )}
          </AnimatePresence>
        </div>

        {/* Floating Assistant Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-lg shadow-cyan-500/40 hover:shadow-cyan-500/60 flex items-center justify-center hover:scale-105 transition-all text-white z-50"
        >
          <BrainCircuit className="w-6 h-6" />
        </button>

        {/* AI Chat Assistant Overlay */}
        <AnimatePresence>
          {isChatOpen && (
            <ChatAssistant
              user={currentUser}
              onClose={() => setIsChatOpen(false)}
              assistantName="Doctor Onco" // Pass the new name as a prop
            />
          )}
        </AnimatePresence>
      </main>

    </div>
  );
}

function LoginView() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('Dr. Collins');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('doctor');
  const [medicalLicense, setMedicalLicense] = useState('');
  const [hospitalAuth, setHospitalAuth] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        if (role === 'doctor' && (!medicalLicense || !hospitalAuth)) {
          throw new Error("Medical License and Hospital Affiliation are rigorously required for Doctor registration.");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username, role, medical_license: medicalLicense, hospital_affiliation: hospitalAuth }
          }
        });
        if (error) throw error;
        setSuccess('Verify your clinical email to continue.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email || username, // Allow using email or username (if it's an email)
          password
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/20 blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card p-8 relative z-10 border border-slate-700/50"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex justify-center items-center shadow-lg shadow-cyan-500/30 mb-4 transform hover:rotate-12 transition-transform">
            <BrainCircuit className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">C4<span className="text-cyan-400">Scan</span></h1>
          <p className="text-slate-400 text-sm text-center">{isRegistering ? 'Create Real Account' : 'Secure Access Terminal'}</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-center text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center justify-center text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-slate-600"
                placeholder="Full Name or Handle"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-slate-600"
                  placeholder="real.email@example.com"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Passcode</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder-slate-600"
                placeholder="Enter password"
              />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('doctor')}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${role === 'doctor' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => setRole('patient')}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border ${role === 'patient' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900/50 border-slate-700 text-slate-400'}`}
                >
                  Patient
                </button>
              </div>
            </div>
          )}

          {isRegistering && role === 'doctor' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Medical License No.</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 w-5 h-5" />
                  <input
                    type="text"
                    value={medicalLicense}
                    onChange={(e) => setMedicalLicense(e.target.value)}
                    required={isRegistering && role === 'doctor'}
                    className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder-slate-600"
                    placeholder="e.g. AB1234567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Hospital / Clinic Affiliation</label>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500/50 w-5 h-5" />
                  <input
                    type="text"
                    value={hospitalAuth}
                    onChange={(e) => setHospitalAuth(e.target.value)}
                    required={isRegistering && role === 'doctor'}
                    className="w-full bg-slate-900/50 border border-slate-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-emerald-100 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all placeholder-slate-600"
                    placeholder="e.g. Mount Sinai Medical Center"
                  />
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold tracking-wider text-sm transition-all duration-300 mt-2
              ${loading ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_20px_#06b6d44d] hover:shadow-[0_0_30px_#06b6d480]'}`}
          >
            {loading ? 'PROCESSING...' : (isRegistering ? 'CREATE ACCOUNT' : 'INITIALIZE UPLINK')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccess(''); }}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-widest font-bold block w-full"
          >
            {isRegistering ? 'Already have an account? Login' : 'Need a real account? Sign Up'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              // Bypass authentication for verification purposes
              window.localStorage.setItem('demo_access', 'true');
              window.location.reload();
            }}
            className="text-[10px] text-slate-600 hover:text-cyan-500/50 transition-colors uppercase tracking-widest block w-full"
          >
            Clinical Trial Demo (Bypass Login)
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, neon }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${active
        ? 'bg-slate-800/80 text-cyan-400 shadow-[inset_2px_0_0_rgba(6,182,212,1)]'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        }`}
    >
      <span className={`${active ? 'text-cyan-400' : 'text-slate-400'} group-hover:text-cyan-300 transition-colors`}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
      {neon && <span className="ml-auto w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></span>}
    </div>
  );
}

function DashboardView({ onNavigate }) {
  const [recentScansReal, setRecentScansReal] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadDashboard = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Parallel fetch for scans and stats
      const fetchScans = fetch('http://127.0.0.1:5000/api/cases', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());

      const fetchStats = fetch('http://127.0.0.1:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json()).catch(() => null);

      const [scans, statsData] = await Promise.all([fetchScans, fetchStats]);

      const formatted = (Array.isArray(scans) ? scans : []).reverse().slice(0, 5).map(c => ({
        id: c.id,
        type: c.prediction === 'Normal' ? 'Diagnostic Scan' : `${c.prediction} Analysis`,
        status: 'Completed',
        conf: (c.confidence * 100).toFixed(1),
        time: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        result: c.prediction,
        color: c.prediction === 'Normal' ? 'text-emerald-400' : 'text-red-400'
      }));
      setRecentScansReal(formatted);
      setStats(statsData);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="space-y-6 max-w-7xl mx-auto"
    >
      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<UploadCloud className="text-cyan-400" />} title="Detect Cancer"
            desc="Run AI analysis on new scan" onClick={() => onNavigate('run')} gradient="from-cyan-500/10 to-transparent border-cyan-500/30" hover="hover:border-cyan-400"
          />
          <ActionCard
            icon={<FileText className="text-indigo-400" />} title="Generate Report"
            desc="Export final PDF diagnostic" onClick={() => onNavigate('records')} gradient="from-indigo-500/10 to-transparent border-indigo-500/30" hover="hover:border-indigo-400"
          />
          <ActionCard
            icon={<ShieldCheck className="text-purple-400" />} title="Explain Result"
            desc="View Grad-CAM heatmaps" onClick={() => onNavigate('records')} gradient="from-purple-500/10 to-transparent border-purple-500/30" hover="hover:border-purple-400"
          />
          <ActionCard
            icon={<Clock className="text-emerald-400" />} title="Patient Records"
            desc="Access previous history" onClick={() => onNavigate('records')} gradient="from-emerald-500/10 to-transparent border-emerald-500/30" hover="hover:border-emerald-400"
          />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Scans" value={loading ? "..." : (stats?.total_cases ?? 0)} icon={<FileText size={18} className="text-slate-400" />} />
        <StatCard title="Cancer Detected" value={loading ? "..." : (stats ? Object.entries(stats.distribution || {}).reduce((acc, [k, v]) => k !== 'Normal' ? acc + v : acc, 0) : 0)} icon={<HeartPulse size={18} className="text-red-400" />} trend="+12% this week" />
        <StatCard title="Active Doctors" value={loading ? "..." : (stats?.total_doctors ?? 0)} icon={<Stethoscope size={18} className="text-cyan-400" />} />
        <StatCard title="AI Accuracy Model" value={loading ? "..." : `${(stats?.accuracy ?? 97.3).toFixed(1)}%`} icon={<Activity size={18} className="text-indigo-400" />} style="text-gradient font-bold" />
      </div>

      {/* Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Activity (Left side) */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Live AI Inference Stream
            </h3>
            <button onClick={() => onNavigate('records')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center">View All <ChevronRight size={14} /></button>
          </div>

          <div className="flex-1 space-y-4">
            {loading ? (
              <div className="text-center py-10 text-slate-500 italic">Syncing with clinical cluster...</div>
            ) : recentScansReal.length > 0 ? recentScansReal.map((scan, i) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                key={scan.id}
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/60 transition-colors"
                onClick={() => onNavigate('records')}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-700`}>
                    <BrainCircuit size={18} className={scan.conf ? 'text-cyan-400' : 'text-slate-500'} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-200">{scan.type}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      <Clock size={12} /> {scan.time}
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300">{scan.status}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`font-semibold text-sm ${scan.color}`}>{scan.result}</p>
                  {scan.conf && (
                    <p className="text-xs text-slate-400 mt-1">{scan.conf}% confidence</p>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="text-center py-10 text-slate-500 italic">No recent scans detected. Initiate a new diagnostic session.</div>
            )}
          </div>
        </div>

        {/* AI Insights (Right side) */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            System Insights
          </h3>

          <div className="mb-6 h-40">
            <h4 className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Detection Accuracies</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={['dataMin - 5', 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorAcc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex-1">
            <h4 className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wider">Scan Distribution</h4>
            <div className="h-40 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats && Object.keys(stats.distribution || {}).length > 0 ? Object.entries(stats.distribution || {}).map(([name, value], i) => ({
                      name, value, color: ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][i % 5]
                    })) : cancerTypeData}
                    innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value" stroke="none"
                  >
                    {(stats && Object.keys(stats.distribution || {}).length > 0 ? Object.entries(stats.distribution || {}) : cancerTypeData).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={stats && Object.keys(stats.distribution || {}).length > 0 ? ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5] : entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-bold">{loading ? "..." : (stats?.total_cases ?? 0)}</span>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}

function RunAIView() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrag = function (e) {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = function (e) {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const runAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append('scan', file);

    try {
      const response = await fetch('http://127.0.0.1:5000/api/predict', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        alert(data.message || 'Analysis failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to predictive server');
    } finally {
      setAnalyzing(false);
    }
  };

  if (result) return <AIResultsPage data={result} onReset={() => setResult(null)} />;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      className="max-w-6xl mx-auto glass-card p-1 pb-1 flex flex-col min-h-[500px] border border-slate-700/50"
    >
      <div className="bg-slate-900 border-b border-slate-700/50 p-6 rounded-t-2xl flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <BrainCircuit className="text-cyan-400" /> Run C4Scan Engine
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Upload biomedical images to initiate the automated diagnostic pipeline.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1 p-6 gap-8">
        {/* Left Side: Instructions */}
        <div className="w-full md:w-1/3 flex flex-col">
          <label className="text-sm font-medium text-slate-300 mb-2">Analysis Parameters</label>
          <textarea
            className="w-full h-32 bg-slate-950/50 border border-slate-700 focus:border-cyan-500/50 rounded-xl p-4 text-sm text-slate-200 resize-none transition-all placeholder-slate-600 focus:ring-1 focus:ring-cyan-500/30"
            placeholder="E.g., Analyze MRI scan for brain tumor in parietal lobe region..."
            defaultValue="Analyze MRI scan for brain tumor."
          />

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck className="text-emerald-400 w-5 h-5" /> HIPAA Compliant Engine
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Activity className="text-indigo-400 w-5 h-5" /> Real-time Grad-CAM processing
            </div>
          </div>
        </div>

        {/* Right Side: Upload */}
        <div className="w-full md:w-2/3 flex flex-col relative h-[300px]">
          <div
            className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative overflow-hidden backdrop-blur-sm
              ${dragActive ? 'border-cyan-400 bg-cyan-900/10 scale-[1.02]' : 'border-slate-700 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-500'}`}
            onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          >
            {file ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <p className="font-medium text-lg text-emerald-300">{file.name}</p>
                <p className="text-xs text-slate-400 mt-2">Ready for inference</p>
                <button className="text-xs mt-4 text-red-400 hover:underline" onClick={() => setFile(null)}>Remove file</button>
              </motion.div>
            ) : (
              <>
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <UploadCloud className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-200">Drag & drop or <span className="text-cyan-400 cursor-pointer hover:underline" onClick={handleUploadClick}>click to upload</span></h3>
                <p className="text-sm text-slate-500 mt-2">Supported formats: MRI, CT, PNG, JPG, DICOM</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, .dcm"
                />
              </>
            )}

            {analyzing && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-indigo-500 border-b-purple-500 border-l-cyan-400 rounded-full animate-spin"></div>
                  <BrainCircuit className="absolute inset-0 m-auto text-white w-6 h-6 animate-pulse" />
                </div>
                <p className="text-cyan-400 font-medium tracking-widest text-sm uppercase">Analyzing Deep Features...</p>
              </div>
            )}
          </div>

          <button
            disabled={!file || analyzing}
            onClick={runAnalysis}
            className={`mt-4 w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm transition-all duration-300
              ${!file ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white neon-glow transform hover:-translate-y-1'}`}
          >
            Start AI Analysis
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function AIResultsPage({ data, onReset }) {
  const isHealthy = data.label === 'Normal';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Diagnostic Inference Complete</h2>
          <p className="text-slate-400">C4Scan Engine v4.2 - Multi-modal Analysis Result</p>
        </div>
        <div className={`px-4 py-2 ${isHealthy ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'} rounded-xl flex flex-col items-end border`}>
          <span className={`${isHealthy ? 'text-emerald-400' : 'text-red-400'} font-bold uppercase tracking-widest text-xs mb-1`}>
            {isHealthy ? 'No Anomaly' : 'Anomaly Detected'}
          </span>
          <span className="text-white font-medium">{isHealthy ? 'Normal Session' : 'Immediate Review'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Images */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 flex flex-col items-center border border-slate-700/50">
              <span className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-medium">Diagnostic Scan</span>
              <div className="w-full h-80 bg-slate-800/50 rounded-lg flex items-center justify-center relative overflow-hidden group">
                {/* Real scan if we could display it, otherwise placeholder but with result context */}
                <div className="absolute inset-0 bg-slate-900 flex items-center justify-center italic text-slate-600 text-xs">
                  Image Processed Successfully
                </div>
                <Activity className={`w-8 h-8 ${isHealthy ? 'text-emerald-500' : 'text-slate-600'} relative z-10`} />
              </div>
            </div>

            <div className={`glass-card p-4 flex flex-col items-center ${isHealthy ? 'border-slate-700/50' : 'border-purple-500/30'} relative`}>
              <div className="absolute top-0 right-0 p-2 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-tr-xl">
                <ShieldCheck className={`w-4 h-4 ${isHealthy ? 'text-slate-500' : 'text-purple-400'}`} />
              </div>
              <span className="text-xs text-slate-300 uppercase tracking-widest mb-3 font-medium">AI Feature Mapping</span>
              <div className="w-full h-80 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden group border border-slate-800">
                {data.heatmap ? (
                  <img
                    src={`http://127.0.0.1:5000${data.heatmap}`}
                    className="absolute inset-0 w-full h-full object-contain"
                    alt="Grad-CAM"
                  />
                ) : (
                  <div className="text-slate-600 text-xs text-center p-6 italic leading-relaxed">
                    {isHealthy ? "No visualization needed for normal scan." : "Heatmap generation pending..."}
                  </div>
                )}
                <Search className="w-8 h-8 text-slate-400 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <button
            onClick={onReset}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold transition-all"
          >
            ← ANALYZE ANOTHER SCAN
          </button>
        </div>

        {/* AI Prediction details */}
        <div className="space-y-4">
          <div className={`glass-card p-6 border-l-4 ${isHealthy ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <h3 className="text-sm text-slate-400 uppercase tracking-widest mb-1">AI Prediction</h3>
            <p className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              {data.label} <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </p>

            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Confidence Score</span>
                <span className={`${isHealthy ? 'text-emerald-400' : 'text-cyan-400'} font-bold`}>{(data.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${isHealthy ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gradient-to-r from-cyan-400 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'}`}
                  style={{ width: `${data.confidence * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <User className="text-indigo-400 w-4 h-4" /> Recommendation
            </h3>
            <div className="text-sm text-slate-400 mb-4 whitespace-pre-wrap leading-relaxed">
              {data.recommendation}
            </div>

            {!isHealthy && (
              <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-900/40">
                Book Consultation
              </button>
            )}

            <button
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch(`http://127.0.0.1:5000/api/reports/${data.case_id}/pdf`, {
                  headers: { 'Authorization': `Bearer ${session?.access_token}` }
                });
                if (!res.ok) { alert("Failed to generate PDF Report."); return; }
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `C4Scan_Report_${data.case_id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
              className="mt-3 w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-sm font-bold transition-colors"
            >
              Generate PDF Report
            </button>
          </div>

          {data.dicom && data.dicom.metadata && Object.keys(data.dicom.metadata).length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-3">DICOM Metadata</h3>
              <div className="space-y-2">
                {Object.entries(data.dicom.metadata).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[10px]">
                    <span className="text-slate-500">{key}</span>
                    <span className="text-slate-300 font-mono truncate ml-4">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon, title, desc, gradient, hover, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 cursor-pointer bg-gradient-to-br ${gradient} border group ${hover} transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden`}
    >
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
      <div className="w-12 h-12 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ title, value, icon, style, trend }) {
  return (
    <div className="glass-card p-5 flex items-start justify-between">
      <div>
        <h4 className="text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">{title}</h4>
        <p className={`text-2xl font-bold ${style || 'text-slate-100'}`}>{value}</p>
        {trend && <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><ArrowUpIcon /> {trend}</p>}
      </div>
      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
        {icon}
      </div>
    </div>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ProfileView({ currentUser, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  };

  React.useEffect(() => {
    if (theme === 'light') document.body.classList.add('light-mode');
  }, []);

  React.useEffect(() => {
    fetch('http://127.0.0.1:5000/api/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfile({
          username: data.username || '',
          email: data.email || '',
          age: data.age || '',
          gender: data.gender || '',
          blood_type: data.blood_type || '',
          medical_history: data.medical_history || '',
          city: data.city || '',
          address: data.address || '',
          specialization: data.specialization || ''
        });
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('http://127.0.0.1:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(profile)
      });
      if (res.ok) setMessage('Profile updated successfully!');
      else setMessage('Failed to update profile.');
    } catch {
      setMessage('Error connecting to server.');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-indigo-500 border-b-purple-500 border-l-cyan-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-cyan-400 font-medium tracking-widest text-sm uppercase">Loading Profile Data...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="glass-card p-8 border border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Settings className="text-cyan-400 w-6 h-6" />
          </div>
          Appearance & Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${theme === 'dark' ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-900/40 border-slate-700'}`} onClick={() => theme !== 'dark' && toggleTheme()}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Moon size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-200">Dark Mode</p>
                <p className="text-xs text-slate-500">Optimized for low-light clinical environments</p>
              </div>
            </div>
            {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>}
          </div>

          <div className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${theme === 'light' ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-slate-900/40 border-slate-700'}`} onClick={() => theme !== 'light' && toggleTheme()}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Sun size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-200">Light Mode</p>
                <p className="text-xs text-slate-500">Classic high-contrast view</p>
              </div>
            </div>
            {theme === 'light' && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>}
          </div>
        </div>
      </div>

      <div className="glass-card p-8 border border-slate-700/50">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <User className="text-indigo-400 w-6 h-6" />
          </div>
          Medical Profile Data
        </h2>

        {message && (
          <div className={`mb-8 p-4 rounded-xl border text-sm flex justify-center items-center font-medium ${message.includes('success') ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2 border-b border-slate-800">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
              <input type="text" value={profile.username} onChange={e => setProfile({ ...profile, username: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="Enter Full Name" />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Network Email</label>
              <input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="Enter Email Address" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Age</label>
              <input type="number" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="Enter age" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Gender</label>
              <select value={profile.gender} onChange={e => setProfile({ ...profile, gender: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all [&>option]:bg-slate-900">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Blood Type</label>
              <select value={profile.blood_type} onChange={e => setProfile({ ...profile, blood_type: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all [&>option]:bg-slate-900">
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">City / Location</label>
              <input type="text" value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="e.g., New York, NY" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Work Address</label>
              <input type="text" value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="e.g., Suite 402, Medical Center Plaza, 123 Health Blvd" />
            </div>
            {currentUser?.role === 'doctor' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Specialization</label>
                <input type="text" value={profile.specialization} onChange={e => setProfile({ ...profile, specialization: e.target.value })} className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all" placeholder="e.g., Oncologist" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Medical History & Allergies</label>
            <textarea value={profile.medical_history} onChange={e => setProfile({ ...profile, medical_history: e.target.value })} className="w-full h-40 bg-slate-900/50 border border-slate-700 rounded-xl py-4 px-4 text-sm text-slate-200 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none" placeholder="List any existing clinical conditions, past surgeries, or active allergies here..."></textarea>
          </div>

          <div className="pt-4 flex items-center gap-4">
            <button type="submit" disabled={saving} className={`flex-1 md:flex-none md:px-12 py-4 rounded-xl font-bold tracking-wider text-sm transition-all duration-300 ${saving ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-[0_0_20px_#06b6d44d] hover:shadow-[0_0_30px_#06b6d480]'}`}>
              {saving ? 'UPDATING SECURE RECORD...' : 'SAVE MEDICAL PROFILE'}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="md:px-8 py-4 rounded-xl font-bold tracking-wider text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
            >
              TERMINATE SESSION
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

function ActivityTrackerView() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadActivity = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      fetch('http://127.0.0.1:5000/api/activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          // Reverse array directly if we get valid data, else empty array
          const formatted = (data && Array.isArray(data) ? data : []).reverse().map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            steps: d.step_count || 0,
            walking: d.walking_time_minutes || 0,
            level: d.activity_level || 'low'
          }));

          // Use dummy placeholder data if the endpoints have zero database entries
          if (formatted.length === 0) {
            setActivities([
              { date: 'Mon', steps: 4500, walking: 30 },
              { date: 'Tue', steps: 6000, walking: 45 },
              { date: 'Wed', steps: 2200, walking: 15 },
              { date: 'Thu', steps: 8300, walking: 60 },
              { date: 'Fri', steps: 5500, walking: 40 },
              { date: 'Sat', steps: 9100, walking: 75 },
              { date: 'Sun', steps: 7200, walking: 50 },
              { date: 'Mon', steps: 8800, walking: 65 }
            ]);
          } else {
            setActivities(formatted);
          }

          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    };
    loadActivity();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-emerald-500 border-b-purple-500 border-l-red-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-cyan-400 font-medium tracking-widest text-sm uppercase">Loading Activity Stream...</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <HeartPulse className="text-emerald-400 w-8 h-8" /> Patient Recovery & Activity
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Monitor physical metrics to evaluate health progression post-diagnosis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-cyan-400" /> Daily Steps Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#334155', opacity: 0.4 }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="steps" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-wider">
            <Clock className="w-4 h-4 text-emerald-400" /> Active Walking Time (Min)
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activities} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWalk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff' }} />
                <Area type="monotone" dataKey="walking" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWalk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
          <BrainCircuit className="w-4 h-4 text-indigo-400" /> AI Recovery Insights
        </h3>
        <div className="border border-indigo-500/20 bg-indigo-500/5 rounded-xl p-5">
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            <span className="text-indigo-400 font-bold">Analysis:</span> The current activity profile denotes a highly varied mobility index. Maintaining a strict walking regimen of ~60 minutes daily mitigates postoperative fatigue risks and boosts cardiovascular resilience.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Target: 8,000 Steps/Day</span>
            <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full border border-yellow-500/30">Recent Drops Detected</span>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 mt-6 border-t border-emerald-500/20">
        <h3 className="text-sm font-semibold text-slate-300 mb-6 flex items-center gap-2 uppercase tracking-wider">
          <UploadCloud className="w-4 h-4 text-emerald-400" /> Log Daily Activity
        </h3>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const payload = {
            date: new Date().toISOString(),
            step_count: parseInt(formData.get('steps')),
            walking_time_minutes: parseInt(formData.get('walking')),
            activity_level: formData.get('level')
          };
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('http://127.0.0.1:5000/api/activity', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
              },
              body: JSON.stringify(payload)
            });
            if (res.ok) {
              alert('Activity logged successfully!');
              window.location.reload();
            }
          } catch (err) {
            console.error(err);
          }
        }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Step Count</label>
            <input name="steps" type="number" defaultValue="5000" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Walking (Min)</label>
            <input name="walking" type="number" defaultValue="30" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Intensity</label>
            <select name="level" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm [&>option]:bg-slate-900">
              <option value="low">Low Intensity</option>
              <option value="moderate">Moderate</option>
              <option value="high">High Performance</option>
            </select>
          </div>
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg text-sm transition-all shadow-lg shadow-emerald-900/20">
            Submit Log
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function PatientRecordsView() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadCases = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      fetch('http://127.0.0.1:5000/api/cases', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
        .then(res => res.json())
        .then(data => {
          setCases(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };
    loadCases();
  }, []);

  const downloadReport = async (caseId) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`http://127.0.0.1:5000/api/reports/${caseId}/pdf`, {
      headers: { 'Authorization': `Bearer ${session?.access_token}` }
    });
    if (!res.ok) { alert("Failed to download PDF."); return; }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `C4Scan_Report_${caseId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-t-cyan-400 border-slate-800 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <FileText className="text-cyan-400 w-8 h-8" /> Patient Diagnostics Archive
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Secure ledger of all AI-processed clinical cases.</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/80 border-b border-slate-700">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Case ID</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Inference Result</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {cases.length > 0 ? cases.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-slate-300">#C4S-{c.id}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${c.prediction === 'Normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {c.prediction}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-cyan-400 font-mono">{(c.confidence * 100).toFixed(1)}%</td>
                <td className="px-6 py-4 text-sm text-slate-400">{new Date(c.created_at).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm">
                  <button onClick={() => downloadReport(c.id)} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold text-xs group-hover:translate-x-1 transition-transform">
                    DOWNLOAD PDF <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">No diagnostic records found in uplink databases.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function ModelInsightsView() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadMetrics = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      fetch('http://127.0.0.1:5000/api/model/metrics', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      })
        .then(res => res.json())
        .then(data => {
          setMetrics(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };
    loadMetrics();
  }, []);

  if (loading) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
            <BarChart2 className="text-purple-400 w-8 h-8" /> AI Neuro-Core Insights
          </h2>
          <p className="text-slate-400 mt-1 text-sm">Technical validation metrics of the deep learning inference engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Validation Accuracy" value={`${(metrics?.accuracy || 0.973 * 100).toFixed(1)}%`} icon={<ShieldCheck className="text-emerald-400" />} trend="+1.2%" />
        <StatCard title="Inference Latency" value="142ms" icon={<Clock className="text-cyan-400" />} />
        <StatCard title="F1 Diagnostic Score" value="0.96" icon={<Activity className="text-indigo-400" />} />
      </div>

      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-6 uppercase tracking-widest">Training Progress Logic</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metrics?.history?.length > 0 ? metrics.history : accuracyData}>
              <XAxis dataKey="name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
              <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function ChatAssistant({ user, onClose }) {
  const [messages, setMessages] = useState([
    { user: 'Doctor Onco', text: 'Greetings. I am Doctor Onco, your specialized oncology AI. How can I assist you with your clinical findings or diagnostic data today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const newSocket = io('http://127.0.0.1:5000');
    setSocket(newSocket);

    newSocket.emit('join', { room: `user_${user.id}` });

    newSocket.on('message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => newSocket.close();
  }, [user.id]);

  React.useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const msgData = {
      room: `user_${user.id}`,
      user: user.username,
      user_id: user.id,
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    socket.emit('message', msgData);
    setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 w-96 h-[500px] glass-card flex flex-col z-[60] border border-cyan-500/30 shadow-2xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
            <Bot className="text-white w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">Doctor Onco AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-cyan-100 uppercase tracking-widest font-medium">Explainable Core Active</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/20">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.user === user.username ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.user === user.username
              ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'
              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
              <p className="leading-relaxed">{msg.text}</p>
              <div className={`text-[10px] mt-1 opacity-50 ${msg.user === user.username ? 'text-right' : 'text-left'}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Doctor Onco..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all placeholder-slate-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-10 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-all shadow-lg shadow-cyan-900/20 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}
