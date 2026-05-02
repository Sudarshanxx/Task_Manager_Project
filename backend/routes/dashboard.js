const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard - Overall dashboard for the user
router.get('/', authenticate, (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Projects user is part of
  const projects = db.prepare(`
    SELECT p.id, p.name, pm.role FROM projects p
    JOIN project_members pm ON pm.project_id = p.id
    WHERE pm.user_id = ?
  `).all(userId);

  const projectIds = projects.map(p => p.id);
  if (projectIds.length === 0) {
    return res.json({
      totalTasks: 0,
      tasksByStatus: { todo: 0, inprogress: 0, done: 0 },
      overdueTasks: 0,
      tasksPerUser: [],
      recentTasks: [],
      projects: []
    });
  }

  const placeholders = projectIds.map(() => '?').join(',');

  const totalTasks = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE project_id IN (${placeholders})`).get(...projectIds);

  const tasksByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks
    WHERE project_id IN (${placeholders})
    GROUP BY status
  `).all(...projectIds);

  const statusMap = { todo: 0, inprogress: 0, done: 0 };
  tasksByStatus.forEach(r => { statusMap[r.status] = r.count; });

  const overdueTasks = db.prepare(`
    SELECT COUNT(*) as count FROM tasks
    WHERE project_id IN (${placeholders}) AND due_date < ? AND status != 'done'
  `).get(...projectIds, today);

  const tasksPerUser = db.prepare(`
    SELECT u.name, u.id, COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${placeholders}) AND t.assigned_to IS NOT NULL
    GROUP BY t.assigned_to
    ORDER BY task_count DESC
    LIMIT 10
  `).all(...projectIds);

  const recentTasks = db.prepare(`
    SELECT t.*, p.name as project_name, u.name as assigned_to_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    LEFT JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id IN (${placeholders})
    ORDER BY t.updated_at DESC
    LIMIT 10
  `).all(...projectIds);

  // My tasks
  const myTasks = db.prepare(`
    SELECT t.*, p.name as project_name
    FROM tasks t
    JOIN projects p ON p.id = t.project_id
    WHERE t.assigned_to = ? AND t.status != 'done'
    ORDER BY t.due_date ASC NULLS LAST
    LIMIT 5
  `).all(userId);

  res.json({
    totalTasks: totalTasks.count,
    tasksByStatus: statusMap,
    overdueTasks: overdueTasks.count,
    tasksPerUser,
    recentTasks,
    myTasks,
    projects
  });
});

// GET /api/dashboard/project/:id - Per-project stats
router.get('/project/:id', authenticate, (req, res) => {
  const projectId = req.params.id;
  const today = new Date().toISOString().split('T')[0];

  const member = db.prepare('SELECT role FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Access denied' });

  const tasksByStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status
  `).all(projectId);

  const statusMap = { todo: 0, inprogress: 0, done: 0 };
  tasksByStatus.forEach(r => { statusMap[r.status] = r.count; });

  const tasksByPriority = db.prepare(`
    SELECT priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY priority
  `).all(projectId);

  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM tasks WHERE project_id = ? AND due_date < ? AND status != 'done'
  `).get(projectId, today);

  const tasksPerUser = db.prepare(`
    SELECT u.name, u.id, COUNT(t.id) as task_count,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_count
    FROM tasks t
    JOIN users u ON u.id = t.assigned_to
    WHERE t.project_id = ? AND t.assigned_to IS NOT NULL
    GROUP BY t.assigned_to
    ORDER BY task_count DESC
  `).all(projectId);

  res.json({
    tasksByStatus: statusMap,
    tasksByPriority,
    overdueTasks: overdue.count,
    tasksPerUser
  });
});

module.exports = router;
