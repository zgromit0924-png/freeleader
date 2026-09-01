import { env } from 'cloudflare:workers';

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT, created_at INTEGER NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, leader_user_id TEXT NOT NULL, name TEXT NOT NULL, course TEXT NOT NULL, assignment_description TEXT NOT NULL, final_deadline INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'draft', ai_allowed INTEGER NOT NULL DEFAULT 1, allow_external_research INTEGER NOT NULL DEFAULT 0, need_ai_disclosure INTEGER NOT NULL DEFAULT 1, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (leader_user_id) REFERENCES users(id))`,
  `CREATE INDEX IF NOT EXISTS idx_projects_leader ON projects(leader_user_id)`,
  `CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT, role TEXT NOT NULL DEFAULT 'member', created_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_members_project ON members(project_id)`,
  `CREATE TABLE IF NOT EXISTS project_plans (id TEXT PRIMARY KEY, project_id TEXT NOT NULL UNIQUE, outline_json TEXT NOT NULL, work_packages_json TEXT NOT NULL, assignment_understanding_json TEXT NOT NULL, assembly_rules_json TEXT NOT NULL, assignment_mode TEXT NOT NULL DEFAULT 'claim', generated_by TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS leader_links (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_leader_links_project ON leader_links(project_id)`,
  `CREATE TABLE IF NOT EXISTS member_links (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at INTEGER, revoked_at INTEGER, created_at INTEGER NOT NULL, FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, owner_member_id TEXT, title TEXT NOT NULL, goal TEXT NOT NULL, expected_output TEXT NOT NULL, acceptance_criteria_json TEXT NOT NULL, personal_deadline INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'assigned', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, FOREIGN KEY (owner_member_id) REFERENCES members(id))`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON tasks(project_id, status)`,
  `CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, uploader_member_id TEXT, object_key TEXT NOT NULL, original_name TEXT NOT NULL, content_type TEXT NOT NULL, size_bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE, FOREIGN KEY (uploader_member_id) REFERENCES members(id))`,
  `CREATE INDEX IF NOT EXISTS idx_files_sha256 ON files(sha256)`,
  `CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, task_id TEXT NOT NULL, member_id TEXT NOT NULL, version INTEGER NOT NULL, content TEXT NOT NULL DEFAULT '', file_id TEXT, submitted_at INTEGER NOT NULL, UNIQUE(task_id, version), FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE, FOREIGN KEY (member_id) REFERENCES members(id), FOREIGN KEY (file_id) REFERENCES files(id))`,
  `CREATE TABLE IF NOT EXISTS review_results (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL, status TEXT NOT NULL, score REAL NOT NULL, summary TEXT NOT NULL, criteria_results_json TEXT NOT NULL, risk_flags_json TEXT NOT NULL, model_name TEXT, created_at INTEGER NOT NULL, FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE)`,
  `CREATE TABLE IF NOT EXISTS audit_log (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, actor_type TEXT NOT NULL, actor_id TEXT, action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, metadata_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_project_time ON audit_log(project_id, created_at)`,
];

export function getBindings() {
  const bindings = env as Cloudflare.Env & { DB: D1Database; FILES?: R2Bucket; OPENAI_API_KEY?: string; OPENAI_MODEL?: string };
  if (!bindings.DB) throw new Error('数据库尚未绑定。');
  return bindings;
}

export async function ensureDatabase() {
  const { DB } = getBindings();
  await DB.batch(schemaStatements.map((statement) => DB.prepare(statement)));
  await DB.prepare('PRAGMA optimize').run();
}

export async function sha256Hex(value: string | ArrayBuffer) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function seedDemoProject() {
  await ensureDatabase();
  const { DB } = getBindings();
  const now = Date.now();
  const tokenHash = await sha256Hex('demo-chenyi');
  await DB.batch([
    DB.prepare(`INSERT OR IGNORE INTO users (id, email, display_name, created_at) VALUES (?, ?, ?, ?)`).bind('demo-leader', 'demo@freeleader.local', '张家瑜', now),
    DB.prepare(`INSERT OR IGNORE INTO projects (id, leader_user_id, name, course, assignment_description, final_deadline, status, ai_allowed, allow_external_research, need_ai_disclosure, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('project-iflytek-demo', 'demo-leader', '科大讯飞资产质量与资本结构分析', '财务报表分析', '从资产质量和资本结构两个角度分析一家上市公司，并进行行业对比。', Date.parse('2026-09-02T20:00:00+08:00'), 'collecting', 1, 0, 1, now, now),
    DB.prepare(`INSERT OR IGNORE INTO members (id, project_id, name, role, created_at) VALUES (?, ?, ?, ?, ?)`).bind('member-demo-chenyi', 'project-iflytek-demo', '陈一', 'member', now),
    DB.prepare(`INSERT OR IGNORE INTO member_links (id, member_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`).bind('link-demo-chenyi', 'member-demo-chenyi', tokenHash, Date.parse('2026-10-01T00:00:00+08:00'), now),
    DB.prepare(`INSERT OR IGNORE INTO tasks (id, project_id, owner_member_id, title, goal, expected_output, acceptance_criteria_json, personal_deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind('task-receivables', 'project-iflytek-demo', 'member-demo-chenyi', '应收账款深度分析', '评价应收账款的真实性、周转性和保值性。', '1200–1500 字 + 3 张图表', JSON.stringify(['覆盖规模、账龄、周转率与减值政策', '所有金额注明单位、年份和来源', '至少选取 2 家可比公司', '结论区分事实、解释与建议']), Date.parse('2026-09-01T22:00:00+08:00'), 'revision_required', now, now),
  ]);
}
