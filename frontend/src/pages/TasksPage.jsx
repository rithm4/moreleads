import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
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
  const [modal, setModal] = useState(null); // null | { task? }
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch {
      setError('Nu s-au putut încărca taskurile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const onDragEnd = async result => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId);
    const newStatus = destination.droppableId;
    const newPosition = destination.index;

    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
      );
      return updated;
    });

    try {
      await api.patch(`/tasks/${taskId}/move`, { status: newStatus, position: newPosition });
    } catch {
      fetchTasks();
    }
  };

  const handleSaved = (task, action) => {
    if (action === 'create') {
      setTasks(prev => [...prev, task]);
    } else {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Ștergi acest task?')) return;
    await api.delete(`/tasks/${id}`);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const columns = groupByStatus(tasks);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Taskuri</h1>
        <button className="btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Task nou
        </button>
      </div>
      {error && <div className="page-error">{error}</div>}
      {loading ? (
        <div className="loading-center"><Spinner /></div>
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
              />
            ))}
          </div>
        </DragDropContext>
      )}
      {modal !== null && (
        <TaskModal
          task={modal.task}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
