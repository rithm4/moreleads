import { Draggable } from '@hello-pangea/dnd';
import { Pencil, Trash2, Calendar } from 'lucide-react';

export function TaskCard({ task, index, onEdit, onDelete }) {
  const initials = task.assigned_name
    ? task.assigned_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : null;

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card ${snapshot.isDragging ? 'dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-card-title">{task.title}</div>
          {task.description && <div className="task-card-desc">{task.description}</div>}
          {task.due_date && (() => {
            const overdue = new Date(task.due_date) < new Date() && task.status !== 'done';
            return (
              <div className="task-card-due" style={{ color: overdue ? '#ef4444' : '#94a3b8' }}>
                <Calendar size={11} />{new Date(task.due_date).toLocaleDateString('ro-RO')}
                {overdue && ' ⚠️'}
              </div>
            );
          })()}
          <div className="task-card-footer">
            {initials ? (
              <div className="task-assignee">
                <span className="mini-avatar">{initials}</span>
                <span>{task.assigned_name}</span>
              </div>
            ) : <span />}
            <div className="task-card-actions">
              <button className="btn-icon" onClick={() => onEdit(task)} title="Editează"><Pencil size={12} /></button>
              <button className="btn-icon danger" onClick={() => onDelete(task.id)} title="Șterge"><Trash2 size={12} /></button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
