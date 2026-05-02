import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, parseISO, isPast } from 'date-fns';
import { Plus, X, Trash2, Users, Settings, ArrowLeft, Edit2, UserPlus, Calendar, Flag } from 'lucide-react';
import TaskModal from '../components/TaskModal';

function MembersModal({ projectId, members, onClose, onUpdate }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);

  const addMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.addMember(projectId, { email, role });
      onUpdate([...members, res.data]);
      setEmail('');
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member');
    } finally { setLoading(false); }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsAPI.removeMember(projectId, userId);
      onUpdate(members.filter(m => m.id !== userId));
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to remove');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Members</h2>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={addMember} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input type="email" placeholder="member@email.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ flex: 1 }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ width: 110 }}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary" disabled={loading} style={{ flexShrink: 0 }}>
            {loading ? <span className="spinner" /> : <><UserPlus size={14} /> Add</>}
          </button>
        </form>
        <div>
          {members.map(m => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--accent-light)', flexShrink: 0 }}>
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{m.email}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {m.role !== 'admin' && (
                <button className="btn-icon btn-ghost btn-sm" onClick={() => removeMember(m.id)}><Trash2 size={13} color="var(--red)" /></button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--text3)' },
  { key: 'inprogress', label: 'In Progress', color: 'var(--blue)' },
  { key: 'done', label: 'Done', color: 'var(--green)' },
];

function TaskCard({ task, isAdmin, onEdit, onDelete }) {
  const overdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px',
      marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onClick={() => onEdit(task)}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {isAdmin && <button className="btn-icon btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onDelete(task.id); }}><Trash2 size={12} color="var(--text3)" /></button>}
        </div>
      </div>
      {task.description && <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{task.description}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span className={`badge badge-${task.priority}`}><Flag size={9} />{task.priority}</span>
        {task.due_date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: overdue ? 'var(--red)' : 'var(--text3)' }}>
            <Calendar size={10} />{format(parseISO(task.due_date), 'MMM d')}
          </span>
        )}
        {task.assigned_to_name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto' }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text2)' }}>
              {task.assigned_to_name.charAt(0)}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{task.assigned_to_name.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    Promise.all([projectsAPI.getOne(id), tasksAPI.getAll(id)])
      .then(([pRes, tRes]) => { setProject(pRes.data); setTasks(tRes.data); })
      .catch(err => { toast.error('Failed to load project'); navigate('/projects'); })
      .finally(() => setLoading(false));
  }, [id]);

  const isAdmin = project?.role === 'admin';

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try { await tasksAPI.delete(taskId); setTasks(ts => ts.filter(t => t.id !== taskId)); toast.success('Task deleted'); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
  };

  const handleSaveTask = (saved) => {
    setTasks(ts => ts.find(t => t.id === saved.id) ? ts.map(t => t.id === saved.id ? saved : t) : [saved, ...ts]);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  if (loading) return <div className="page-loader"><span className="spinner" /></div>;
  if (!project) return null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/projects')} style={{ marginBottom: 12 }}><ArrowLeft size={14} /> Projects</button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24 }}>{project.name}</h1>
              <span className={`badge badge-${project.role}`}>{project.role}</span>
            </div>
            {project.description && <p style={{ color: 'var(--text2)', fontSize: 13 }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isAdmin && <button className="btn-secondary" onClick={() => setShowMembers(true)}><Users size={15} /> Members ({project.members?.length})</button>}
            {isAdmin && <button className="btn-primary" onClick={() => { setEditTask(null); setShowTaskModal(true); }}><Plus size={15} /> Add Task</button>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>FILTER:</span>
        {['all', 'todo', 'inprogress', 'done'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontFamily: 'Syne,sans-serif', fontWeight: 600, border: 'none',
              background: filterStatus === s ? 'var(--accent)' : 'var(--surface2)',
              color: filterStatus === s ? 'white' : 'var(--text2)', cursor: 'pointer' }}>
            {s === 'all' ? 'All' : s === 'inprogress' ? 'In Progress' : s === 'todo' ? 'To Do' : 'Done'}
          </button>
        ))}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 130, padding: '5px 10px', fontSize: 12 }}>
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.key);
          return (
            <div key={col.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                <span style={{ fontFamily: 'Syne,sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--surface2)', color: 'var(--text3)', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 600 }}>{colTasks.length}</span>
              </div>
              <div style={{ minHeight: 100 }}>
                {colTasks.map(task => (
                  <TaskCard key={task.id} task={task} isAdmin={isAdmin}
                    onEdit={t => { setEditTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask} />
                ))}
                {colTasks.length === 0 && (
                  <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>No tasks</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskModal && (
        <TaskModal
          task={editTask}
          projectId={parseInt(id)}
          members={project.members || []}
          isAdmin={isAdmin}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSave={handleSaveTask}
        />
      )}

      {showMembers && isAdmin && (
        <MembersModal
          projectId={id}
          members={project.members || []}
          onClose={() => setShowMembers(false)}
          onUpdate={(newMembers) => setProject(p => ({ ...p, members: newMembers }))}
        />
      )}
    </div>
  );
}
