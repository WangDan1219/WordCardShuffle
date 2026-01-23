import { initialSchema } from './001_initial_schema';
import { seedAdmin } from './002_seed_admin';
import { fixAdminRole } from './003_fix_admin_role';

export const migrations = [
    initialSchema,
    seedAdmin,
    fixAdminRole,
];
