import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';

const THEMES = [
  { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bgLight: 'bg-emerald-50', ring: 'ring-emerald-400' },
  { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bgLight: 'bg-blue-50', ring: 'ring-blue-400' },
  { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', bgLight: 'bg-rose-50', ring: 'ring-rose-400' },
  { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-200', bgLight: 'bg-slate-50', ring: 'ring-slate-400' },
];

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'sessions', id),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.groups && data.groups.length === 3) {
            const newGroups = [...data.groups, { name: 'Bench / Temp Area', members: [] }];
            updateDoc(doc(db, 'sessions', snap.id), { groups: newGroups });
            return;
          }
          setSession({ id: snap.id, ...data });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore read error:', err);
        setError(err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, [id]);

  const toggleCheck = async (groupIdx, memberIdx) => {
    if (!session) return;
    const newGroups = session.groups.map((g, gi) => {
      if (gi !== groupIdx) return g;
      return {
        ...g,
        members: g.members.map((m, mi) =>
          mi === memberIdx ? { ...m, checked: !m.checked } : m
        ),
      };
    });
    await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
  };

  const handleDragStart = (e, gIdx, mIdx) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ gIdx, mIdx }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetGIdx, targetMIdx = null) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    // We wrapped in try/catch to gracefully handle non-json drag drops
    try {
      const { gIdx: sourceGIdx, mIdx: sourceMIdx } = JSON.parse(data);

      if (!session) return;
      const newGroups = JSON.parse(JSON.stringify(session.groups));

      if (sourceGIdx === targetGIdx && targetMIdx !== null) {
        if (sourceMIdx === targetMIdx) return;
        const [moved] = newGroups[sourceGIdx].members.splice(sourceMIdx, 1);
        newGroups[sourceGIdx].members.splice(targetMIdx, 0, moved);
        await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
        return;
      }

      const [movedMem] = newGroups[sourceGIdx].members.splice(sourceMIdx, 1);
      if (targetMIdx !== null) {
        newGroups[targetGIdx].members.splice(targetMIdx, 0, movedMem);
      } else {
        newGroups[targetGIdx].members.push(movedMem);
      }
      await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
    } catch (err) {
      console.log('Drop data format ignored');
    }
  };

  const handleAddPerson = async (gIdx) => {
    const name = prompt('Enter new member name:');
    if (!name || name.trim() === '') return;

    const newGroups = JSON.parse(JSON.stringify(session.groups));
    newGroups[gIdx].members.push({ name: name.trim(), checked: false });
    await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 font-sans">
      Loading...
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center text-red-500 font-sans p-8">
      <p className="text-xl font-bold mb-2">Firestore Read Error</p>
      <p className="text-sm text-slate-500 mb-4">{error}</p>
      <p className="text-sm text-slate-400">Please check your Firestore rules setup.</p>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-400 font-sans">
      Record not found
    </div>
  );

  const totalChecked = session.groups.reduce((acc, g) => acc + g.members.filter(m => m.checked).length, 0);
  const totalMembers = session.groups.reduce((acc, g) => acc + g.members.length, 0);

  const mainGroups = session.groups.slice(0, 3);
  const benchGroup = session.groups[3];

  const renderGroupCard = (group, groupIdx, isShort = false) => {
    const theme = THEMES[groupIdx] || THEMES[3];
    const checkedCount = group.members.filter(m => m.checked).length;

    return (
      <div
        key={groupIdx}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, groupIdx)}
        className={`bg-white rounded-3xl shadow-lg border-2 ${isShort ? 'border-dashed border-slate-300 bg-slate-50/50' : 'border-transparent'} overflow-hidden flex flex-col min-h-[150px]`}
      >
        <div className={`${theme.bg} py-4 px-4 text-center ${isShort ? 'py-3 bg-opacity-80' : ''}`}>
          <h2 className={`font-extrabold text-white tracking-wider ${isShort ? 'text-xl' : 'text-2xl lg:text-3xl'}`}>
            {group.name}
          </h2>
          {!isShort && (
            <>
              <div className="flex justify-between items-center text-white/80 font-medium mt-1 text-sm mx-2">
                <span>{checkedCount} / {group.members.length} Confirmed</span>
                <button
                  onClick={() => handleAddPerson(groupIdx)}
                  className="hover:text-white flex items-center gap-1 bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-all active:scale-95"
                >
                  <UserPlus size={14} /> Add
                </button>
              </div>
              <div className="mt-3 bg-white/25 rounded-full h-1.5 mx-4">
                <div
                  className="bg-white rounded-full h-1.5 transition-all duration-300"
                  style={{ width: group.members.length ? `${checkedCount / group.members.length * 100}%` : '0%' }}
                />
              </div>
            </>
          )}
          {isShort && (
            <div className="text-white/80 font-medium mt-1 text-sm">
              <span>{group.members.length} pax</span>
            </div>
          )}
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          <ul className={`space-y-2.5 ${isShort ? 'grid grid-cols-2 sm:grid-cols-4 gap-3 space-y-0' : ''}`}>
            {group.members.length > 0 ? (
              group.members.map((member, memberIdx) => (
                <li
                  key={memberIdx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, groupIdx, memberIdx)}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => { e.stopPropagation(); handleDrop(e, groupIdx, memberIdx); }}
                  className="cursor-move"
                >
                  <button
                    onClick={() => toggleCheck(groupIdx, memberIdx)}
                    className={`
                      w-full text-left py-3 px-4 rounded-2xl border transition-all duration-150 active:scale-98
                      flex items-center gap-3 shadow-sm
                      ${member.checked
                        ? `${theme.bgLight} ${theme.border} ring-1 ${theme.ring}`
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }
                    `}
                  >
                    {!isShort && (
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                        ${member.checked ? `${theme.bg} border-transparent` : 'border-slate-300'}
                      `}>
                        {member.checked && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    )}
                    <span className={`
                      text-lg font-bold flex-grow text-slate-700
                      ${member.checked ? `${theme.text}` : ''}
                      ${isShort ? 'text-center truncate' : ''}
                    `}>
                      {member.name}
                    </span>
                    {(!isShort && member.checked) && (
                      <CheckCircle2 size={18} className={`flex-shrink-0 ${theme.text} opacity-70`} />
                    )}
                  </button>
                </li>
              ))
            ) : (
              <li className={`text-slate-300 font-medium text-center italic ${isShort ? 'col-span-full py-2' : 'mt-10'}`}>
                Drop members here
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium text-lg bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex flex-col items-end gap-0.5">
          <div className="text-slate-500 text-sm">{formatDate(session.createdAt)}</div>
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
            <CheckCircle2 size={15} />
            {totalChecked} / {totalMembers} Confirmed
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col gap-5 md:gap-7">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7 items-start">
          {mainGroups.map((g, i) => renderGroupCard(g, i, false))}
        </div>

        {benchGroup && (
          <div className="w-full mt-4">
            {renderGroupCard(benchGroup, 3, true)}
          </div>
        )}
      </div>
    </div>
  );
}
