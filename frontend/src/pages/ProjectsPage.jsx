import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../api';
import toast from 'react-hot-toast';
import { Plus, FolderKanban, Users, CheckSquare, X, Trash2, ChevronRight } from 'lucide-react';

function CreateProjectModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await projectsAPI.create(form);
      onCreate(res.data);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Project</h2>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handle}>
          <div className="form-group">
            <label>Project Name *</label>
            <input placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label>Description</label>
            <textarea placeholder="What's this project about?" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Plus size={15} /> Create Project</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    projectsAPI.getAll().then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (!confirm('Delete this project and all its tasks?')) return;
    try {
      await projectsAPI.delete(id);
      setProjects(ps => ps.filter(p => p.id !== id));
      toast.success('Project deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  if (loading) return <div className="page-loader"><span className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, marginBottom: 4 }}>Projects</h1>
          <p style={{ color: 'var(--text2)' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} /> New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 60 }}>
          <FolderKanban size={40} color="var(--border2)" style={{ marginBottom: 12 }} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}><Plus size={15} /> Create Project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {projects.map(p => (
            <Link key={p.id} to={`/projects/${p.id}`} style={{ display: 'block' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'border-color 0.2s, transform 0.15s', ':hover': { borderColor: 'var(--accent)' } }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--accent-glow)', border: '1px solid rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FolderKanban size={18} color="var(--accent-light)" />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge badge-${p.role}`}>{p.role}</span>
                    {p.role === 'admin' && (
                      <button className="btn-icon btn-ghost btn-sm" onClick={e => handleDelete(e, p.id)} title="Delete project">
                        <Trash2 size={13} color="var(--text3)" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 style={{ fontSize: 15, marginBottom: 6, fontFamily: 'Syne, sans-serif' }}>{p.name}</h3>
                {p.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 14, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: 14, color: 'var(--text3)', fontSize: 12, marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={12} /> {p.member_count} member{p.member_count !== 1 ? 's' : ''}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckSquare size={12} /> {p.task_count} task{p.task_count !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={p => setProjects(ps => [p, ...ps])} />}
    </div>
  );
}
