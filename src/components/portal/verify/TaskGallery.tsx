"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Trees, Droplets, Fish, HeartPulse, MapPin, CheckCircle2, CalendarDays } from 'lucide-react';
import type { LucideIcon } from '@/types/icon';
import { TASK_LIST, VERIFY_GROUPS, VerifyTask } from '../../../constants/verifyData';

interface TaskGalleryProps {
  onSelect: (task: VerifyTask) => void;
  selectedTaskId?: string;
  completedTaskIds: string[];
}

const GROUP_ICON: Record<string, LucideIcon> = { forestry: Trees, water: Droplets, fishing: Fish, health: HeartPulse };

/** Field photos waiting for a check, grouped by topic. */
export default function TaskGallery({ onSelect, selectedTaskId, completedTaskIds }: TaskGalleryProps) {
  const [activeGroup, setActiveGroup] = useState<string>('forestry');

  const filteredTasks = TASK_LIST.filter((t) => t.group === activeGroup);
  const groups = Object.values(VERIFY_GROUPS);

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 overflow-hidden">
      <div className="px-5 pt-5">
        <h2 className="font-heading text-[20px] font-bold text-slate-900">1. Choose a task</h2>
        <p className="text-[14px] text-slate-500 mt-0.5">Field photos sent by community members, waiting for a check.</p>
      </div>

      <div className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-5 py-4 gap-2" role="tablist" aria-label="Topics">
        {groups.map((g) => {
          const Icon = GROUP_ICON[g.id];
          const on = activeGroup === g.id;
          const count = TASK_LIST.filter((t) => t.group === g.id && !completedTaskIds.includes(t.id)).length;
          return (
            <button key={g.id} role="tab" aria-selected={on} onClick={() => setActiveGroup(g.id)}
              className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold border transition-colors ${
                on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
              }`}>
              {Icon && <Icon size={16} />} {g.label}
              <span className={`text-[12px] font-medium ${on ? 'text-slate-300' : 'text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            const isCompleted = completedTaskIds.includes(task.id);
            const isSelected = selectedTaskId === task.id;
            return (
              <button
                key={task.id}
                onClick={() => !isCompleted && onSelect(task)}
                disabled={isCompleted}
                aria-pressed={isSelected}
                className={`group relative flex flex-col text-left rounded-2xl overflow-hidden border bg-white transition-all ${
                  isCompleted ? 'opacity-60 cursor-default border-slate-200'
                    : isSelected ? 'border-sky-500 ring-4 ring-sky-500/15'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-[0_14px_30px_-16px_rgba(15,23,42,0.3)]'
                }`}
              >
                <div className="relative h-36 w-full bg-slate-100 shrink-0">
                  <Image src={task.img} alt={task.label} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute top-2.5 right-2.5 bg-white/95 text-slate-900 text-[12px] font-semibold px-2.5 py-1 rounded-full">+{task.xp} XP</span>
                  {isCompleted && (
                    <span className="absolute inset-0 bg-slate-900/45 flex items-center justify-center">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[13px] font-semibold px-3 py-1.5 rounded-full"><CheckCircle2 size={15} /> Done</span>
                    </span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <span className="text-[12px] font-semibold text-sky-700">{task.categoryName}</span>
                  <h3 className="font-heading font-bold text-slate-900 text-[16px] leading-snug mt-0.5">{task.label}</h3>
                  <p className="text-[12.5px] text-slate-500 mt-1">by {task.contributor}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-[12.5px]">
                    <span className="flex items-center gap-3 text-slate-500">
                      <span className="flex items-center gap-1"><MapPin size={13} /> {task.dist} km</span>
                      <span className="flex items-center gap-1"><CalendarDays size={13} /> {task.days === 0 ? 'today' : `${task.days} d ago`}</span>
                    </span>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">+{task.reward} credits</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {filteredTasks.length === 0 && <p className="text-center py-12 text-slate-500">No tasks in this topic right now.</p>}
      </div>
    </div>
  );
}
