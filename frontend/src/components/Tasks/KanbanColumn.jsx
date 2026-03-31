import { Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';

const COLUMN_LABELS = {
  todo: 'De făcut',
  inprogress: 'În lucru',
  done: 'Finalizat',
};

const COLUMN_COLORS = {
  todo: '#6366f1',
  inprogress: '#f59e0b',
  done: '#10b981',
};

export function KanbanColumn({ status, tasks, onEdit, onDelete }) {
  return (
    <div className="kanban-column">
      <div className="kanban-column-header" style={{ borderColor: COLUMN_COLORS[status] }}>
        <span style={{ color: COLUMN_COLORS[status] }}>{COLUMN_LABELS[status]}</span>
        <span className="kanban-count">{tasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            className={`kanban-cards ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="kanban-empty">Niciun task</div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
