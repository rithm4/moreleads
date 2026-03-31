import { Draggable } from '@hello-pangea/dnd';
import { Pencil, Trash2 } from 'lucide-react';

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
          <p className="task-title">{task.title}</p>
          {task.description && <p className="task-desc">{task.description}</p>}
          <div className="task-footer">
            {initials ? (
              <span className="task-avatar" title={task.assigned_name}>{initials}</span>
            ) : (
              <span />
            )}
            <div className="task-actions">
              <button onClick={() => onEdit(task)} title="Editează"><Pencil size={13} /></button>
              <button onClick={() => onDelete(task.id)} title="Șterge"><Trash2 size={13} /></button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
