import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, CheckSquare, FolderKanban, ArrowRight, Circle } from 'lucide-react';
import api from '../api/axios';

const STAGE_LABELS = { lead: 'Lead', contacted: 'Contactat', proposal: 'Propunere', negotiation: 'Negociere', won: 'Câștigat', lost: 'Pierdut' };
const STAGE_COLORS = { lead: '#94a3b8', contacted: '#3b82f6', proposal: '#f59e0b', negotiation: '#8b5cf6', won: '#10b981', lost: '#ef4444' };
const STATUS_COLORS = { prospect: '#f59e0b', activ: '#10b981', inactiv: '#94a3b8' };

function StatCard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-icon" style={{ background: color + '1a', color }}><Icon size={20} /></div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
  }, []);

  if (!data) return (
    <div className="page">
      <div className="dash-skeleton">
        {[1,2,3,4].map(i => <div key={i} className="skeleton-card" />)}
      </div>
    </div>
  );

  const totalContacts = data.contacts.reduce((s, c) => s + parseInt(c.count), 0);
  const activeContacts = data.contacts.find(c => c.status === 'activ')?.count || 0;
  const openDeals = data.deals.filter(d => !['won','lost'].includes(d.stage));
  const totalDealValue = openDeals.reduce((s, d) => s + parseFloat(d.total), 0);
  const wonDeals = data.deals.find(d => d.stage === 'won');
  const totalTasks = data.tasks.reduce((s, t) => s + parseInt(t.count), 0);
  const doneTasks = data.tasks.find(t => t.status === 'done')?.count || 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="stats-grid">
        <StatCard icon={Users} label="Clienți" value={totalContacts}
          color="#3b82f6" sub={`${activeContacts} activi`} onClick={() => navigate('/contacts')} />
        <StatCard icon={TrendingUp} label="Deal-uri active" value={openDeals.reduce((s,d)=>s+parseInt(d.count),0)}
          color="#8b5cf6" sub={`${new Intl.NumberFormat('ro-RO').format(totalDealValue)} RON`} onClick={() => navigate('/pipeline')} />
        <StatCard icon={CheckSquare} label="Taskuri" value={totalTasks}
          color="#10b981" sub={`${doneTasks} finalizate`} onClick={() => navigate('/tasks')} />
        <StatCard icon={FolderKanban} label="Proiecte" value={data.projects.count}
          color="#f59e0b" onClick={() => navigate('/projects')} />
      </div>

      <div className="dash-grid">
        {/* Recent deals */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Deal-uri active</h3>
            <button className="dash-panel-link" onClick={() => navigate('/pipeline')}>
              Vezi toate <ArrowRight size={14} />
            </button>
          </div>
          {data.recentDeals.length === 0 ? (
            <p className="empty-hint">Niciun deal activ.</p>
          ) : (
            <div className="dash-list">
              {data.recentDeals.map(deal => (
                <div key={deal.id} className="dash-list-item" onClick={() => navigate('/pipeline')}>
                  <Circle size={10} fill={STAGE_COLORS[deal.stage]} color={STAGE_COLORS[deal.stage]} />
                  <div className="dash-item-main">
                    <span className="dash-item-title">{deal.title}</span>
                    {deal.contact_name && <span className="dash-item-sub">{deal.contact_company || deal.contact_name}</span>}
                  </div>
                  <div className="dash-item-right">
                    <span className="stage-badge" style={{ background: STAGE_COLORS[deal.stage] + '22', color: STAGE_COLORS[deal.stage] }}>
                      {STAGE_LABELS[deal.stage]}
                    </span>
                    {deal.value > 0 && <span className="deal-value">{new Intl.NumberFormat('ro-RO').format(deal.value)} RON</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent tasks */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <h3>Taskuri în lucru</h3>
            <button className="dash-panel-link" onClick={() => navigate('/tasks')}>
              Vezi toate <ArrowRight size={14} />
            </button>
          </div>
          {data.recentTasks.length === 0 ? (
            <p className="empty-hint">Niciun task activ.</p>
          ) : (
            <div className="dash-list">
              {data.recentTasks.map(task => (
                <div key={task.id} className="dash-list-item" onClick={() => navigate('/tasks')}>
                  <Circle size={10} fill={task.status === 'inprogress' ? '#f59e0b' : '#94a3b8'} color={task.status === 'inprogress' ? '#f59e0b' : '#94a3b8'} />
                  <div className="dash-item-main">
                    <span className="dash-item-title">{task.title}</span>
                    {task.assigned_name && <span className="dash-item-sub">{task.assigned_name}</span>}
                  </div>
                  <span className={`task-status-badge status-${task.status}`}>
                    {task.status === 'todo' ? 'De făcut' : 'În lucru'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
