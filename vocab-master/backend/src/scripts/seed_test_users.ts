
import { db } from '../config/database';
import bcrypt from 'bcryptjs';

const parentUser = 'testParent';
const studentUser = 'testStudent';
const password = 'password123';
const hash = bcrypt.hashSync(password, 12);

console.log('Seeding test users...');

// 1. Create Parent
let parent = db.prepare('SELECT id FROM users WHERE username = ?').get(parentUser) as { id: number } | undefined;
if (!parent) {
    const info = db.prepare(`
        INSERT INTO users (username, password_hash, display_name, role)
        VALUES (?, ?, 'Test Parent', 'parent')
    `).run(parentUser, hash);
    parent = { id: Number(info.lastInsertRowid) };
    console.log(`Created ${parentUser} with ID ${parent.id}`);
} else {
    // Update password just in case
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, parent.id);
    console.log(`Updated ${parentUser} password`);
}

// 2. Create Student
let student = db.prepare('SELECT id FROM users WHERE username = ?').get(studentUser) as { id: number } | undefined;
if (!student) {
    const info = db.prepare(`
        INSERT INTO users (username, password_hash, display_name, role, parent_id)
        VALUES (?, ?, 'Test Student', 'student', ?)
    `).run(studentUser, hash, parent.id);
    student = { id: Number(info.lastInsertRowid) };
    console.log(`Created ${studentUser} with ID ${student.id} linked to parent ${parent.id}`);

    // Init stats for student
    db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').run(student.id);
} else {
    // Update parent link and password
    db.prepare('UPDATE users SET parent_id = ?, password_hash = ? WHERE id = ?').run(parent.id, hash, student.id);
    console.log(`Updated ${studentUser} to be child of ${parentUser}`);
}

console.log('Done.');
