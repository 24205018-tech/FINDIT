/**
 * Initialize database and seed demo data
 * Run: node config/initDb.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'findit',
    password: process.env.DB_PASSWORD || 'findit123',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true,
  });

  const dbName = process.env.DB_NAME || 'findit_db';
  console.log(`Creating database ${dbName} if not exists...`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
  await connection.query(`USE \`${dbName}\`;`);

  console.log('Creating tables...');

  // Users
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      phone VARCHAR(20),
      password VARCHAR(255) NOT NULL,
      role ENUM('student','admin') DEFAULT 'student',
      photo VARCHAR(255) DEFAULT '',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  // Items
  await connection.query(`
    CREATE TABLE IF NOT EXISTS items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      kind ENUM('lost','found') NOT NULL,
      user_id INT NOT NULL,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT NOT NULL,
      colour VARCHAR(50) DEFAULT '—',
      brand VARCHAR(100) DEFAULT '—',
      location VARCHAR(200) NOT NULL,
      date DATE NOT NULL,
      time TIME NULL,
      image VARCHAR(100) DEFAULT '',
      image_preview LONGTEXT,
      details TEXT,
      status ENUM('Active','Reported','Claimed','Recovered') DEFAULT 'Active',
      secret_question VARCHAR(255),
      secret_answer VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_kind (kind),
      INDEX idx_user (user_id),
      INDEX idx_category (category),
      INDEX idx_status (status)
    ) ENGINE=InnoDB;
  `);

  // Claims
  await connection.query(`
    CREATE TABLE IF NOT EXISTS claims (
      id INT AUTO_INCREMENT PRIMARY KEY,
      item_id INT NOT NULL,
      item_kind ENUM('lost','found') DEFAULT 'found',
      user_id INT NOT NULL,
      reason TEXT NOT NULL,
      hidden_detail TEXT NOT NULL,
      additional_info TEXT,
      proof_name VARCHAR(255),
      proof_preview LONGTEXT,
      status ENUM('Pending','Under Review','Approved','Rejected') DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_item (item_id),
      INDEX idx_user (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB;
  `);

  // Notifications
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('match','claim','info','system') DEFAULT 'info',
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user (user_id),
      INDEX idx_read (is_read)
    ) ENGINE=InnoDB;
  `);

  console.log('Tables created.');

  // Seed if empty
  const [users] = await connection.query('SELECT COUNT(*) as cnt FROM users');
  if (users[0].cnt === 0) {
    console.log('Seeding users...');
    const hashedStudent = await bcrypt.hash('student123', 10);
    const hashedAdmin = await bcrypt.hash('admin123', 10);

    const seedUsers = [
      ['Arjun Sharma', 'arjun@student.edu', '+91 98201 44567', hashedStudent, 'student'],
      ['Priya Nair', 'priya@student.edu', '+91 99870 12348', hashedStudent, 'student'],
      ['Rahul Verma', 'rahul@student.edu', '+91 91670 88912', hashedStudent, 'student'],
      ['Sneha Iyer', 'sneha@student.edu', '+91 98190 33456', hashedStudent, 'student'],
      ['Kabir Malhotra', 'kabir@student.edu', '+91 90040 77123', hashedStudent, 'student'],
      ['Ananya Gupta', 'ananya@student.edu', '+91 96190 22110', hashedStudent, 'student'],
      ['Vikram Rathore', 'vikram@student.edu', '+91 97699 55443', hashedStudent, 'student'],
      ['Meera Krishnan', 'meera@student.edu', '+91 88790 66554', hashedStudent, 'student'],
      ['Rohan Deshpande', 'rohan@student.edu', '+91 98220 90909', hashedStudent, 'student'],
      ['Divya Menon', 'divya@student.edu', '+91 97020 80808', hashedStudent, 'student'],
      ['Dr. S. Kulkarni', 'admin@findit.edu', '+91 98220 10001', hashedAdmin, 'admin'],
    ];

    for (const u of seedUsers) {
      await connection.query('INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)', u);
    }
    console.log(`Seeded ${seedUsers.length} users.`);
  }

  const [itemsCount] = await connection.query('SELECT COUNT(*) as cnt FROM items');
  if (itemsCount[0].cnt === 0) {
    console.log('Seeding items...');
    // Fetch user ids
    const [allUsers] = await connection.query('SELECT id,email FROM users');
    const userMap = {};
    allUsers.forEach(u => userMap[u.email] = u.id);

    const lostItems = [
      ['lost','Black Noise Smartwatch','Watch','Black Noise ColorFit Pro 5 smartwatch with a slightly scratched screen and a dark grey silicone strap.','Black','Noise','College Library','2026-09-06','14:30:00','watch','','Watch face shows a fitness tracker wallpaper; screen protector is peeling at the top corner.','Active', userMap['arjun@student.edu']],
      ['lost','Blue American Tourister Bag','Bag','Mid-size American Tourister backpack in navy blue with a small white scratch near the zipper.','Blue','American Tourister','Canteen','2026-09-05','12:45:00','bag','','Zipper pull on the main pocket is wrapped with black thread.','Active', userMap['arjun@student.edu']],
      ['lost','White AirPods Pro Case','Earbuds','White Apple AirPods Pro charging case, clean white with tiny engraving of initials on the lid.','White','Apple','Block C — Seminar Hall','2026-09-04','16:00:00','earbuds','','Engraved with the initials AS in small silver font.','Active', userMap['arjun@student.edu']],
      ['lost','Black Leather Wallet','Wallet','Black leather bifold wallet with a metal clip. Held my student ID, a metro card and around ₹400 in cash.','Black','Hidesign','Main Building Lobby','2026-09-03','10:15:00','wallet','','Metro card has a small blue corner sticker on the back.','Active', userMap['sneha@student.edu']],
      ['lost','Silver HP Laptop','Laptop','HP Pavilion silver laptop, 14 inch, with a Dell sticker on the lid beside the HP logo.','Silver','HP','Block B — Room 204','2026-09-02','11:00:00','laptop','','Wallpaper is a purple mountain photo. Left hinge is slightly loose.','Recovered', userMap['kabir@student.edu']],
      ['lost','Grey Sweatshirt','Other','Grey cotton sweatshirt with a small hood, brand new, with a navy blue logo patch.','Grey','Nike','Sports Ground','2026-08-30','17:30:00','hoodie','','Tag still attached when lost.','Recovered', userMap['arjun@student.edu']],
      ['lost','OnePlus Bullets Earbuds','Earbuds','OnePlus Bullets Z2 wired earbuds in red with black inline remote.','Red','OnePlus','Central Library','2026-08-28','15:10:00','earbuds','','Inline remote has a tiny scratch.','Active', userMap['vikram@student.edu']],
      ['lost','House Keys with Blue Fob','Keys','Three keys on a ring with a round blue plastic fob. The biggest key has a chipped tip.','Blue','—','Parking Lot','2026-08-25','18:00:00','keys','','Blue fob has a white star printed on it.','Active', userMap['meera@student.edu']],
    ];

    const foundItems = [
      ['found','Black Smartwatch','Watch','Black smartwatch with a touchscreen and a dark silicone strap, found on a table near the reading area.','Black','Noise','College Library','2026-09-06','17:15:00','watch','','Screen had a small crack at the top corner. Kept in the library lost box.','Reported', userMap['rohan@student.edu']],
      ['found','Blue Laptop Bag','Bag','Blue laptop backpack with a separate padded laptop compartment, found under a bench in the canteen.','Blue','American Tourister','Canteen','2026-09-05','13:20:00','bag','','Front pocket zipper has white paint marks.','Reported', userMap['divya@student.edu']],
      ['found','White Earbud Case','Earbuds','White wireless earbud case, empty when found, lying near the projector table.','White','Apple','Block C — Seminar Hall','2026-09-04','17:40:00','earbuds','','Lid is engraved with the initials AS.','Reported', userMap['priya@student.edu']],
      ['found','Black Wallet','Wallet','Black leather bifold wallet found on the floor near the reception desk.','Black','Hidesign','Main Building Lobby','2026-09-03','11:00:00','wallet','','Contains an ID card and a metro card with a blue sticker.','Reported', userMap['priya@student.edu']],
      ['found','Silver Laptop','Laptop','Silver 14-inch laptop left on the desk of Room 204 after the morning batch.','Silver','HP','Block B — Room 204','2026-09-02','12:10:00','laptop','','A small sticker near the trackpad.','Recovered', userMap['rahul@student.edu']],
      ['found','Grey Sweatshirt','Other','Grey hooded sweatshirt with a blue chest logo, found on a bench near the scoreboard.','Grey','Nike','Sports Ground','2026-08-30','18:00:00','hoodie','','Unworn, tag attached.','Recovered', userMap['sneha@student.edu']],
    ];

    for (const it of [...lostItems, ...foundItems]) {
      // it structure: [kind,title,category,description,colour,brand,location,date,time,image,image_preview,details,status,user_id]
      await connection.query(
        `INSERT INTO items (kind,title,category,description,colour,brand,location,date,time,image,image_preview,details,status,user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        it
      );
    }
    console.log(`Seeded ${lostItems.length + foundItems.length} items.`);
  }

  const [claimsCount] = await connection.query('SELECT COUNT(*) as cnt FROM claims');
  if (claimsCount[0].cnt === 0) {
    console.log('Seeding claims...');
    const [items] = await connection.query('SELECT id,title FROM items LIMIT 5');
    const [users] = await connection.query('SELECT id,email FROM users WHERE email="arjun@student.edu"');
    if (items.length >= 2 && users.length) {
      await connection.query(
        `INSERT INTO claims (item_id,item_kind,user_id,reason,hidden_detail,status) VALUES (?,?,?,?,?,?)`,
        [items[0].id, 'found', users[0].id, 'The black Noise smartwatch found in the library is mine — I lost it around 2:30 PM while studying near the reading area.', 'The watch face shows the name Arjun on the fitness wallpaper.', 'Under Review']
      );
      await connection.query(
        `INSERT INTO claims (item_id,item_kind,user_id,reason,hidden_detail,status) VALUES (?,?,?,?,?,?)`,
        [items[1].id, 'found', users[0].id, 'The white earbud case found in the Block C seminar hall is my AirPods Pro case.', 'The lid is engraved with the initials AS in small silver letters.', 'Pending']
      );
    }
    console.log('Seeded claims.');
  }

  const [notifCount] = await connection.query('SELECT COUNT(*) as cnt FROM notifications');
  if (notifCount[0].cnt === 0) {
    console.log('Seeding notifications...');
    const [users] = await connection.query('SELECT id,email FROM users WHERE email="arjun@student.edu"');
    if (users.length) {
      const uid = users[0].id;
      const notifs = [
        [uid, 'match', '🔥 91% possible match — your lost Black Noise Smartwatch may match a smartwatch found at the College Library.'],
        [uid, 'claim', 'Your claim for the Black Noise Smartwatch is now Under Review.'],
        [uid, 'match', 'Two new possible matches were found for your reports in the last 24 hours.'],
        [uid, 'info', 'Tip: adding more identifying details improves your match accuracy by up to 30%.'],
        [uid, 'system', 'Welcome to FindIt, Arjun! Start by reporting an item or searching the campus lost & found.'],
      ];
      for (const n of notifs) {
        await connection.query('INSERT INTO notifications (user_id,type,message) VALUES (?,?,?)', n);
      }
    }
    console.log('Seeded notifications.');
  }

  console.log('✅ Database initialization complete.');
  await connection.end();
  process.exit(0);
}

init().catch(err => {
  console.error('Init failed:', err);
  process.exit(1);
});
