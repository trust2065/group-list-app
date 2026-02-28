import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ClipboardList, Plus, Trash2, ChevronRight, Users } from 'lucide-react';

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleted, setShowDeleted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      const q = query(collection(db, 'sessions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchSessions();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('確定要隱藏這筆記錄？')) return;
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
    return d.toLocaleDateString('zh-TW', {
      year: 'numeric', month: 'long', day: 'numeric',
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
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-slate-800">
            <ClipboardList size={32} className="text-indigo-600" />
            <h1 className="text-2xl font-bold">分組名單記錄</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDeleted(!showDeleted)}
              className="text-sm font-medium text-slate-500 hover:text-indigo-600 px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl transition-all"
            >
              {showDeleted ? '隱藏已刪除' : '顯示已刪除'}
            </button>
            <button
              onClick={() => navigate('/new')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl shadow hover:shadow-lg transition-all active:scale-95"
            >
              <Plus size={20} />
              新增分組
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">載入中…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
            <p>還沒有任何記錄</p>
            <p className="text-sm mt-1">點右上角「新增分組」開始</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions
              .filter(s => showDeleted ? s.deleted : !s.deleted)
              .map(session => {
                const { checked, total } = getTotalChecked(session);
                return (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
                  >
                    {/* Group color dots */}
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
                            第{i + 1}組 {g.members?.length || 0}人
                          </span>
                        ))}
                        {total > 0 && (
                          <span className="ml-1 text-emerald-600 font-medium">
                            ✓ {checked}/{total}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {session.deleted ? (
                        <button
                          onClick={(e) => handleRestore(e, session.id)}
                          className="p-2 rounded-xl text-indigo-500 hover:text-white hover:bg-indigo-500 transition-colors text-sm font-bold"
                        >
                          恢復
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
      </div>
    </div>
  );
}
