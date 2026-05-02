import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';

const COLORS = { todo: '#5c6278', inprogress: '#4da6ff', done: '#22d37a' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getOverview().then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><span className="spinner" /></div>;

  const pieData = data ? [
    { name: 'To Do', value: data.tasksByStatus.todo, color: COLORS.todo },
    { name: 'In Progress', value: data.tasksByStatus.inprogress, color: COLORS.inprogress },
    { name: 'Done', value: data.tasksByStatus.done, color: COLORS.done },
  ] : [];

  const statCards = [
    { label: 'Total Tasks', value: data?.totalTasks || 0, icon: <ListTodo size={20} />, color: 'var(--accent)' },
    { label: 'In Progress', value: data?.tasksByStatus?.inprogress || 0, icon: <Clock size={20} />, color: 'var(--blue)' },
    { label: 'Completed', value: data?.tasksByStatus?.done || 0, icon: <CheckCircle2 size={20} />, color: 'var(--green)' },
    { label: 'Overdue', value: data?.overdueTasks || 0, icon: <AlertTriangle size={20} />, color: 'var(--red)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, marginBottom: 4 }}>Good day, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text2)' }}>Here's what's happening across your projects</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(card => (
          <div key={card.label} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: `color-mix(in srgb, ${card.color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 28, fontFamily: 'Syne, sans-serif', fontWeight: 800, lineHeight: 1 }}>{card.value}</div>
              <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Task Distribution */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Task Distribution</h3>
          {data?.totalTasks > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No tasks yet</p></div>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Tasks per User */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 20 }}>Tasks per Member</h3>
          {data?.tasksPerUser?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.tasksPerUser} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
                <Bar dataKey="task_count" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="done_count" fill="var(--green)" radius={[4, 4, 0, 0]} name="Done" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state" style={{ padding: '40px 0' }}><p>No assigned tasks</p></div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* My Tasks */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15 }}>My Open Tasks</h3>
          </div>
          {data?.myTasks?.length > 0 ? data.myTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.project_name}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                {task.due_date && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{format(parseISO(task.due_date), 'MMM d')}</span>}
              </div>
            </div>
          )) : <div className="empty-state" style={{ padding: '30px 0' }}><p>No open tasks assigned to you</p></div>}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h3 style={{ fontSize: 15, marginBottom: 16 }}>Recent Activity</h3>
          {data?.recentTasks?.length > 0 ? data.recentTasks.map(task => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span className={`badge badge-${task.status}`} style={{ flexShrink: 0 }}>{task.status === 'inprogress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{task.project_name}</div>
              </div>
            </div>
          )) : <div className="empty-state" style={{ padding: '30px 0' }}><p>No recent activity</p></div>}
        </div>
      </div>
    </div>
  );
}
