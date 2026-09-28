/**
 * In-memory mock store — used when MySQL is not available
 * Makes the project runnable without any MySQL installation
 * Data persists in memory until server restart
 */
const bcrypt = require('bcryptjs');

let users = [];
let items = [];
let claims = [];
let notifications = [];
let nextUserId = 1;
let nextItemId = 1;
let nextClaimId = 1;
let nextNotifId = 1;

async function initMock() {
  if (users.length > 0) return;
  const hashedStudent = await bcrypt.hash('student123', 10);
  const hashedAdmin = await bcrypt.hash('admin123', 10);
  
  const seedUsers = [
    { name: 'Arjun Sharma', email: 'arjun@student.edu', phone: '+91 98201 44567', password: hashedStudent, role: 'student' },
    { name: 'Priya Nair', email: 'priya@student.edu', phone: '+91 99870 12348', password: hashedStudent, role: 'student' },
    { name: 'Rahul Verma', email: 'rahul@student.edu', phone: '+91 91670 88912', password: hashedStudent, role: 'student' },
    { name: 'Sneha Iyer', email: 'sneha@student.edu', phone: '+91 98190 33456', password: hashedStudent, role: 'student' },
    { name: 'Kabir Malhotra', email: 'kabir@student.edu', phone: '+91 90040 77123', password: hashedStudent, role: 'student' },
    { name: 'Ananya Gupta', email: 'ananya@student.edu', phone: '+91 96190 22110', password: hashedStudent, role: 'student' },
    { name: 'Vikram Rathore', email: 'vikram@student.edu', phone: '+91 97699 55443', password: hashedStudent, role: 'student' },
    { name: 'Meera Krishnan', email: 'meera@student.edu', phone: '+91 88790 66554', password: hashedStudent, role: 'student' },
    { name: 'Rohan Deshpande', email: 'rohan@student.edu', phone: '+91 98220 90909', password: hashedStudent, role: 'student' },
    { name: 'Divya Menon', email: 'divya@student.edu', phone: '+91 97020 80808', password: hashedStudent, role: 'student' },
    { name: 'Dr. S. Kulkarni', email: 'admin@findit.edu', phone: '+91 98220 10001', password: hashedAdmin, role: 'admin' },
  ];
  
  seedUsers.forEach(u => {
    users.push({ id: nextUserId++, ...u, photo: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  });

  const lost = [
    { kind: 'lost', title: 'Black Noise Smartwatch', category: 'Watch', description: 'Black Noise ColorFit Pro 5 smartwatch', colour: 'Black', brand: 'Noise', location: 'College Library', date: '2026-09-06', time: '14:30:00', image: 'watch', details: 'Screen peeling at top corner', status: 'Active', user_id: 1 },
    { kind: 'lost', title: 'Blue American Tourister Bag', category: 'Bag', description: 'Navy blue backpack', colour: 'Blue', brand: 'American Tourister', location: 'Canteen', date: '2026-09-05', time: '12:45:00', image: 'bag', details: 'Zipper wrapped with black thread', status: 'Active', user_id: 1 },
    { kind: 'lost', title: 'White AirPods Pro Case', category: 'Earbuds', description: 'White Apple AirPods Pro case', colour: 'White', brand: 'Apple', location: 'Block C — Seminar Hall', date: '2026-09-04', time: '16:00:00', image: 'earbuds', details: 'Engraved AS', status: 'Active', user_id: 1 },
  ];
  const found = [
    { kind: 'found', title: 'Black Smartwatch', category: 'Watch', description: 'Black smartwatch found', colour: 'Black', brand: 'Noise', location: 'College Library', date: '2026-09-06', time: '17:15:00', image: 'watch', details: 'Kept in lost box', status: 'Reported', user_id: 9 },
    { kind: 'found', title: 'Blue Laptop Bag', category: 'Bag', description: 'Blue backpack found', colour: 'Blue', brand: 'American Tourister', location: 'Canteen', date: '2026-09-05', time: '13:20:00', image: 'bag', details: 'White paint marks', status: 'Reported', user_id: 10 },
  ];
  
  [...lost, ...found].forEach(it => {
    items.push({ id: nextItemId++, ...it, image_preview: '', secret_question: null, secret_answer: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  });

  notifications.push({ id: nextNotifId++, user_id: 1, type: 'match', message: '🔥 91% possible match — your lost Black Noise Smartwatch may match a smartwatch found at the College Library.', is_read: false, created_at: new Date().toISOString() });
  notifications.push({ id: nextNotifId++, user_id: 1, type: 'system', message: 'Welcome to FindIt, Arjun!', is_read: false, created_at: new Date().toISOString() });
}

module.exports = {
  users, items, claims, notifications,
  getNextUserId: () => nextUserId++,
  getNextItemId: () => nextItemId++,
  getNextClaimId: () => nextClaimId++,
  getNextNotifId: () => nextNotifId++,
  initMock,
};
