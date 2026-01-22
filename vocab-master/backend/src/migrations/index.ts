import { initialSchema } from './001_initial_schema';
import { seedAdmin } from './002_seed_admin';

export const migrations = [
    initialSchema,
    seedAdmin,
];
