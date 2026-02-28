import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query, updateDoc, doc, limit } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ClipboardList, Plus, Trash2, ChevronRight, Users, HelpCircle } from 'lucide-react';
import Footer from '../components/Footer.jsx';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to hide this session?')) return;
    await updateDoc(doc(db, 'sessions', id), { deleted: true });
    setSessions(prev => prev.map(s => s.id === id ? { ...s, deleted: true } : s));
  };

  const handleRestore = async (e, id) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'sessions', id), { deleted: false });
    setSessions(prev => prev.map(s => s.id === id ? { ...s, deleted: false } : s));
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getTotalChecked = (session) => {
    let checked = 0, total = 0;
    session.groups?.forEach(g => g.members?.forEach(m => {
      total++;
      if (m.checked) checked++;
    }));
    return { checked, total };
  };

  const groupColors = ['bg-emerald-500', 'bg-blue-500', 'bg-rose-500'];

  return (
    <div className="min-h-[100vh] flex flex-col bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full mx-auto flex-grow flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-slate-800">
            <ClipboardList size={32} className="text-indigo-600" />
            <h1 className="text-2xl font-bold">Sessions</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate('/new')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl shadow hover:shadow-lg transition-all active:scale-95"
            >
              <Plus size={20} />
              New Session
            </button>
            <button
              onClick={() => navigate('/help')}
              className="p-3 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl border border-slate-200 transition-all shadow-sm"
              title="How to use"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
            <p>No history yet</p>
            <p className="text-sm mt-1">Click "New Team" to start</p>
          </div>
        ) : (
          <div className="space-y-3">
            {showDeleted && (
              <button
                onClick={() => setShowDeleted(false)}
                className="w-fit mb-6 flex items-center gap-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 font-bold px-3 h-8 rounded-lg shadow-sm hover:shadow transition-all active:scale-95 text-xs"
              >
                Hide Deleted
              </button>
            )}
            {sessions
              .filter(s => showDeleted ? s.deleted : !s.deleted)
              .map(session => {
                const { total } = getTotalChecked(session);
                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    {/* Team color dots */}
                    <div className="flex gap-1.5 shrink-0">
                      {(session.groups || []).map((g, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${groupColors[i]}`} />
                      ))}
                    </div>

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <div className="font-semibold text-slate-800 text-sm">
                        {formatDate(session.createdAt)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {(session.groups || []).map((g, i) => (
                          <span key={i} className="flex items-center gap-1">
                            <Users size={11} />
                            {i === 3 ? 'Temp' : `Team ${i + 1}`} ({g.members?.length || 0})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {session.deleted ? (
                        <button
                          onClick={(e) => handleRestore(e, session.id)}
                          className="p-2 rounded-xl text-indigo-500 hover:text-white hover:bg-indigo-500 transition-colors text-sm font-bold"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="p-2 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {!showDeleted && sessions.length > 0 && (
          <button
            onClick={() => setShowDeleted(true)}
            className="w-fit mt-6 mb-2 flex items-center gap-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-500 font-bold px-3 h-8 rounded-lg shadow-sm hover:shadow transition-all active:scale-95 text-xs"
          >
            Show Deleted
          </button>
        )}
        <Footer />
      </div>
    </div>
  );
}
