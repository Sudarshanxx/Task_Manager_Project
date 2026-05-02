const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

// Helper: check if user is admin of project
const isAdmin = (projectId, userId) => {
  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return member && member.role === 'admin';
};

// Helper: check if user is member of project
const isMember = (projectId, userId) => {
  const member = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId);
  return !!member;
};

// GET /api/projects - Get all projects for current user
router.get('/', authenticate, (req, res) => {
  const projects = db.prepare(`
    SELECT p.*, pm.role, u.name as creator_name,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
      (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    JOIN users u ON u.id = p.created_by
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(projects);
});

// POST /api/projects - Create a project
router.post('/', authenticate, (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  const result = db.prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)').run(name, description || '', req.user.id);
  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'admin');

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...project, role: 'admin' });
});

// GET /api/projects/:id - Get single project
router.get('/:id', authenticate, (req, res) => {
  if (!isMember(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Access denied' });

  const project = db.prepare(`
    SELECT p.*, pm.role, u.name as creator_name
    FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    JOIN users u ON u.id = p.created_by
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.id, req.user.id);

  if (!project) return res.status(404).json({ error: 'Project not found' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM users u
    JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(req.params.id);

  res.json({ ...project, members });
});

// PUT /api/projects/:id - Update project (admin only)
router.put('/:id', authenticate, (req, res) => {
  if (!isAdmin(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Admin access required' });

  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });

  db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?').run(name, description || '', req.params.id);
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json(project);
});

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', authenticate, (req, res) => {
  if (!isAdmin(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Admin access required' });

  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: 'Project deleted' });
});

// POST /api/projects/:id/members - Add member (admin only)
router.post('/:id/members', authenticate, (req, res) => {
  if (!isAdmin(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Admin access required' });

  const { email, role } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const existing = db.prepare('SELECT id FROM project_members WHERE project_id = ? AND user_id = ?').get(req.params.id, user.id);
  if (existing) return res.status(409).json({ error: 'User is already a member' });

  db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(req.params.id, user.id, role || 'member');
  res.status(201).json({ ...user, role: role || 'member' });
});

// DELETE /api/projects/:id/members/:userId - Remove member (admin only)
router.delete('/:id/members/:userId', authenticate, (req, res) => {
  if (!isAdmin(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Admin access required' });

  if (parseInt(req.params.userId) === req.user.id)
    return res.status(400).json({ error: 'Cannot remove yourself from project' });

  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(req.params.id, req.params.userId);
  res.json({ message: 'Member removed' });
});

// GET /api/projects/:id/members - List members
router.get('/:id/members', authenticate, (req, res) => {
  if (!isMember(req.params.id, req.user.id))
    return res.status(403).json({ error: 'Access denied' });

  const members = db.prepare(`
    SELECT u.id, u.name, u.email, pm.role, pm.joined_at
    FROM users u
    JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, u.name ASC
  `).all(req.params.id);

  res.json(members);
});

module.exports = router;
