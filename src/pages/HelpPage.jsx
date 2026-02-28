import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Users,
  Dices,
  MousePointer2,
  CheckCircle2,
  ClipboardList,
  PlusCircle,
  Move
} from 'lucide-react';

export default function HelpPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <PlusCircle className="text-indigo-500" size={24} />,
      title: 'Quick Setup',
      description: 'Create new teams instantly by pasting names. The app automatically balances group sizes.'
    },
    {
      icon: <Move className="text-blue-500" size={24} />,
      title: 'Drag & Drop',
      description: 'Easily reassign members by dragging them between groups. Works seamlessly on both desktop and touch devices.'
    },
    {
      icon: <CheckCircle2 className="text-emerald-500" size={24} />,
      title: 'Live Tracking',
      description: 'Mark members as "present" or "confirmed" with a single tap. Progress is synced in real-time.'
    },
    {
      icon: <Dices className="text-rose-500" size={24} />,
      title: 'Fair Play Dice',
      description: 'Use the built-in dice to randomly pick team numbers (1-3) for turns or challenges, ensuring no repeats.'
    },
    {
      icon: <Users className="text-slate-500" size={24} />,
      title: 'Temp/Bench Area',
      description: 'A special fourth group for latecomers or reserves, keeping your main teams clean.'
    },
    {
      icon: <ClipboardList className="text-indigo-500" size={24} />,
      title: 'Session History',
      description: 'Access previous groupings anytime. Perfect for multi-stage events or looking back at past teams.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-medium mb-8 bg-white px-4 py-2 rounded-xl shadow-sm transition-all"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <div className="flex items-center gap-4 mb-10">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
            <HelpCircle size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">How to use Group List</h1>
            <p className="text-slate-500">Master the features of your team management tool</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all group">
              <div className="mb-4 bg-slate-50 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
          <h2 className="text-2xl font-bold mb-4">Pro Tips</h2>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                <MousePointer2 size={16} />
              </div>
              <p className="text-indigo-50/90 text-sm">
                On iPad/Tablet, long-press a name for a split second to start dragging.
              </p>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-white/20 p-1.5 rounded-lg shrink-0">
                <PlusCircle size={16} />
              </div>
              <p className="text-indigo-50/90 text-sm">
                Mistakenly left someone out? Use the "Add" button inside any group to join them in.
              </p>
            </li>
          </ul>
        </div>

        <footer className="mt-12 text-center text-slate-400 text-xs">
          © Choco Li 2026 • v1.2.0
        </footer>
      </div>
    </div>
  );
}
