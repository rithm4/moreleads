import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, CheckSquare, FolderKanban,
  ArrowUpRight, Calendar, BarChart2,
  Activity, ChevronRight, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { SkeletonCard } from '../components/UI/Skeleton';

const STAGE_LABELS = { lead: 'Lead', contacted: 'Contactat', proposal: 'Propunere', negotiation: 'Negociere', won: 'Câștigat', lost: 'Pierdut' };
const STAGE_COLORS = { lead: '#94a3b8', contacted: '#3b82f6', proposal: '#f59e0b', negotiation: '#8b5cf6', won: '#10b981', lost: '#ef4444' };
const STATUS_META = { todo: { label: 'De făcut', color: '#6366f1' }, inprogress: { label: 'În lucru', color: '#f59e0b' } };

const STAT_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
];

function StatCard({ icon: Icon, label, value, sub, gradient, onClick, index }) {
  return (
    <div className="stat-card-v2" onClick={onClick} style={{ '--card-gradient': gradient || STAT_GRADIENTS[index % 4] }}>
      <div className="stat-card-v2-top">
        <div className="stat-card-v2-icon">
          <Icon size={18} />
        </div>
        <ArrowUpRight size={14} className="stat-card-v2-arrow" />
      </div>
      <div className="stat-card-v2-value">{value}</div>
      <div className="stat-card-v2-label">{label}</div>
      {sub && <div className="stat-card-v2-sub">{sub}</div>}
    </div>
  );
}

function DealRow({ deal }) {
  const navigate = useNavigate();
  return (
    <div className="dash-row" onClick={() => navigate('/pipeline')}>
      <div className="dash-row-dot" style={{ background: STAGE_COLORS[deal.stage] }} />
      <div className="dash-row-main">
        <span className="dash-row-title">{deal.title}</span>
        {deal.contact_name && <span className="dash-row-sub">{deal.contact_company || deal.contact_name}</span>}
      </div>
      <div className="dash-row-end">
        <span className="dash-tag" style={{ '--tag-color': STAGE_COLORS[deal.stage] }}>
          {STAGE_LABELS[deal.stage]}
        </span>
        {deal.value > 0 && (
          <span className="dash-row-value">{new Intl.NumberFormat('ro-RO').format(deal.value)} RON</span>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const navigate = useNavigate();
  const meta = STATUS_META[task.status] || STATUS_META.todo;
  const overdue = task.due_date && new Date(task.due_date) < new Date();
  return (
    <div className="dash-row" onClick={() => navigate('/tasks')}>
      <div className="dash-row-dot" style={{ background: meta.color }} />
      <div className="dash-row-main">
        <span className="dash-row-title">{task.title}</span>
        {task.due_date && (
          <span className="dash-row-sub" style={{ color: overdue ? '#ef4444' : undefined }}>
            <Calendar size={10} style={{ display: 'inline', marginRight: 3 }} />
            {new Date(task.due_date).toLocaleDateString('ro-RO')}
            {overdue && ' — Întârziat!'}
          </span>
        )}
      </div>
      <span className="dash-tag" style={{ '--tag-color': meta.color }}>{meta.label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div><strong>{payload[0].value}</strong> deal-uri</div>
    </div>
  );
}

function PanelHeader({ title, icon: Icon, onMore, moreLabel = 'Vezi toate' }) {
  return (
    <div className="dash-panel-hd">
      <div className="dash-panel-hd-left">
        {Icon && <Icon size={14} className="dash-panel-hd-icon" />}
        <span>{title}</span>
      </div>
      {onMore && (
        <button className="dash-panel-hd-more" onClick={onMore}>
          {moreLabel} <ChevronRight size={13} />
        </button>
      )}
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
      <div className="stats-grid-v2">{[1,2,3,4].map(i => <SkeletonCard key={i} lines={3} />)}</div>
      <div className="dash-grid-v2">{[1,2].map(i => <SkeletonCard key={i} lines={5} />)}</div>
    </div>
  );

  const totalContacts = data.contacts.reduce((s, c) => s + parseInt(c.count), 0);
  const activeContacts = data.contacts.find(c => c.status === 'activ')?.count || 0;
  const openDeals = data.deals.filter(d => !['won','lost'].includes(d.stage));
  const totalDealValue = openDeals.reduce((s, d) => s + parseFloat(d.total), 0);
  const totalTasks = data.tasks.reduce((s, t) => s + parseInt(t.count), 0);
  const doneTasks = data.tasks.find(t => t.status === 'done')?.count || 0;

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
      days.push({ name: label, 'Deal-uri': map[key]?.count || 0 });
    }
    return days.filter((_, i) => i % 3 === 0);
  })();

  const hasChartData = chartData.some(d => d['Deal-uri'] > 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="page">

      {/* Welcome header */}
      <div className="dash-welcome">
        <div className="dash-welcome-left">
          <h1 className="dash-welcome-title">
            Bună, {user?.name?.split(' ')[0]}! <span className="dash-wave">👋</span>
          </h1>
          <p className="dash-welcome-date">{dateStr}</p>
        </div>
        <div className="dash-welcome-badge">
          <Zap size={14} />
          <span>Live</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="stats-grid-v2">
        <StatCard index={0} icon={Users} label="Clienți totali" value={totalContacts}
          sub={`${activeContacts} activi`} onClick={() => navigate('/contacts')} />
        <StatCard index={1} icon={TrendingUp} label="Deal-uri active" value={openDeals.reduce((s,d)=>s+parseInt(d.count),0)}
          sub={`${new Intl.NumberFormat('ro-RO').format(totalDealValue)} RON`} onClick={() => navigate('/pipeline')} />
        <StatCard index={2} icon={CheckSquare} label="Taskuri" value={totalTasks}
          sub={`${doneTasks} finalizate`} onClick={() => navigate('/tasks')} />
        <StatCard index={3} icon={FolderKanban} label="Proiecte" value={data.projects.count}
          sub="active" onClick={() => navigate('/projects')} />
      </div>

      {/* Main grid */}
      <div className="dash-grid-v2">

        {/* Deals panel */}
        <div className="dash-panel-v2">
          <PanelHeader title="Deal-uri active" icon={TrendingUp} onMore={() => navigate('/pipeline')} />
          {data.recentDeals.length === 0 ? (
            <p className="empty-hint">Niciun deal activ.</p>
          ) : (
            <div className="dash-rows">
              {data.recentDeals.map(deal => <DealRow key={deal.id} deal={deal} />)}
            </div>
          )}
        </div>

        {/* Tasks panel */}
        <div className="dash-panel-v2">
          <PanelHeader title="Taskuri în lucru" icon={CheckSquare} onMore={() => navigate('/tasks')} />
          {data.recentTasks.length === 0 ? (
            <p className="empty-hint">Niciun task activ.</p>
          ) : (
            <div className="dash-rows">
              {data.recentTasks.map(task => (
                <div key={task.id} className="dash-row" onClick={() => navigate('/tasks')}>
                  <div className="dash-row-dot" style={{ background: task.status === 'inprogress' ? '#f59e0b' : '#6366f1' }} />
                  <div className="dash-row-main">
                    <span className="dash-row-title">{task.title}</span>
                    {task.assigned_name && <span className="dash-row-sub">{task.assigned_name}</span>}
                  </div>
                  <span className="dash-tag" style={{ '--tag-color': task.status === 'inprogress' ? '#f59e0b' : '#6366f1' }}>
                    {task.status === 'todo' ? 'De făcut' : 'În lucru'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My tasks */}
        {data.myTasks?.length > 0 && (
          <div className="dash-panel-v2 dash-panel-v2-full">
            <PanelHeader title="Taskurile mele" icon={CheckSquare} onMore={() => navigate('/tasks')} />
            <div className="dash-rows">
              {data.myTasks.map(task => <TaskRow key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {/* Chart */}
        <div className="dash-panel-v2 dash-panel-v2-full">
          <PanelHeader title="Deal-uri — ultimele 30 zile" icon={BarChart2} />
          {!hasChartData ? (
            <p className="empty-hint">Nu există deal-uri în ultimele 30 zile.</p>
          ) : (
            <div style={{ height: 180, marginTop: 8 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="dealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-2)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="Deal-uri" stroke="#6366f1" strokeWidth={2} fill="url(#dealGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Activity */}
        {activity.length > 0 && (
          <div className="dash-panel-v2 dash-panel-v2-full">
            <PanelHeader title="Activitate recentă" icon={Activity} />
            <div className="dash-activity">
              {activity.slice(0, 8).map(item => (
                <div key={item.id} className="dash-activity-row">
                  <div className="dash-activity-av">{item.user_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
                  <div className="dash-activity-body">
                    <span className="dash-activity-user">{item.user_name}</span>
                    {' '}
                    <span className="dash-activity-action">
                      {item.action === 'created' ? 'a adăugat' : item.action === 'moved' ? 'a mutat' : 'a actualizat'}
                    </span>
                    {item.details && <span className="dash-activity-detail"> „{item.details}"</span>}
                  </div>
                  <div className="dash-activity-time">
                    {new Date(item.created_at).toLocaleString('ro-RO', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
