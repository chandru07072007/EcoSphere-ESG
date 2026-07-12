// MongoDB initialization script — runs once on first container start
db = db.getSiblingDB('ecosphere');

db.createCollection('users');
db.createCollection('departments');
db.createCollection('categories');
db.createCollection('emission_factors');
db.createCollection('carbon_transactions');
db.createCollection('csr_activities');
db.createCollection('challenges');
db.createCollection('challenge_participations');
db.createCollection('badges');
db.createCollection('employee_badges');
db.createCollection('rewards');
db.createCollection('reward_redemptions');
db.createCollection('compliance_issues');
db.createCollection('policies');
db.createCollection('policy_acknowledgements');
db.createCollection('audits');
db.createCollection('notifications');
db.createCollection('settings');
db.createCollection('product_esg_profiles');
db.createCollection('environmental_goals');

// Indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.departments.createIndex({ code: 1 }, { unique: true });
db.carbon_transactions.createIndex({ department_id: 1, date: -1 });
db.compliance_issues.createIndex({ due_date: 1, status: 1 });
db.notifications.createIndex({ recipient_id: 1, read: 1, created_at: -1 });

print('EcoSphere MongoDB initialized successfully.');
