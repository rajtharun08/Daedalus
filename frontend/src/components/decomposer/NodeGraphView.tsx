import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldAlert,
  Cpu,
  GitFork,
  ArrowRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Project, Task, Epic } from '../../types';

interface Props {
  project: Project;
  onSelectTask: (task: Task) => void;
  selectedTaskId?: string;
  onSplitTask?: (task: Task) => void;
}

export const NodeGraphView: React.FC<Props> = ({
  project,
  onSelectTask,
  selectedTaskId,
  onSplitTask,
}) => {
  const [highlightCriticalPath, setHighlightCriticalPath] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [zoom, setZoom] = useState(1.0);

  const handleZoomIn = () => setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);

  // Keyboard Escape listener to exit maximized full-screen focus
  useEffect(() => {
    if (!isMaximized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMaximized(false);
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMaximized]);

  // Lay out epics on the left/center, tasks branching out to the right
  const epics = project.epics || [];
  const svgWidth = 880;
  const svgHeight = Math.max(540, epics.length * 155);

  // Map task id to coordinates
  const taskCoordMap = new Map<string, { x: number; y: number }>();
  const epicNodes: { epic: Epic; x: number; y: number }[] = [];
  const taskNodes: { task: Task; x: number; y: number; epicId: string }[] = [];
  const epicToTaskEdges: { sourceX: number; sourceY: number; targetX: number; targetY: number; id: string }[] = [];

  epics.forEach((epic, epicIndex) => {
    const epicY = 85 + epicIndex * 140;
    const epicX = 130;
    epicNodes.push({ epic, x: epicX, y: epicY });

    const epicTasks = epic.tasks || [];
    epicTasks.forEach((task, taskIndex) => {
      const taskX = 420 + (taskIndex % 2) * 200;
      const taskY = epicY + (taskIndex - (epicTasks.length - 1) / 2) * 58;
      taskNodes.push({ task, x: taskX, y: taskY, epicId: epic.id });
      taskCoordMap.set(task.id, { x: taskX, y: taskY });

      epicToTaskEdges.push({
        sourceX: epicX + 75,
        sourceY: epicY,
        targetX: taskX - 85,
        targetY: taskY,
        id: `${epic.id}-${task.id}`,
      });
    });
  });

  // Build task-to-task dependency edges
  const taskDependencyEdges: {
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    id: string;
  }[] = [];

  (project.tasks || []).forEach((t) => {
    const targetCoord = taskCoordMap.get(t.id);
    if (!targetCoord) return;
    (t.depends_on || []).forEach((depId) => {
      const sourceCoord = taskCoordMap.get(depId);
      if (sourceCoord) {
        taskDependencyEdges.push({
          sourceX: sourceCoord.x + 85,
          sourceY: sourceCoord.y,
          targetX: targetCoord.x - 85,
          targetY: targetCoord.y,
          id: `dep-${depId}-${t.id}`,
        });
      }
    });
  });

  // Render SVG nodes and edges
  const renderSVGContent = () => (
    <svg
      width={svgWidth}
      height={svgHeight}
      className="mx-auto block select-none"
      style={{ minWidth: `${svgWidth}px` }}
    >
      <defs>
        {/* Arrow Marker for Topological Direction */}
        <marker
          id="depArrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
        </marker>
        <marker
          id="criticalArrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
        </marker>
      </defs>

      {/* Render Epic to Task Structural Edges */}
      {epicToTaskEdges.map((edge) => {
        const pathD = `M ${edge.sourceX} ${edge.sourceY} C ${(edge.sourceX + edge.targetX) / 2} ${edge.sourceY}, ${(edge.sourceX + edge.targetX) / 2} ${edge.targetY}, ${edge.targetX} ${edge.targetY}`;
        return (
          <g key={edge.id}>
            <path
              d={pathD}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeOpacity="0.25"
              strokeDasharray="3 3"
            />
          </g>
        );
      })}

      {/* Render Task-to-Task Real DAG Dependency Edges */}
      {taskDependencyEdges.map((edge) => {
        const pathD = `M ${edge.sourceX} ${edge.sourceY} C ${(edge.sourceX + edge.targetX) / 2} ${edge.sourceY}, ${(edge.sourceX + edge.targetX) / 2} ${edge.targetY}, ${edge.targetX} ${edge.targetY}`;
        return (
          <g key={edge.id}>
            <path
              d={pathD}
              fill="none"
              stroke={highlightCriticalPath ? '#f59e0b' : '#38bdf8'}
              strokeWidth={highlightCriticalPath ? '2' : '1.5'}
              strokeOpacity={highlightCriticalPath ? '0.9' : '0.6'}
              markerEnd={highlightCriticalPath ? 'url(#criticalArrow)' : 'url(#depArrow)'}
            />
          </g>
        );
      })}

      {/* Render Epic Hub Nodes */}
      {epicNodes.map(({ epic, x, y }) => (
        <g key={epic.id} className="cursor-default">
          <rect
            x={x - 65}
            y={y - 28}
            width="130"
            height="56"
            rx="12"
            fill="#131825"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth="1.5"
          />
          <text
            x={x}
            y={y - 6}
            textAnchor="middle"
            fill="#818cf8"
            fontSize="10"
            fontWeight="bold"
            fontFamily="JetBrains Mono, monospace"
          >
            EPIC {epic.order_index}
          </text>
          <text
            x={x}
            y={y + 12}
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize="10"
            fontWeight="600"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {epic.title.length > 15 ? epic.title.slice(0, 14) + '..' : epic.title}
          </text>
        </g>
      ))}

      {/* Render Task Nodes */}
      {taskNodes.map(({ task, x, y }) => {
        const isSelected = selectedTaskId === task.id;
        return (
          <g
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="cursor-pointer group"
          >
            {/* Background Box */}
            <rect
              x={x - 85}
              y={y - 20}
              width="170"
              height="40"
              rx="10"
              fill={isSelected ? '#172033' : '#0c101a'}
              stroke={
                isSelected
                  ? '#ffffff'
                  : highlightCriticalPath
                  ? 'rgba(245, 158, 11, 0.5)'
                  : 'rgba(255, 255, 255, 0.12)'
              }
              strokeWidth={isSelected ? '1.5' : '1'}
              className="transition-all duration-200"
            />

            {/* Status Dot */}
            <circle
              cx={x - 70}
              cy={y}
              r="4"
              fill={
                task.status === 'COMPLETED'
                  ? '#34d399'
                  : task.status === 'IN_PROGRESS'
                  ? '#38bdf8'
                  : task.status === 'BLOCKED'
                  ? '#f87171'
                  : '#94a3b8'
              }
            />

            {/* Task Code */}
            <text
              x={x - 58}
              y={y - 3}
              fill={isSelected ? '#ffffff' : '#e2e8f0'}
              fontSize="11"
              fontWeight="bold"
              fontFamily="JetBrains Mono, monospace"
            >
              {task.task_code}
            </text>

            {/* Task Title Truncated */}
            <text
              x={x - 58}
              y={y + 10}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              {task.title.length > 18 ? task.title.slice(0, 16) + '..' : task.title}
            </text>

            {/* Split Quick Action Trigger on Node */}
            {onSplitTask && (
              <g
                onClick={(e) => {
                  e.stopPropagation();
                  onSplitTask(task);
                }}
                className="hover:opacity-80 transition-opacity"
              >
                <rect
                  x={x + 55}
                  y={y - 12}
                  width="22"
                  height="24"
                  rx="6"
                  fill="#1e293b"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="0.8"
                />
                <text
                  x={x + 66}
                  y={y + 4}
                  textAnchor="middle"
                  fill="#38bdf8"
                  fontSize="11"
                  fontWeight="bold"
                >
                  ⑂
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );

  return (
    <div className="relative w-full rounded-2xl glass-panel p-4 overflow-hidden border border-white/10 bg-zinc-950/60">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-zinc-300 uppercase">
            Topological Task Graph (DAG)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-zinc-400">
          {/* Critical Path Toggle */}
          <button
            type="button"
            onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
              highlightCriticalPath
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border-white/5'
            }`}
          >
            {highlightCriticalPath ? 'Critical Path: Active' : 'Highlight Critical Path'}
          </button>

          {/* Maximize Button */}
          <button
            type="button"
            onClick={() => {
              setZoom(1.0);
              setIsMaximized(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border border-white/10 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white cursor-pointer shadow-sm"
            title="Maximize Task Graph (Full-Screen Focus Mode)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Maximize</span>
          </button>

          {/* Status Legends */}
          <span className="hidden sm:flex items-center gap-1.5 ml-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Done
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> In Progress
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Blocked
          </span>
        </div>
      </div>

      {/* SVG Standard Viewport */}
      <div className="w-full overflow-x-auto overflow-y-auto max-h-[550px] relative bg-zinc-950/80 rounded-xl border border-white/5 p-4">
        {renderSVGContent()}
      </div>

      <div className="mt-2.5 flex items-center justify-between px-2 text-[11px] text-zinc-500 font-mono">
        <span>Click any node to view task details or split into subtasks.</span>
        <span className="hidden sm:inline">Topological Dependency Ordering</span>
      </div>

      {/* Full-Screen Maximized Portal */}
      {isMaximized &&
        createPortal(
          <div className="fixed inset-0 z-[80] bg-zinc-950/98 backdrop-blur-2xl p-4 sm:p-6 flex flex-col animate-fadeIn select-none">
            {/* Maximized Top Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
              {/* Left: Project and DAG Badges */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold font-sans text-white">
                      {project.title || 'Topological Task Graph'}
                    </h2>
                    {project.domain && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                        {project.domain.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-zinc-400">
                      Full-Screen DAG Focus Mode
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Interactive Controls & Zoom */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Critical Path Toggle */}
                <button
                  type="button"
                  onClick={() => setHighlightCriticalPath(!highlightCriticalPath)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all border cursor-pointer flex items-center gap-2 ${
                    highlightCriticalPath
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-sm'
                      : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      highlightCriticalPath ? 'bg-amber-400 animate-pulse' : 'bg-zinc-500'
                    }`}
                  />
                  <span>{highlightCriticalPath ? 'Critical Path Active' : 'Highlight Critical Path'}</span>
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center rounded-xl bg-zinc-900 border border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                    title="Zoom Out (-)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono font-semibold text-zinc-300 min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                    title="Zoom In (+)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors border-l border-white/5 ml-0.5"
                    title="Reset Zoom to 100%"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Legend Indicators */}
                <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs font-mono text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Done
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" /> In Progress
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Blocked
                  </span>
                </div>
              </div>

              {/* Right: Exit Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsMaximized(false)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/15 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs cursor-pointer transition-all shadow-sm"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="w-4 h-4 text-cyan-400" />
                <span>Exit Fullscreen</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-zinc-400 font-sans">Esc</kbd>
              </button>
            </div>

            {/* Maximized Interactive SVG Viewport */}
            <div className="flex-1 w-full overflow-auto relative my-4 rounded-2xl border border-white/10 bg-zinc-950/80 p-8 flex items-center justify-center">
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.12s ease-out',
                }}
                className="min-w-fit min-h-fit"
              >
                {renderSVGContent()}
              </div>
            </div>

            {/* Maximized Bottom Footer */}
            <div className="flex flex-wrap items-center justify-between px-2 pt-2 border-t border-white/10 text-xs font-mono text-zinc-400 shrink-0">
              <div className="flex items-center gap-2">
                <span>Select any node to view task details.</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500">
                <span>
                  Press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/10 text-[10px] text-zinc-300">
                    Esc
                  </kbd>{' '}
                  to exit full-screen
                </span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
