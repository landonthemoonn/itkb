import { useState, useEffect, useMemo } from 'react';
import { Shield, User, Database, RefreshCw, CheckCircle, AlertCircle, FileText, Lock, Globe, Search, Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Chat from './components/Chat';
import { Article } from './types';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState<'employee' | 'internal'>('employee');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      const data = await response.json();
      setArticles(data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
    const interval = setInterval(fetchArticles, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredArticles = useMemo(() => {
    if (!searchTerm.trim()) return articles;
    const term = searchTerm.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(term) ||
      article.metadata.systems.some(s => s.toLowerCase().includes(term))
    );
  }, [articles, searchTerm]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `Indexed: ${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  };

  const handleImport = async () => {
    setImporting(true);
    setImportStatus(null);
    try {
      const response = await fetch('/api/import', { method: 'POST' });
      const data = await response.json();
      if (data.status === 'success') {
        setImportStatus({ success: true, message: 'Import completed successfully!' });
        fetchArticles();
      } else {
        setImportStatus({ success: false, message: `Import failed: ${data.message}` });
      }
    } catch (error) {
      setImportStatus({ success: false, message: 'Failed to trigger import.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen selection:bg-charcoal selection:text-ivory font-sans">
      {/* Ghosted Background Text */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="ghost-text absolute -top-10 -left-20 font-display font-bold">
          GAP<br />STUDIO
        </div>
        <div className="ghost-text absolute bottom-0 right-0 font-display font-bold text-right">
          PHOTO<br />TECH
        </div>
      </div>

      {/* Corporate Nav */}
      <nav className="fixed top-0 left-0 w-full p-8 flex justify-between items-center z-50 bg-ivory/80 backdrop-blur-md border-b border-charcoal/5">
        <div className="flex items-center gap-16">
          <div className="flex flex-col">
            <span className="text-xl font-display font-bold tracking-tighter text-charcoal">GAP INC.</span>
            <span className="text-[8px] uppercase tracking-[0.4em] font-bold opacity-40">Photo Studio Tech</span>
          </div>
          <div className="hidden lg:flex gap-10">
            <button className="text-[10px] uppercase tracking-widest font-semibold hover:text-accent transition-colors">Studio Support</button>
            <button className="text-[10px] uppercase tracking-widest font-semibold hover:text-accent transition-colors">Set Status</button>
            <button className="text-[10px] uppercase tracking-widest font-semibold hover:text-accent transition-colors">Equipment</button>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 px-3 py-1 bg-charcoal/5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-[9px] uppercase tracking-widest font-bold text-charcoal/60">Studio Online</span>
          </div>
          <div className="flex gap-2 p-1 bg-charcoal/5 rounded-lg">
            <button 
              onClick={() => setUserRole('employee')}
              className={`px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-md transition-all ${
                userRole === 'employee' ? 'bg-white shadow-sm text-charcoal' : 'opacity-40 hover:opacity-100'
              }`}
            >
              Studio Crew
            </button>
            <button 
              onClick={() => setUserRole('internal')}
              className={`px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold rounded-md transition-all ${
                userRole === 'internal' ? 'bg-white shadow-sm text-charcoal' : 'opacity-40 hover:opacity-100'
              }`}
            >
              Studio Tech
            </button>
          </div>
          {userRole === 'internal' && (
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white text-[9px] uppercase tracking-widest font-bold rounded-lg hover:bg-accent/90 transition-all disabled:opacity-50"
            >
              {importing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
              {importing ? 'Importing...' : 'Import WordPress'}
            </button>
          )}
        </div>
      </nav>

      {importStatus && (
        <div className="fixed top-24 right-8 z-[60]">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border ${
              importStatus.success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
            }`}
          >
            {importStatus.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider">{importStatus.success ? 'Success' : 'Error'}</span>
              <span className="text-[10px] opacity-80">{importStatus.message}</span>
            </div>
            <button onClick={() => setImportStatus(null)} className="ml-4 opacity-40 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex flex-col justify-center px-8 md:px-24 pt-48 pb-24 z-10">
        {/* Blurred Gradient Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-gradient z-0"></div>
        
        <div className="relative z-10 max-w-4xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent text-[10px] uppercase tracking-[0.6em] font-bold mb-6"
          >
            Internal Knowledge Repository
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[10vw] md:text-[6vw] font-display font-bold leading-[0.95] tracking-tighter text-charcoal"
          >
            Empowering<br />
            Our Creative<br />
            Teams.
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="mt-10 max-w-xl text-base leading-relaxed font-medium text-charcoal/80"
          >
            Access the latest studio protocols, equipment guides, and technical workflows 
            curated specifically for the Gap Inc. Photo Studio.
          </motion.div>
        </div>
      </section>

      {/* Search & Grid Section */}
      <section className="px-8 md:px-24 py-24 z-10 relative bg-charcoal/5">
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
          <div className="flex items-baseline gap-4">
            <h3 className="text-3xl font-display font-bold text-charcoal">Documentation</h3>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-30">v2.4.0</span>
          </div>
          <div className="relative w-full md:w-[500px]">
            <input 
              type="text" 
              placeholder="Search by system, issue, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-charcoal/10 rounded-xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm placeholder:opacity-40"
            />
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-charcoal opacity-20" size={20} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article, idx) => (
            <motion.div 
              key={article.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              onClick={() => setSelectedArticle(article)}
              className="bg-white p-8 rounded-2xl border border-charcoal/5 hover:border-accent/30 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="p-2 bg-ivory rounded-lg group-hover:bg-accent/10 transition-colors">
                  <FileText size={20} className="text-charcoal group-hover:text-accent transition-colors" />
                </div>
                <div className="flex gap-1">
                  {article.metadata.systems.slice(0, 1).map(s => (
                    <span key={s} className="px-2 py-1 bg-charcoal/5 text-[8px] uppercase font-bold tracking-widest rounded text-charcoal/60">{s}</span>
                  ))}
                </div>
              </div>
              <h4 className="text-xl font-display font-bold text-charcoal mb-4 group-hover:text-accent transition-colors">{article.title}</h4>
              <p className="text-xs text-charcoal/50 leading-relaxed line-clamp-2 mb-8">
                {article.content.employee.summary}
              </p>
              <div className="mt-auto pt-6 border-t border-charcoal/5 flex justify-between items-center">
                <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Article ID: {article.id}</span>
                <div className="text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest">
                  View <Globe size={10} />
                </div>
              </div>
            </motion.div>
          ))}
          {loading && [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white p-8 rounded-2xl border border-charcoal/5 animate-pulse h-64"></div>
          ))}
        </div>
      </section>

      {/* Article Detail View */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-charcoal/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="px-8 py-6 border-b border-charcoal/5 flex justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-charcoal rounded-xl flex items-center justify-center text-white">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-charcoal">{selectedArticle.title}</h3>
                    <div className="flex gap-2 items-center">
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">Knowledge Base</span>
                      <div className="w-1 h-1 rounded-full bg-charcoal/20"></div>
                      <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">ID: {selectedArticle.id}</span>
                      {selectedArticle.indexed_at && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-charcoal/20"></div>
                          <span className="text-[9px] uppercase tracking-widest font-bold opacity-40">{formatDate(selectedArticle.indexed_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedArticle(null)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-ivory rounded-full transition-colors"
                >
                  <X size={24} className="text-charcoal" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-10">
                  <div className="p-6 bg-ivory rounded-2xl">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-6 block">Article Details</span>
                    <div className="space-y-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold opacity-40">Owner</span>
                        <span className="text-xs font-bold text-charcoal">{selectedArticle.metadata.owner}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold opacity-40">Last Reviewed</span>
                        <span className="text-xs font-bold text-charcoal">{selectedArticle.metadata.last_reviewed}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] uppercase font-bold opacity-40">Affected Systems</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedArticle.metadata.systems.map(s => (
                            <span key={s} className="px-2 py-1 bg-white border border-charcoal/10 text-[8px] uppercase font-bold rounded">{s}</span>
                          ))}
                        </div>
                      </div>
                      {selectedArticle.metadata.tags && selectedArticle.metadata.tags.length > 0 && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase font-bold opacity-40">Tags</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {selectedArticle.metadata.tags.map(t => (
                              <span key={t} className="px-2 py-1 bg-charcoal/5 text-[8px] uppercase font-bold rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 border border-charcoal/5 rounded-2xl">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-charcoal/40 mb-4 block">Support</span>
                    <p className="text-xs leading-relaxed text-charcoal/60 italic">
                      {selectedArticle.content.employee.escalation}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-12">
                  <div className="space-y-8">
                    <div className="pb-8 border-b border-charcoal/5">
                      <div className="flex items-center gap-2 text-accent mb-4">
                        <Globe size={16} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Overview</span>
                      </div>
                      <p className="text-sm leading-relaxed text-charcoal/80 font-medium">
                        {selectedArticle.content.employee.summary}
                      </p>
                    </div>

                    <div className="pb-8 border-b border-charcoal/5">
                      <div className="flex items-center gap-2 text-accent mb-6">
                        <CheckCircle size={16} />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Recommended Steps</span>
                      </div>
                      <div className="text-sm leading-relaxed text-charcoal/80 whitespace-pre-wrap bg-ivory/50 p-6 rounded-2xl border border-charcoal/5">
                        {selectedArticle.content.employee.steps}
                      </div>
                    </div>
                  </div>

                  {userRole === 'internal' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-charcoal rounded-3xl text-white space-y-10 shadow-xl"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <Shield size={18} className="text-accent" />
                          </div>
                          <span className="text-[11px] uppercase tracking-[0.3em] font-bold">IT Internal Protocol</span>
                        </div>
                        <span className="text-[8px] uppercase font-bold px-2 py-1 bg-red-500/20 text-red-300 rounded">Restricted Access</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <h5 className="text-[9px] uppercase font-bold opacity-40 tracking-widest">Technical Diagnostics</h5>
                          <div className="text-xs font-mono leading-relaxed opacity-90 bg-black/20 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                            {selectedArticle.content.internal.diagnostics}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h5 className="text-[9px] uppercase font-bold opacity-40 tracking-widest">Remediation Path</h5>
                          <div className="text-xs leading-relaxed opacity-90">
                            {selectedArticle.content.internal.remediation}
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-8 border-t border-white/10">
                        <h5 className="text-[9px] uppercase font-bold opacity-40 mb-4 tracking-widest">Administrative Resources</h5>
                        <div className="text-xs italic opacity-70 flex items-center gap-2">
                          <Lock size={12} /> {selectedArticle.content.internal.admin_links}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="p-12 bg-ivory/50 rounded-3xl border border-dashed border-charcoal/10 flex flex-col items-center justify-center text-center">
                      <Lock size={32} className="mb-4 text-charcoal opacity-10" />
                      <h4 className="text-[10px] uppercase tracking-[0.4em] font-bold text-charcoal/40 mb-2">Internal Documentation Restricted</h4>
                      <p className="text-[9px] text-charcoal/30 max-w-[250px]">Please authenticate with an IT Internal profile to access technical diagnostics and remediation steps.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <Chat articles={articles} userRole={userRole} />

      {/* Footer Simulation Control */}
      <footer className="fixed bottom-8 left-8 z-50">
        <button 
          onClick={async () => {
            const mockArticle = {
              id: Math.floor(Math.random() * 1000),
              title: "Global POS System Latency (Store Support)",
              slug: "pos-latency",
              metadata: {
                systems: ["Oracle Xstore", "Gap Store Network"],
                owner: "Gap Tech Ops",
                last_reviewed: new Date().toISOString().split('T')[0]
              },
              content: {
                employee: {
                  summary: "We are investigating reports of slow transaction processing across North American stores. This appears to be related to a regional network bottleneck.",
                  steps: "1. Do not restart the POS terminals.\n2. Use offline mode if transaction time exceeds 60 seconds.\n3. Log all manual transactions for later reconciliation.",
                  escalation: "Escalate to Store Support Tier 2 if offline mode fails."
                },
                internal: {
                  diagnostics: "Latency spikes detected in US-EAST-1 regional hub. Packet loss > 15% on primary MPLS circuit.",
                  remediation: "Failover to secondary LTE backup for affected store IDs. Purge cache on regional edge nodes.",
                  admin_links: "Monitor real-time traffic at: https://netops.gapinc.com/dashboard"
                }
              }
            };
            await fetch('/api/index', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mockArticle)
            });
            fetchArticles();
          }}
          className="w-12 h-12 bg-charcoal text-white rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
          title="Simulate Sync"
        >
          <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </footer>
    </div>
  );
}
