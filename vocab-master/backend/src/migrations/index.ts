import { initialSchema } from './001_initial_schema';
import { seedAdmin } from './002_seed_admin';
import { fixAdminRole } from './003_fix_admin_role';
import { updateUsersSchema } from './004_update_users_schema';
import { repairFks } from './005_repair_fks';

export const migrations = [
    initialSchema,
    seedAdmin,
    fixAdminRole,
    updateUsersSchema,
    repairFks,
];
