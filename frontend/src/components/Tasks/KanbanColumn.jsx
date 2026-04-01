import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';

const COLUMNS = {
  todo:       { label: 'De făcut',  color: '#6366f1' },
  inprogress: { label: 'În lucru',  color: '#f59e0b' },
  done:       { label: 'Finalizat', color: '#10b981' },
};

export function KanbanColumn({ status, tasks, onEdit, onDelete, onAdd }) {
  const col = COLUMNS[status];
  return (
    <div className="kanban-column">
      <div className="kanban-col-header" style={{ borderTopColor: col.color }}>
        <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`kanban-col-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onEdit={onEdit} onDelete={onDelete} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="kanban-empty">Trage un task sau adaugă unul</div>
            )}
          </div>
        )}
      </Droppable>
      <button className="kanban-add-btn" onClick={() => onAdd(status)}>
        <Plus size={13} /> Adaugă task
      </button>
    </div>
  );
}
