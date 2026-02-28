import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ArrowLeft, CheckCircle2, UserPlus, Dices } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const THEMES = [
  { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200', bgLight: 'bg-emerald-50', ring: 'ring-emerald-400' },
  { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bgLight: 'bg-blue-50', ring: 'ring-blue-400' },
  { bg: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-200', bgLight: 'bg-rose-50', ring: 'ring-rose-400' },
  { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-200', bgLight: 'bg-slate-50', ring: 'ring-slate-400' },
];

// Dice Face with Pips (Dots)
function DiceFace({ value, rolling, theme }) {
  const pips = {
    1: ['center'],
    2: ['top-right', 'bottom-left'],
    3: ['top-right', 'center', 'bottom-left'],
  };

  const getPipPos = (pos) => {
    switch (pos) {
      case 'center': return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      case 'top-right': return 'top-2 right-2';
      case 'bottom-left': return 'bottom-2 left-2';
      default: return '';
    }
  };

  return (
    <div
      className={`
        w-12 h-12 bg-white rounded-xl relative shadow-[0_4px_0_0_rgba(0,0,0,0.1)] border-2 border-slate-200
        transition-all duration-[50ms]
        ${rolling ? 'animate-bounce' : 'scale-110 border-indigo-500 shadow-[0_4px_0_0_rgba(79,70,229,0.3)]'}
      `}
      style={{
        transform: rolling ? `rotate(${Math.random() * 360}deg)` : 'none'
      }}
    >
      {pips[value]?.map((pos, i) => (
        <div
          key={i}
          className={`absolute w-2.5 h-2.5 rounded-full ${rolling ? 'bg-slate-300' : 'bg-indigo-600'} ${getPipPos(pos)}`}
        />
      ))}
    </div>
  );
}

// Encode a stable unique id for each member card
function makeId(gIdx, mIdx) {
  return `${gIdx}:${mIdx}`;
}
function parseId(id) {
  const [g, m] = id.split(':');
  return { gIdx: Number(g), mIdx: Number(m) };
}

// Droppable zone for an empty group (no sortable items)
function EmptyDropZone({ groupIdx }) {
  const { setNodeRef, isOver } = useDroppable({ id: `group-${groupIdx}` });
  return (
    <li
      ref={setNodeRef}
      className={`text-center italic py-6 rounded-2xl transition-colors ${isOver ? 'bg-slate-100 text-slate-400' : 'text-slate-300'
        } font-medium`}
    >
    </li>
  );
}

// Individual sortable member card
function SortableItem({ id, member, groupIdx, memberIdx, theme, isShort, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    touchAction: 'none',
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
      <button
        onClick={() => onToggle(groupIdx, memberIdx)}
        className={`
          w-full text-left py-3 px-4 rounded-2xl border transition-all duration-150 active:scale-98
          flex items-center gap-3 shadow-sm select-none
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
          ${isShort ? 'text-center break-words' : ''}
        `}>
          {member.name}
        </span>
      </button>
    </li>
  );
}

// Overlay card shown while dragging
function DragCard({ member, theme, isShort }) {
  return (
    <div className={`
      py-3 px-4 rounded-2xl border shadow-2xl ring-2
      flex items-center gap-3 bg-white ${theme.border} ${theme.ring}
      rotate-3 scale-105
    `}>
      <span className={`text-lg font-bold text-slate-700 ${isShort ? 'text-center break-words' : ''}`}>
        {member.name}
      </span>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [diceResults, setDiceResults] = useState(null);
  const [diceDisplayValues, setDiceDisplayValues] = useState([1, 2]);
  const [rolling, setRolling] = useState(false);
  const sessionRef = useRef(null);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'sessions', id),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.groups && data.groups.length === 3) {
            const newGroups = [...data.groups, { name: '', members: [] }];
            updateDoc(doc(db, 'sessions', snap.id), { groups: newGroups });
            return;
          }
          const s = { id: snap.id, ...data };
          setSession(s);
          sessionRef.current = s;
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    })
  );

  const toggleCheck = async (groupIdx, memberIdx) => {
    const cur = sessionRef.current;
    if (!cur) return;
    const newGroups = cur.groups.map((g, gi) => {
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

  const rollDice = () => {
    if (rolling) return;
    setRolling(true);

    // Rapidly change numbers for a realistic "rolling" look
    const interval = setInterval(() => {
      setDiceDisplayValues([
        Math.floor(Math.random() * 3) + 1,
        Math.floor(Math.random() * 3) + 1
      ]);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      const numbers = [1, 2, 3];
      const shuffled = [...numbers].sort(() => 0.5 - Math.random());
      const finalResult = shuffled.slice(0, 2);

      setDiceResults(finalResult);
      setDiceDisplayValues(finalResult);
      setRolling(false);
    }, 3000);
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const cur = sessionRef.current;
    if (!cur) return;

    const { gIdx: srcG, mIdx: srcM } = parseId(active.id);
    let newGroups;

    // Dropped onto a group zone (empty group)
    if (String(over.id).startsWith('group-')) {
      const tgtG = Number(over.id.replace('group-', ''));
      if (srcG === tgtG) return;
      newGroups = JSON.parse(JSON.stringify(cur.groups));
      const [moved] = newGroups[srcG].members.splice(srcM, 1);
      newGroups[tgtG].members.push(moved);
    } else {
      // Dropped onto another member card
      const { gIdx: tgtG, mIdx: tgtM } = parseId(over.id);
      newGroups = JSON.parse(JSON.stringify(cur.groups));

      if (srcG === tgtG) {
        newGroups[srcG].members = arrayMove(newGroups[srcG].members, srcM, tgtM);
      } else {
        const [moved] = newGroups[srcG].members.splice(srcM, 1);
        newGroups[tgtG].members.splice(tgtM, 0, moved);
      }
    }

    // Optimistic update — no bounce-back
    const optimistic = { ...cur, groups: newGroups };
    setSession(optimistic);
    sessionRef.current = optimistic;

    await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
  };

  const handleAddPerson = async (gIdx) => {
    const name = prompt('Enter new member name:');
    if (!name || name.trim() === '') return;
    const cur = sessionRef.current;
    if (!cur) return;
    const newGroups = JSON.parse(JSON.stringify(cur.groups));
    newGroups[gIdx].members.push({ name: name.trim(), checked: false });
    await updateDoc(doc(db, 'sessions', id), { groups: newGroups });
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
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

  // Find what's being dragged for overlay
  let activeMember = null;
  let activeTheme = THEMES[3];
  let activeIsShort = false;
  if (activeId) {
    const { gIdx, mIdx } = parseId(activeId);
    activeMember = session.groups[gIdx]?.members[mIdx];
    activeTheme = THEMES[gIdx] || THEMES[3];
    activeIsShort = gIdx === 3;
  }

  const renderGroupCard = (group, groupIdx, isShort = false) => {
    const theme = THEMES[groupIdx] || THEMES[3];
    const checkedCount = group.members.filter(m => m.checked).length;
    const itemIds = group.members.map((_, mIdx) => makeId(groupIdx, mIdx));

    return (
      <div
        key={groupIdx}
        className={`bg-white rounded-3xl shadow-lg border-2 overflow-hidden flex
          ${isShort
            ? 'border-dashed border-slate-300 bg-slate-50/50 flex-col md:flex-row'
            : 'border-transparent flex-col h-full'
          }`}
      >
        <div className={`${theme.bg} py-4 px-4 text-center flex flex-col justify-center ${isShort ? 'bg-opacity-80 md:w-56 shrink-0' : ''}`}>
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
        </div>

        <div className="flex-grow p-4 overflow-y-auto">
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <ul className={`space-y-2.5 ${isShort ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 space-y-0 w-full' : ''}`}>
              {group.members.length > 0 ? (
                group.members.map((member, memberIdx) => (
                  <SortableItem
                    key={makeId(groupIdx, memberIdx)}
                    id={makeId(groupIdx, memberIdx)}
                    member={member}
                    groupIdx={groupIdx}
                    memberIdx={memberIdx}
                    theme={theme}
                    isShort={isShort}
                    onToggle={toggleCheck}
                  />
                ))
              ) : (
                <EmptyDropZone groupIdx={groupIdx} />
              )}
            </ul>
          </SortableContext>
        </div>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium text-lg bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow transition-all"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {/* Dice Result Display */}
            {(diceResults || rolling) && (
              <div className="flex gap-4 items-center mr-2">
                {diceDisplayValues.map((num, i) => (
                  <DiceFace key={i} value={num} rolling={rolling} />
                ))}
              </div>
            )}

            <button
              onClick={rollDice}
              className={`p-2.5 rounded-full shadow-sm transition-all active:scale-90 ${rolling ? 'bg-slate-100 text-slate-300' : 'bg-white text-indigo-600 hover:shadow-md'}`}
              title="Roll 2 Dice (1-3, no repeat)"
            >
              <Dices size={24} className={rolling ? 'animate-spin' : ''} />
            </button>

            <div className="flex flex-col items-end gap-0.5 ml-2">
              <div className="text-slate-500 text-sm">{formatDate(session.createdAt)}</div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm bg-white px-3 py-1 rounded-full shadow-sm">
                <CheckCircle2 size={15} />
                {totalChecked} / {totalMembers} Confirmed
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex flex-col gap-5 md:gap-7">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7 items-stretch">
            {mainGroups.map((g, i) => renderGroupCard(g, i, false))}
          </div>

          {benchGroup && (
            <div className="w-full mt-4">
              {renderGroupCard(benchGroup, 3, true)}
            </div>
          )}
        </div>

        <div className="mt-8 mb-4 text-center">
          <p className="text-xs text-slate-400">© Choco Li 2026</p>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeMember ? (
          <DragCard member={activeMember} theme={activeTheme} isShort={activeIsShort} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
