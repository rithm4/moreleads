import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, CheckSquare, FolderKanban,
  ArrowRight, Circle, Calendar, BarChart2, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { SkeletonCard } from '../components/UI/Skeleton';

const STAGE_LABELS = { lead: 'Lead', contacted: 'Contactat', proposal: 'Propunere', negotiation: 'Negociere', won: 'Câștigat', lost: 'Pierdut' };
const STAGE_COLORS = { lead: '#94a3b8', contacted: '#3b82f6', proposal: '#f59e0b', negotiation: '#8b5cf6', won: '#10b981', lost: '#ef4444' };
const STATUS_META = { todo: { label: 'De făcut', color: '#6366f1' }, inprogress: { label: 'În lucru', color: '#f59e0b' } };

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

function MyTaskRow({ task }) {
  const navigate = useNavigate();
  const meta = STATUS_META[task.status] || STATUS_META.todo;
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div className="dash-list-item" onClick={() => navigate('/tasks')} style={{ cursor: 'pointer' }}>
      <div className="mobile-task-dot" style={{ background: meta.color, width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
      <div className="dash-item-main">
        <span className="dash-item-title">{task.title}</span>
        {task.due_date && (
          <span className="dash-item-sub" style={{ color: overdue ? '#ef4444' : 'var(--text-3)' }}>
            <Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />
            {new Date(task.due_date).toLocaleDateString('ro-RO')}
            {overdue && ' — Întârziat!'}
          </span>
        )}
      </div>
      <span className="task-status-badge" style={{ background: meta.color + '18', color: meta.color }}>
        {meta.label}
      </span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div><strong>{payload[0].value}</strong> deal-uri</div>
      {payload[1]?.value > 0 && <div>{new Intl.NumberFormat('ro-RO').format(payload[1].value)} RON</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [activity, setActivity] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
    api.get('/activity').then(r => setActivity(r.data)).catch(() => {});
  }, []);

  if (!data) return (
    <div className="page">
      <div className="stats-grid">{[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}</div>
      <div className="dash-grid">{[1,2].map(i => <SkeletonCard key={i} lines={5} />)}</div>
    </div>
  );

  const totalContacts = data.contacts.reduce((s, c) => s + parseInt(c.count), 0);
  const activeContacts = data.contacts.find(c => c.status === 'activ')?.count || 0;
  const openDeals = data.deals.filter(d => !['won','lost'].includes(d.stage));
  const totalDealValue = openDeals.reduce((s, d) => s + parseFloat(d.total), 0);
  const totalTasks = data.tasks.reduce((s, t) => s + parseInt(t.count), 0);
  const doneTasks = data.tasks.find(t => t.status === 'done')?.count || 0;

  // Build 30-day chart data
  const chartData = (() => {
    const map = {};
    (data.dealTrend || []).forEach(r => {
      map[r.day.slice(0, 10)] = { count: parseInt(r.count), value: parseFloat(r.value) };
    });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = `${d.getDate()} ${d.toLocaleString('ro-RO', { month: 'short' })}`;
      days.push({ name: label, 'Deal-uri': map[key]?.count || 0, 'Valoare': map[key]?.value || 0 });
    }
    return days.filter((_, i) => i % 3 === 0); // show every 3rd day for readability
  })();

  const hasChartData = chartData.some(d => d['Deal-uri'] > 0);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="dash-greeting">Bună, {user?.name?.split(' ')[0]}! 👋</span>
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

      {/* My Tasks */}
      {data.myTasks?.length > 0 && (
        <div className="dash-panel dash-panel-full" style={{ marginBottom: 16 }}>
          <div className="dash-panel-header">
            <h3><CheckSquare size={15} /> Taskurile mele</h3>
            <button className="dash-panel-link" onClick={() => navigate('/tasks')}>
              Vezi toate <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-list">
            {data.myTasks.map(task => <MyTaskRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

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
                  <span className="task-status-badge" style={{ background: task.status === 'inprogress' ? '#f59e0b18' : '#6366f118', color: task.status === 'inprogress' ? '#f59e0b' : '#6366f1' }}>
                    {task.status === 'todo' ? 'De făcut' : 'În lucru'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="dash-panel dash-panel-full" style={{ marginTop: 16 }}>
          <div className="dash-panel-header">
            <h3><Activity size={15} /> Activitate recentă</h3>
          </div>
          <div className="activity-list">
            {activity.slice(0, 10).map(item => (
              <div key={item.id} className="activity-row">
                <div className="activity-avatar">{item.user_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
                <div className="activity-body">
                  <span className="activity-user">{item.user_name}</span>
                  {' '}
                  <span className="activity-action">{item.action === 'created' ? 'a adăugat' : item.action === 'moved' ? 'a mutat' : 'a actualizat'}</span>
                  {' '}
                  <span className="activity-entity">{item.entity === 'task' ? 'taskul' : item.entity === 'deal' ? 'deal-ul' : item.entity}</span>
                  {item.details && <span className="activity-details"> „{item.details}"</span>}
                </div>
                <div className="activity-time">{new Date(item.created_at).toLocaleString('ro-RO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deal trend chart */}
      <div className="dash-panel dash-panel-full" style={{ marginTop: 16 }}>
        <div className="dash-panel-header">
          <h3><BarChart2 size={15} /> Deal-uri în ultimele 30 zile</h3>
        </div>
        {!hasChartData ? (
          <p className="empty-hint">Nu există deal-uri în ultimele 30 zile.</p>
        ) : (
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-2)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-2)' }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Deal-uri" fill="#6366f1" radius={[4,4,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
