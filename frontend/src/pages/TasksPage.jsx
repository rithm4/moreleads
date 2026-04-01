import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { CheckSquare, Plus } from 'lucide-react';
import { KanbanColumn } from '../components/Tasks/KanbanColumn';
import { TaskModal } from '../components/Tasks/TaskModal';
import { Spinner } from '../components/UI/Spinner';
import api from '../api/axios';

const STATUSES = ['todo', 'inprogress', 'done'];

function groupByStatus(tasks) {
  return STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).sort((a, b) => a.position - b.position);
    return acc;
  }, {});
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

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
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Task nou
        </button>
      </div>

      {loading ? (
        <div className="page-loading"><Spinner /></div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={columns[status]}
                onEdit={task => setModal({ task })}
                onDelete={handleDelete}
                onAdd={status => setModal({ defaultStatus: status })}
              />
            ))}
          </div>
        </DragDropContext>
      )}

      {modal !== null && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.defaultStatus}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
