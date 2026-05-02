const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

const isMember = (projectId, userId) => {
  const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return !!member;
};

const isAdmin = (projectId, userId) => {
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return member && member.role === 'admin';
};

// GET /api/tasks?project_id= - Get tasks for a project
router.get('/', authenticate, (req, res) => {
  const { project_id } = req.query;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });

  if (!isMember(project_id, req.user.id))
    return res.status(403).json({ error: 'Access denied' });

  const tasks = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.project_id = ?
    ORDER BY 
      CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
  `).all(project_id);

  res.json(tasks);
});

// POST /api/tasks - Create task (admin only)
router.post('/', authenticate, (req, res) => {
  const { project_id, title, description, due_date, priority, assigned_to } = req.body;

  if (!project_id || !title)
    return res.status(400).json({ error: 'project_id and title are required' });

  if (!isAdmin(project_id, req.user.id))
    return res.status(403).json({ error: 'Admin access required to create tasks' });

  if (assigned_to && !isMember(project_id, assigned_to))
    return res.status(400).json({ error: 'Assigned user is not a project member' });

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, title, description || '', due_date || null, priority || 'medium', assigned_to || null, req.user.id);

  const task = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json(task);
});

// GET /api/tasks/:id - Get single task
router.get('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!isMember(task.project_id, req.user.id))
    return res.status(403).json({ error: 'Access denied' });

  const fullTask = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(fullTask);
});

// PUT /api/tasks/:id - Update task
router.put('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!isMember(task.project_id, req.user.id))
    return res.status(403).json({ error: 'Access denied' });

  const adminUser = isAdmin(task.project_id, req.user.id);
  const isAssigned = task.assigned_to === req.user.id;

  // Members can only update status of their own tasks
  if (!adminUser && !isAssigned)
    return res.status(403).json({ error: 'You can only update tasks assigned to you' });

  let { title, description, due_date, priority, assigned_to, status } = req.body;

  // Members can only change status
  if (!adminUser) {
    title = task.title;
    description = task.description;
    due_date = task.due_date;
    priority = task.priority;
    assigned_to = task.assigned_to;
  }

  if (assigned_to && !isMember(task.project_id, assigned_to))
    return res.status(400).json({ error: 'Assigned user is not a project member' });

  db.prepare(`
    UPDATE tasks SET 
      title = ?, description = ?, due_date = ?, priority = ?, 
      assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title || task.title,
    description !== undefined ? description : task.description,
    due_date !== undefined ? due_date : task.due_date,
    priority || task.priority,
    assigned_to !== undefined ? assigned_to : task.assigned_to,
    status || task.status,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT t.*, 
      u1.name as assigned_to_name, u1.email as assigned_to_email,
      u2.name as created_by_name
    FROM tasks t
    LEFT JOIN users u1 ON u1.id = t.assigned_to
    LEFT JOIN users u2 ON u2.id = t.created_by
    WHERE t.id = ?
  `).get(req.params.id);

  res.json(updated);
});

// DELETE /api/tasks/:id - Delete task (admin only)
router.delete('/:id', authenticate, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  if (!isAdmin(task.project_id, req.user.id))
    return res.status(403).json({ error: 'Admin access required' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: 'Task deleted' });
});

module.exports = router;
