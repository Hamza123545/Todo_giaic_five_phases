import { Task, TaskPriority } from '@/types';
import { GlassCard } from '@/components/atoms/GlassCard';
import { cn, formatDate } from '@/lib/utils';
import { getTaskColumn } from '@/lib/task-status';
import { Calendar, Tag, MoreVertical, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface TaskCardProps {
  task: Task;
  onUpdate?: (taskId: number, updates: Partial<Task>) => void;
  onDelete?: (taskId: number) => void;
  onClick?: (taskId: number) => void;
  draggable?: boolean;
}

const priorityColors: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

const priorityLabels: Record<'low' | 'medium' | 'high', string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onClick,
  draggable = false,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityMenuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [priorityMenuPosition, setPriorityMenuPosition] = useState({ top: 0, left: 0 });
  const status = getTaskColumn(task);
  const priorityColor = priorityColors[task.priority] || priorityColors.medium;

  // Phase V: Check if task is overdue
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date) < new Date();

  // Calculate menu position when it opens
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          setMenuPosition({
            top: rect.bottom + 4,
            left: rect.right - 160, // Align to right edge
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showMenu]);

  // Calculate priority menu position when it opens
  useEffect(() => {
    if (showPriorityMenu && menuRef.current) {
      const updatePosition = () => {
        if (menuRef.current) {
          const rect = menuRef.current.getBoundingClientRect();
          setPriorityMenuPosition({
            top: rect.top,
            left: rect.left - 130, // Position to the left
          });
        }
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showPriorityMenu]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(event.target as Node)) {
        setShowPriorityMenu(false);
      }
    };

    if (showMenu || showPriorityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu, showPriorityMenu]);

  const handlePriorityChange = (priority: TaskPriority) => {
    onUpdate?.(task.id, { priority });
    setShowPriorityMenu(false);
    setShowMenu(false);
  };

  return (
    <GlassCard
      variant="default"
      hover
      onClick={() => onClick?.(task.id)}
      className={cn(
        'p-4 cursor-pointer',
        task.completed && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-start gap-2 mb-2">
            <div className={cn('w-2 h-2 rounded-full mt-2 flex-shrink-0', priorityColor)} />
            <h3
              className={cn(
                'font-semibold text-gray-900 dark:text-gray-100 line-clamp-2',
                task.completed && 'line-through'
              )}
            >
              {task.title}
            </h3>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
              {task.description}
            </p>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              {task.due_date && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    isOverdue && 'text-red-600 dark:text-red-400 font-semibold'
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(task.due_date)}</span>
                  {isOverdue && <AlertTriangle className="w-3 h-3 ms-1" />}
                </div>
              )}
              <span className="px-2 py-0.5 rounded bg-gray-500/10 text-gray-600 dark:text-gray-400">
                {priorityLabels[task.priority]}
              </span>
            </div>
          </div>
        </div>

        {/* Menu Button */}
        {(onUpdate || onDelete) && (
          <div className="relative">
            <button
              ref={buttonRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                setShowPriorityMenu(false);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && typeof window !== 'undefined' && createPortal(
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowMenu(false)}
                />
                <div 
                  ref={menuRef}
                  className="fixed z-[10000] glass-card-elevated p-2 min-w-[160px] shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
                  style={{ 
                    top: `${menuPosition.top}px`, 
                    left: `${menuPosition.left}px`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {onUpdate && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdate(task.id, { completed: !task.completed });
                          setShowMenu(false);
                        }}
                        className="w-full text-start px-3 py-1.5 text-sm rounded hover:bg-white/10 transition-colors"
                      >
                        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </button>
                      {/* Priority Change */}
                      <div className="relative" ref={priorityMenuRef}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPriorityMenu(!showPriorityMenu);
                          }}
                          className="w-full text-start px-3 py-1.5 text-sm rounded hover:bg-white/10 transition-colors flex items-center justify-between"
                        >
                          <span>Priority</span>
                          <span className="text-xs opacity-70">{priorityLabels[task.priority]}</span>
                        </button>
                        {showPriorityMenu && (
                          <div 
                            className="fixed z-[10001] glass-card-elevated p-2 min-w-[120px] shadow-xl border border-gray-200 dark:border-gray-700 rounded-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl"
                            style={{ 
                              top: `${priorityMenuPosition.top}px`, 
                              left: `${priorityMenuPosition.left}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {(['low', 'medium', 'high'] as TaskPriority[]).map((priority) => (
                              <button
                                key={priority}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePriorityChange(priority);
                                }}
                                className={cn(
                                  'w-full text-start px-3 py-1.5 text-sm rounded hover:bg-white/10 transition-colors',
                                  task.priority === priority && 'bg-indigo-500/20 font-semibold'
                                )}
                              >
                                {priorityLabels[priority]}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this task?')) {
                          onDelete(task.id);
                        }
                        setShowMenu(false);
                      }}
                      className="w-full text-start px-3 py-1.5 text-sm rounded hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </>,
              document.body
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

