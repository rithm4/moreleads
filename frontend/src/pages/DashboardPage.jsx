import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, CheckSquare, FolderKanban,
  ArrowUpRight, Calendar, MoreHorizontal, Maximize2,
  Activity, Zap, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { SkeletonCard } from '../components/UI/Skeleton';

const STAGE_LABELS = {
  lead: 'Lead', contacted: 'Contactat', proposal: 'Propunere',
  negotiation: 'Negociere', won: 'Câștigat', lost: 'Pierdut'
};
const STAGE_COLORS = {
  lead: '#94a3b8', contacted: '#3462EE', proposal: '#EFE347',
  negotiation: '#8b5cf6', won: '#10b981', lost: '#ef4444'
};

// Salesforce palette — index determines card color
const CARD_PALETTE = [
  { bg: '#3462EE', text: '#fff',     sub: 'rgba(255,255,255,.65)' },
  { bg: '#4A91A8', text: '#fff',     sub: 'rgba(255,255,255,.65)' },
  { bg: '#121721', text: '#fff',     sub: 'rgba(255,255,255,.55)' },
  { bg: '#EFE347', text: '#121721',  sub: 'rgba(18,23,33,.55)'    },
];

/* ── KPI strip item ── */
function KpiItem({ icon: Icon, value, label, badge, badgeColor }) {
  return (
    <div className="sf-kpi">
      <div className="sf-kpi-icon"><Icon size={15} /></div>
      <div className="sf-kpi-body">
        <div className="sf-kpi-value">{value}</div>
        <div className="sf-kpi-label">{label}</div>
      </div>
      {badge && (
        <span className="sf-kpi-badge" style={badgeColor ? { background: badgeColor + '22', color: badgeColor } : {}}>
          {badge}
        </span>
      )}
    </div>
  );
}

/* ── Colored deal card ── */
function DealCard({ deal, colorIndex, onClick }) {
  const p = CARD_PALETTE[colorIndex % CARD_PALETTE.length];
  const colored = colorIndex < CARD_PALETTE.length;
  const initials = (deal.contact_name || deal.title || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      className="sf-deal-card"
      onClick={onClick}
      style={colored
        ? { background: p.bg, color: p.text, borderColor: 'transparent' }
        : {}
      }
    >
      <div className="sf-deal-card-top">
        <span className="sf-deal-card-stage" style={colored ? { color: p.sub } : {}}>
          {STAGE_LABELS[deal.stage]}
        </span>
        <button className="sf-deal-card-menu" style={colored ? { color: p.sub } : {}}>
          <MoreHorizontal size={13} />
        </button>
      </div>
      <div className="sf-deal-card-title">{deal.title}</div>
      {deal.contact_company && (
        <div className="sf-deal-card-co" style={colored ? { color: p.sub } : {}}>
          {deal.contact_company}
        </div>
      )}
      <div className="sf-deal-card-footer">
        <span className="sf-deal-card-val">
          {deal.value > 0 ? `${new Intl.NumberFormat('ro-RO').format(deal.value)} RON` : '—'}
        </span>
        <div
          className="sf-deal-av"
          style={colored
            ? { background: 'rgba(255,255,255,.22)', color: p.text }
            : {}
          }
        >
          {initials}
        </div>
      </div>
    </div>
  );
}

/* ── Funnel row ── */
function FunnelRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="sf-funnel-row">
      <div className="sf-funnel-row-hd">
        <span className="sf-funnel-label">{label}</span>
        <span className="sf-funnel-pct">{pct}%</span>
      </div>
      <div className="sf-funnel-track">
        <div className="sf-funnel-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="sf-funnel-amt">{new Intl.NumberFormat('ro-RO').format(value)} RON</span>
    </div>
  );
}

/* ── Chart tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div><strong>{payload[0].value}</strong> deal-uri</div>
    </div>
  );
}

/* ── Panel header ── */
function PanelHd({ title, onMore, moreIcon: Icon = ChevronRight, extra }) {
  return (
    <div className="sf-panel-hd">
      <span className="sf-panel-title">{title}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {extra}
        {onMore && (
          <button className="sf-panel-btn" onClick={onMore}><Icon size={14} /></button>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function DashboardPage() {
  const [data, setData]       = useState(null);
  const [activity, setActivity] = useState([]);
  const { user } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data));
    api.get('/activity').then(r => setActivity(r.data)).catch(() => {});
  }, []);

  if (!data) return (
    <div className="page">
      <div className="sf-kpi-bar" style={{ marginBottom: 24 }}>
        {[1,2,3,4].map(i => <SkeletonCard key={i} lines={2} />)}
      </div>
      <div className="sf-layout">
        <div className="sf-col-main">{[1,2].map(i => <SkeletonCard key={i} lines={4} />)}</div>
        <div className="sf-col-side">{[1,2].map(i => <SkeletonCard key={i} lines={3} />)}</div>
      </div>
    </div>
  );

  /* ── Computed values ── */
  const totalContacts   = data.contacts.reduce((s, c) => s + parseInt(c.count), 0);
  const activeContacts  = parseInt(data.contacts.find(c => c.status === 'activ')?.count || 0);
  const openDeals       = data.deals.filter(d => !['won','lost'].includes(d.stage));
  const totalDealValue  = openDeals.reduce((s, d) => s + parseFloat(d.total), 0);
  const openDealsCount  = openDeals.reduce((s, d) => s + parseInt(d.count), 0);
  const totalTasks      = data.tasks.reduce((s, t) => s + parseInt(t.count), 0);
  const doneTasks       = parseInt(data.tasks.find(t => t.status === 'done')?.count || 0);
  const inProgressTasks = parseInt(data.tasks.find(t => t.status === 'inprogress')?.count || 0);
  const wonDealsValue   = parseFloat(data.deals.find(d => d.stage === 'won')?.total || 0);
  const wonDealsCount   = parseInt(data.deals.find(d => d.stage === 'won')?.count || 0);

  const chartData = (() => {
    const map = {};
    (data.dealTrend || []).forEach(r => {
      map[r.day.slice(0,10)] = parseInt(r.count);
    });
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0,10);
      days.push({ name: `${d.getDate()} ${d.toLocaleString('ro-RO',{month:'short'})}`, 'Deal-uri': map[key] || 0 });
    }
    return days.filter((_, i) => i % 3 === 0);
  })();
  const hasChart = chartData.some(d => d['Deal-uri'] > 0);

  const dateStr = new Date().toLocaleDateString('ro-RO', { weekday:'long', day:'numeric', month:'long' });

  return (
    <div className="page page-wide">

      {/* ── Welcome + KPI strip ── */}
      <div className="sf-topbar">
        <div className="sf-topbar-left">
          <h1 className="sf-title">Dashboard</h1>
          <p className="sf-date">{dateStr} · Bună, {user?.name?.split(' ')[0]}!</p>
        </div>
        <div className="sf-kpi-bar">
          <KpiItem icon={TrendingUp}
            value={new Intl.NumberFormat('ro-RO',{notation:'compact'}).format(totalDealValue) + ' RON'}
            label="Valoare pipeline"
            badge={`${openDealsCount} deal-uri`} badgeColor="#3462EE" />
          <div className="sf-kpi-sep" />
          <KpiItem icon={Users}
            value={totalContacts} label="Clienți"
            badge={`+${activeContacts} activi`} badgeColor="#4A91A8" />
          <div className="sf-kpi-sep" />
          <KpiItem icon={CheckSquare}
            value={totalTasks} label="Taskuri"
            badge={`${doneTasks} done`} badgeColor="#10b981" />
          <div className="sf-kpi-sep" />
          <KpiItem icon={FolderKanban}
            value={data.projects.count} label="Proiecte"
            badge="active" badgeColor="#8b5cf6" />
        </div>
      </div>

      {/* ── Main 2-col layout ── */}
      <div className="sf-layout">

        {/* LEFT column */}
        <div className="sf-col-main">

          {/* Deal cards grid */}
          <div className="sf-panel">
            <PanelHd title="Deal-uri active"
              onMore={() => navigate('/pipeline')}
              moreIcon={Maximize2} />
            {data.recentDeals.length === 0
              ? <p className="empty-hint">Niciun deal activ.</p>
              : (
                <div className="sf-deals-grid">
                  {data.recentDeals.map((deal, i) => (
                    <DealCard key={deal.id} deal={deal} colorIndex={i}
                      onClick={() => navigate('/pipeline')} />
                  ))}
                </div>
              )
            }
          </div>

          {/* Tasks + Funnel row */}
          <div className="sf-row2">

            {/* My tasks */}
            <div className="sf-panel">
              <PanelHd title="Taskurile mele" onMore={() => navigate('/tasks')} />
              {(!data.myTasks || data.myTasks.length === 0)
                ? <p className="empty-hint">Niciun task asignat.</p>
                : (
                  <div className="sf-task-list">
                    {data.myTasks.slice(0, 5).map(task => {
                      const overdue = task.due_date && new Date(task.due_date) < new Date();
                      const inP = task.status === 'inprogress';
                      return (
                        <div key={task.id} className="sf-task-row" onClick={() => navigate('/tasks')}>
                          <div className="sf-task-dot" style={{ background: inP ? '#EFE347' : '#3462EE' }} />
                          <div className="sf-task-body">
                            <span className="sf-task-title">{task.title}</span>
                            {task.due_date && (
                              <span className="sf-task-date" style={{ color: overdue ? '#ef4444' : undefined }}>
                                <Calendar size={10} style={{ display:'inline', marginRight:2 }} />
                                {new Date(task.due_date).toLocaleDateString('ro-RO')}
                                {overdue && ' ⚠'}
                              </span>
                            )}
                          </div>
                          <span className="sf-task-pill"
                            style={{ background: inP ? '#EFE34722' : '#3462EE15', color: inP ? '#a16207' : '#3462EE' }}>
                            {inP ? 'În lucru' : 'De făcut'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              }
            </div>

            {/* Stage funnel */}
            <div className="sf-panel">
              <PanelHd title="Stage Funnel"
                extra={<span className="sf-funnel-total">{new Intl.NumberFormat('ro-RO').format(totalDealValue)} RON</span>} />
              {openDeals.length === 0
                ? <p className="empty-hint">Niciun deal în pipeline.</p>
                : (
                  <div className="sf-funnel-list">
                    {openDeals.map(d => (
                      <FunnelRow key={d.stage}
                        label={STAGE_LABELS[d.stage]}
                        value={parseFloat(d.total)}
                        total={totalDealValue}
                        color={STAGE_COLORS[d.stage]} />
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          {/* Area chart */}
          <div className="sf-panel">
            <PanelHd title="Deal-uri — ultimele 30 zile" />
            {!hasChart
              ? <p className="empty-hint">Nu există deal-uri în ultimele 30 zile.</p>
              : (
                <div style={{ height: 160, marginTop: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top:4, right:8, bottom:0, left:-20 }}>
                      <defs>
                        <linearGradient id="sfGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3462EE" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3462EE" stopOpacity={0}   />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize:11, fill:'var(--text-3)' }} allowDecimals={false} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ stroke:'var(--border-2)', strokeWidth:1 }} />
                      <Area type="monotone" dataKey="Deal-uri" stroke="#3462EE" strokeWidth={2}
                        fill="url(#sfGrad)" dot={false} activeDot={{ r:4, fill:'#3462EE' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </div>
        </div>

        {/* RIGHT sidebar */}
        <div className="sf-col-side">

          {/* Won deals — dark card */}
          <div className="sf-panel sf-card-dark">
            <PanelHd title="Deal-uri câștigate"
              onMore={() => navigate('/pipeline')}
              moreIcon={ArrowUpRight} />
            <div className="sf-side-big">{new Intl.NumberFormat('ro-RO').format(wonDealsValue)} RON</div>
            <div className="sf-side-sub">Total câștigat</div>
            <div className="sf-side-pills">
              <span className="sf-side-pill">{wonDealsCount} deals won</span>
              <span className="sf-side-pill sf-side-pill-green">
                <Zap size={10} /> {inProgressTasks} în lucru
              </span>
            </div>
          </div>

          {/* Activity feed */}
          {activity.length > 0 && (
            <div className="sf-panel" style={{ flex: 1 }}>
              <PanelHd title="Activitate recentă"
                extra={<Activity size={13} style={{ color:'var(--text-3)' }} />} />
              <div className="sf-act-list">
                {activity.slice(0, 7).map(item => (
                  <div key={item.id} className="sf-act-row">
                    <div className="sf-act-av">
                      {item.user_name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div className="sf-act-body">
                      <span className="sf-act-user">{item.user_name?.split(' ')[0]}</span>
                      {' '}
                      <span className="sf-act-action">
                        {item.action==='created' ? 'a adăugat' : item.action==='moved' ? 'a mutat' : 'a actualizat'}
                      </span>
                      {item.details && <span className="sf-act-detail"> „{item.details}"</span>}
                    </div>
                    <div className="sf-act-time">
                      {new Date(item.created_at).toLocaleString('ro-RO',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects — accent gradient card */}
          <div className="sf-panel sf-card-accent" onClick={() => navigate('/projects')} style={{ cursor:'pointer' }}>
            <PanelHd title="Proiecte active"
              onMore={() => navigate('/projects')} moreIcon={ArrowUpRight} />
            <div className="sf-side-big" style={{ fontSize: 40 }}>{data.projects.count}</div>
            <div className="sf-side-sub">proiecte în desfășurare</div>
          </div>

        </div>
      </div>
    </div>
  );
}
