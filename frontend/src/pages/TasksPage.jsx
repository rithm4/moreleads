import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { CheckSquare, Plus, ChevronRight } from 'lucide-react';
import { KanbanColumn } from '../components/Tasks/KanbanColumn';
import { TaskModal } from '../components/Tasks/TaskModal';
import { Spinner } from '../components/UI/Spinner';
import api from '../api/axios';
import { useBadges } from '../context/BadgeContext';

const STATUSES = ['todo', 'inprogress', 'done'];
const STATUS_META = {
  todo:       { label: 'De făcut',  color: '#6366f1', bg: '#6366f11a' },
  inprogress: { label: 'În lucru',  color: '#f59e0b', bg: '#f59e0b1a' },
  done:       { label: 'Finalizat', color: '#10b981', bg: '#10b9811a' },
};

function groupByStatus(tasks) {
  return STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).sort((a, b) => a.position - b.position);
    return acc;
  }, {});
}

// Mobile task row
function MobileTaskRow({ task, onEdit, onDelete }) {
  const meta = STATUS_META[task.status];
  return (
    <div className="mobile-task-row" onClick={() => onEdit(task)}>
      <div className="mobile-task-dot" style={{ background: meta.color }} />
      <div className="mobile-task-body">
        <div className="mobile-task-title">{task.title}</div>
        {task.description && <div className="mobile-task-desc">{task.description}</div>}
        {task.assigned_name && <div className="mobile-task-assign">{task.assigned_name}</div>}
      </div>
      <div className="mobile-task-actions">
        <ChevronRight size={16} style={{ color: '#94a3b8' }} />
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [activeTab, setActiveTab] = useState('todo');
  const { markSeen } = useBadges();

  useEffect(() => { markSeen('tasks'); }, [markSeen]);

  const fetchTasks = useCallback(async () => {
    const { data } = await api.get('/tasks');
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const onDragEnd = async ({ destination, source, draggableId }) => {
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    const newPosition = destination.index;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t));
    try { await api.patch(`/tasks/${taskId}/move`, { status: newStatus, position: newPosition }); }
    catch { fetchTasks(); }
  };

  const handleSaved = (task, action) => {
    setTasks(prev => action === 'create' ? [...prev, task] : prev.map(t => t.id === task.id ? task : t));
  };

  const handleDelete = async id => {
    if (!confirm('Ștergi acest task?')) return;
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const columns = groupByStatus(tasks);
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="page page-wide">
      <div className="page-header">
        <div>
          <h1 className="page-title"><CheckSquare size={22} /> Taskuri</h1>
          {total > 0 && <p className="page-subtitle">{done} din {total} finalizate</p>}
        </div>
        <button className="btn-primary" onClick={() => setModal({ defaultStatus: activeTab })}>
          <Plus size={16} /> Task nou
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><Spinner /></div>
      ) : (
        <>
          {/* DESKTOP: Kanban board */}
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban-board tasks-kanban-desktop">
              {STATUSES.map(status => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={columns[status]}
                  onEdit={task => setModal({ task })}
                  onDelete={handleDelete}
                  onAdd={s => setModal({ defaultStatus: s })}
                />
              ))}
            </div>
          </DragDropContext>

          {/* MOBILE: Tab list view */}
          <div className="tasks-mobile">
            <div className="tasks-tabs">
              {STATUSES.map(s => (
                <button
                  key={s}
                  className={`tasks-tab ${activeTab === s ? 'active' : ''}`}
                  style={activeTab === s ? { borderBottomColor: STATUS_META[s].color, color: STATUS_META[s].color } : {}}
                  onClick={() => setActiveTab(s)}
                >
                  {STATUS_META[s].label}
                  <span className="tasks-tab-count" style={activeTab === s ? { background: STATUS_META[s].bg, color: STATUS_META[s].color } : {}}>
                    {columns[s].length}
                  </span>
                </button>
              ))}
            </div>

            <div className="tasks-tab-content">
              {columns[activeTab].length === 0 ? (
                <div className="mobile-tasks-empty">
                  <p>Niciun task în această coloană</p>
                  <button className="btn-primary" onClick={() => setModal({ defaultStatus: activeTab })}>
                    <Plus size={16} /> Adaugă task
                  </button>
                </div>
              ) : (
                <div className="mobile-task-list">
                  {columns[activeTab].map(task => (
                    <MobileTaskRow
                      key={task.id}
                      task={task}
                      onEdit={t => setModal({ task: t, viewOnly: true })}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modal !== null && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.defaultStatus}
          viewOnly={modal.viewOnly}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
