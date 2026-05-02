import { useState } from 'react';
import { tasksAPI } from '../api';
import toast from 'react-hot-toast';
import { X, Save } from 'lucide-react';

export default function TaskModal({ task, projectId, members, isAdmin, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    due_date: task?.due_date || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    assigned_to: task?.assigned_to || '',
  });
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to || null, project_id: projectId };
      if (!isAdmin) {
        // Members can only update status
        const res = await tasksAPI.update(task.id, { status: form.status });
        onSave(res.data);
      } else if (isEdit) {
        const res = await tasksAPI.update(task.id, payload);
        onSave(res.data);
      } else {
        const res = await tasksAPI.create(payload);
        onSave(res.data);
      }
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handle}>
          {isAdmin && (
            <>
              <div className="form-group">
                <label>Title *</label>
                <input placeholder="Task title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Task details..." rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Assign To</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                    <option value="">Unassigned</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {!isAdmin && isEdit && (
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label>Update Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>As a member, you can only update the status of tasks assigned to you.</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create Task'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
