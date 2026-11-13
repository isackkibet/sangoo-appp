"use client";

import React, { useState, useEffect } from 'react';

import NewsHeader from '../../components/portal/NewsHeader';
import VerificationHUD from '../../components/portal/verify/VerificationHUD';
import TaskGallery from '../../components/portal/verify/TaskGallery';
import AnnotationTool from '../../components/portal/verify/AnnotationTool';
import { VerifyTask } from '../../constants/verifyData';
import { CheckCircle2, X, MousePointerClick, ScanSearch, Coins, Info } from 'lucide-react';

// Everyone starts at zero (it used to start at an invented 340 XP, level 3, 5-day streak).
// Progress is practice progress, kept on this device.
const INITIAL_STATE = {
  xp: 0,
  level: 1,
  streak: 0,
  combo: 1,
  creditsToday: 0,
  verifiedToday: 0,
};
const PROGRESS_KEY = 'sihu_verify_practice_v1';
type Progress = typeof INITIAL_STATE & { day: string; lastDay: string | null; completed: string[] };
const today = () => new Date().toISOString().slice(0, 10);

function loadProgress(): Progress {
  const fresh: Progress = { ...INITIAL_STATE, day: today(), lastDay: null, completed: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null') as Progress | null;
    if (!saved) return fresh;
    // A new day resets "today" counters; the streak continues only if yesterday had a check.
    if (saved.day !== today()) {
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
      return { ...saved, day: today(), creditsToday: 0, verifiedToday: 0, combo: 1, streak: saved.lastDay === yesterday ? saved.streak : 0 };
    }
    return saved;
  } catch { return fresh; }
}

const XP_LEVELS = [0, 100, 250, 500, 800, 1200, 1800, 2600, 3600, 5000];

export default function VerifyAndEarnPage() {
  const [gamState, setGamState] = useState(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [selectedTask, setSelectedTask] = useState<VerifyTask | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [lastVerifyTime, setLastVerifyTime] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Restore this device's practice progress, then keep it saved.
  // (Read after mount: localStorage does not exist while the page is rendered on the server.)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const p = loadProgress();
      setGamState({ xp: p.xp, level: p.level, streak: p.streak, combo: p.combo, creditsToday: p.creditsToday, verifiedToday: p.verifiedToday });
      setCompletedTaskIds(p.completed);
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const prev = loadProgress();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...gamState,
      day: today(),
      lastDay: gamState.verifiedToday > 0 ? today() : prev.lastDay,
      completed: completedTaskIds,
    }));
  }, [gamState, completedTaskIds, hydrated]);

  // Auto-hide toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleTaskComplete = (task: VerifyTask, aiScore: number) => {
    const multi = gamState.combo;
    const baseCredits = parseFloat(task.reward);
    const baseXp = task.xp || 50;
    
    let aiBonusXp = 0;
    if (aiScore >= 95) aiBonusXp = 25;
    else if (aiScore >= 85) aiBonusXp = 15;
    else if (aiScore >= 70) aiBonusXp = 5;

    const earnCredits = parseFloat((baseCredits * multi).toFixed(2));
    const earnXp = Math.round((baseXp + aiBonusXp) * multi);

    setGamState(prev => {
      const newXp = prev.xp + earnXp;
      let newLevel = prev.level;
      
      const nextLevelXp = XP_LEVELS[newLevel] || XP_LEVELS[XP_LEVELS.length - 1];
      if (newXp >= nextLevelXp && newLevel < XP_LEVELS.length - 1) {
        newLevel++;
      }

      // Combo Logic
      const now = Date.now();
      let newCombo = prev.combo;
      if (lastVerifyTime > 0 && now - lastVerifyTime < 30000) { // 30s for demo
        newCombo = Math.min(newCombo + 1, 5);
      } else {
        newCombo = 1;
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        creditsToday: prev.creditsToday + earnCredits,
        verifiedToday: prev.verifiedToday + 1,
        // The first check of a day extends the streak.
        streak: prev.verifiedToday === 0 ? prev.streak + 1 : prev.streak,
        combo: newCombo
      };
    });

    setCompletedTaskIds(prev => [...prev, task.id]);
    setLastVerifyTime(Date.now());
    setSelectedTask(null); // Reset selection
    
    setToastMessage(`Great work! You earned ${earnCredits} credits and ${earnXp} XP.`);
  };

  const currentLevelFloor = XP_LEVELS[gamState.level - 1] || 0;
  const nextLevelCeil = XP_LEVELS[gamState.level] || XP_LEVELS[XP_LEVELS.length - 1];

  return (
    <div className="min-h-screen bg-[#f6f8fb] flex flex-col">
      <NewsHeader />

      {/* Room for the fixed site header */}
      <main className="flex-1 container mx-auto px-4 lg:px-8 pt-[104px] pb-16 flex flex-col gap-6 max-w-7xl">

        {/* Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-sky-700">Impact network</p>
            <h1 className="font-heading text-[34px] md:text-[42px] font-bold text-slate-900 leading-tight mt-2">Verify and earn</h1>
            <p className="text-[16px] text-slate-600 mt-2 max-w-2xl leading-relaxed">
              Help SIHU keep environmental reporting true. Practise checking field photos and earn practice credits for each careful check.
            </p>
          </div>
          <ol className="grid grid-cols-3 gap-2 lg:w-[460px] shrink-0">
            {[
              { Icon: MousePointerClick, t: 'Choose a photo' },
              { Icon: ScanSearch, t: 'Check it' },
              { Icon: Coins, t: 'Earn credits' },
            ].map((x, i) => (
              <li key={x.t} className="bg-white rounded-2xl border border-slate-200/80 p-3 text-center">
                <span className="mx-auto w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center"><x.Icon size={18} /></span>
                <span className="block text-[12.5px] font-semibold text-slate-700 mt-2">{i + 1}. {x.t}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="flex items-start gap-2 text-[14px] text-sky-900 bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3">
          <Info size={17} className="shrink-0 mt-0.5 text-sky-700" />
          Practice round: these are sample photos, and your level, streak and credits are saved only on this device. Real community reports will appear here when verification opens.
        </p>

        {/* HUD */}
        <VerificationHUD 
          level={gamState.level}
          xp={gamState.xp}
          xpNeeded={nextLevelCeil}
          combo={gamState.combo}
          streak={gamState.streak}
          creditsToday={gamState.creditsToday}
          verifiedToday={gamState.verifiedToday}
        />

        {/* Main Content splits into Gallery (Left) and Tool (Right) */}
        <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="lg:w-7/12">
            <TaskGallery 
              onSelect={setSelectedTask} 
              selectedTaskId={selectedTask?.id}
              completedTaskIds={completedTaskIds}
            />
          </div>
          <div className="lg:w-5/12 lg:sticky lg:top-[96px]">
            <AnnotationTool 
              task={selectedTask}
              onComplete={handleTaskComplete}
            />
          </div>
        </div>

      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div role="status" className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-8 sm:bottom-8 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 z-50">
          <div className="flex items-center gap-2 font-semibold text-[15px]"><CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> {toastMessage}</div>
          <button onClick={() => setToastMessage(null)} aria-label="Close" className="text-slate-400 hover:text-white"><X size={18} /></button>
        </div>
      )}

    </div>
  );
}
