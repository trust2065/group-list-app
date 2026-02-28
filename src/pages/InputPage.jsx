import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { ClipboardList, LayoutDashboard, ArrowLeft, HelpCircle } from 'lucide-react';

const DEFAULT_INPUTS = [
  `Ann L (Host)
Lin Wei-chen
Roy Liao
Hank
Mike Tsai`,
  `Raphael Lee
JP Albeza
Roy Yu
Ben
Diego A yepes
Jonelle Fidelino`,
  `Bassam Nassim
Violet Nwe
Nonanon
Nu Pissanu Chokchai
Zzy CP`,
];

export default function InputPage() {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (index, value) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const parseGroup = (text) =>
    text.split(/[\n\t,]+/)
      .map(n => n.trim())
      .filter(n => n !== '');

  const countLines = (text) =>
    text.split('\n').filter(n => n.trim()).length;

  const handleGenerate = async () => {
    const parsedGroups = inputs.map(parseGroup);
    if (parsedGroups.every(g => g.length === 0)) {
      setErrorMsg('Please paste a list in at least one group!');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const groups = parsedGroups.map((members, i) => ({
        name: `Team ${i + 1}`,
        members: members.map(name => ({ name, checked: false })),
      }));

      groups.push({
        name: 'Temp Area',
        members: []
      });

      const docRef = await addDoc(collection(db, 'sessions'), {
        createdAt: serverTimestamp(),
        groups,
      });

      navigate(`/session/${docRef.id}`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save, please check Firebase config.');
      setSaving(false);
    }
  };

  const groupColors = ['bg-emerald-500', 'bg-blue-500', 'bg-rose-500'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
          >
            <ArrowLeft size={18} />
            History
          </button>
          <div className="flex items-center gap-2 text-indigo-600">
            <ClipboardList size={28} />
            <h1 className="text-2xl font-bold text-slate-800">New Team List</h1>
          </div>
          <button
            onClick={() => navigate('/help')}
            className="p-2.5 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-xl border border-slate-200 transition-all shadow-sm"
            title="How to use"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Textareas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`py-3 px-4 text-center font-bold text-white ${groupColors[i]}`}>
                Team {i + 1}
              </div>
              <textarea
                className="w-full h-72 p-4 text-base focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 resize-none"
                placeholder={`Paste Team ${i + 1} list here...`}
                value={inputs[i]}
                onChange={e => handleInputChange(i, e.target.value)}
              />
              <div className="bg-slate-50 px-4 py-2 text-xs text-slate-400 text-right">
                {countLines(inputs[i])} players
              </div>
            </div>
          ))}
        </div>

        {errorMsg && (
          <p className="text-red-500 text-center mb-6 font-medium">{errorMsg}</p>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={saving}
            className="w-full md:w-96 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xl font-bold py-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
          >
            <LayoutDashboard size={28} className="mr-3" />
            {saving ? 'Saving...' : 'Generate & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
