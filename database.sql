/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.6-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: findit_db
-- ------------------------------------------------------
-- Server version	11.8.6-MariaDB-0+deb13u1 from Debian

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `claims`
--

DROP TABLE IF EXISTS `claims`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `claims` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `item_kind` enum('lost','found') DEFAULT 'found',
  `user_id` int(11) NOT NULL,
  `reason` text NOT NULL,
  `hidden_detail` text NOT NULL,
  `additional_info` text DEFAULT NULL,
  `proof_name` varchar(255) DEFAULT NULL,
  `proof_preview` longtext DEFAULT NULL,
  `status` enum('Pending','Under Review','Approved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_item` (`item_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `claims_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `claims_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claims`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `claims` WRITE;
/*!40000 ALTER TABLE `claims` DISABLE KEYS */;
INSERT INTO `claims` VALUES
(1,1,'found',1,'The black Noise smartwatch found in the library is mine — I lost it around 2:30 PM while studying near the reading area.','The watch face shows the name Arjun on the fitness wallpaper.',NULL,NULL,NULL,'Under Review','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(2,2,'found',1,'The white earbud case found in the Block C seminar hall is my AirPods Pro case.','The lid is engraved with the initials AS in small silver letters.',NULL,NULL,NULL,'Pending','2026-09-22 16:03:32','2026-09-22 16:03:32');
/*!40000 ALTER TABLE `claims` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kind` enum('lost','found') NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `category` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `colour` varchar(50) DEFAULT '—',
  `brand` varchar(100) DEFAULT '—',
  `location` varchar(200) NOT NULL,
  `date` date NOT NULL,
  `time` time DEFAULT NULL,
  `image` varchar(100) DEFAULT '',
  `image_preview` longtext DEFAULT NULL,
  `details` text DEFAULT NULL,
  `status` enum('Active','Reported','Claimed','Recovered') DEFAULT 'Active',
  `secret_question` varchar(255) DEFAULT NULL,
  `secret_answer` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_kind` (`kind`),
  KEY `idx_user` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(1,'lost',1,'Black Noise Smartwatch','Watch','Black Noise ColorFit Pro 5 smartwatch with a slightly scratched screen and a dark grey silicone strap.','Black','Noise','College Library','2026-09-06','14:30:00','watch','','Watch face shows a fitness tracker wallpaper; screen protector is peeling at the top corner.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(2,'lost',1,'Blue American Tourister Bag','Bag','Mid-size American Tourister backpack in navy blue with a small white scratch near the zipper.','Blue','American Tourister','Canteen','2026-09-05','12:45:00','bag','','Zipper pull on the main pocket is wrapped with black thread.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(3,'lost',1,'White AirPods Pro Case','Earbuds','White Apple AirPods Pro charging case, clean white with tiny engraving of initials on the lid.','White','Apple','Block C — Seminar Hall','2026-09-04','16:00:00','earbuds','','Engraved with the initials AS in small silver font.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(4,'lost',4,'Black Leather Wallet','Wallet','Black leather bifold wallet with a metal clip. Held my student ID, a metro card and around ₹400 in cash.','Black','Hidesign','Main Building Lobby','2026-09-03','10:15:00','wallet','','Metro card has a small blue corner sticker on the back.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(5,'lost',5,'Silver HP Laptop','Laptop','HP Pavilion silver laptop, 14 inch, with a Dell sticker on the lid beside the HP logo.','Silver','HP','Block B — Room 204','2026-09-02','11:00:00','laptop','','Wallpaper is a purple mountain photo. Left hinge is slightly loose.','Recovered',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(6,'lost',1,'Grey Sweatshirt','Other','Grey cotton sweatshirt with a small hood, brand new, with a navy blue logo patch.','Grey','Nike','Sports Ground','2026-08-30','17:30:00','hoodie','','Tag still attached when lost.','Recovered',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(7,'lost',7,'OnePlus Bullets Earbuds','Earbuds','OnePlus Bullets Z2 wired earbuds in red with black inline remote.','Red','OnePlus','Central Library','2026-08-28','15:10:00','earbuds','','Inline remote has a tiny scratch.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(8,'lost',8,'House Keys with Blue Fob','Keys','Three keys on a ring with a round blue plastic fob. The biggest key has a chipped tip.','Blue','—','Parking Lot','2026-08-25','18:00:00','keys','','Blue fob has a white star printed on it.','Active',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(9,'found',9,'Black Smartwatch','Watch','Black smartwatch with a touchscreen and a dark silicone strap, found on a table near the reading area.','Black','Noise','College Library','2026-09-06','17:15:00','watch','','Screen had a small crack at the top corner. Kept in the library lost box.','Reported',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(10,'found',10,'Blue Laptop Bag','Bag','Blue laptop backpack with a separate padded laptop compartment, found under a bench in the canteen.','Blue','American Tourister','Canteen','2026-09-05','13:20:00','bag','','Front pocket zipper has white paint marks.','Reported',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(11,'found',2,'White Earbud Case','Earbuds','White wireless earbud case, empty when found, lying near the projector table.','White','Apple','Block C — Seminar Hall','2026-09-04','17:40:00','earbuds','','Lid is engraved with the initials AS.','Reported',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(12,'found',2,'Black Wallet','Wallet','Black leather bifold wallet found on the floor near the reception desk.','Black','Hidesign','Main Building Lobby','2026-09-03','11:00:00','wallet','','Contains an ID card and a metro card with a blue sticker.','Reported',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(13,'found',3,'Silver Laptop','Laptop','Silver 14-inch laptop left on the desk of Room 204 after the morning batch.','Silver','HP','Block B — Room 204','2026-09-02','12:10:00','laptop','','A small sticker near the trackpad.','Recovered',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32'),
(14,'found',4,'Grey Sweatshirt','Other','Grey hooded sweatshirt with a blue chest logo, found on a bench near the scoreboard.','Grey','Nike','Sports Ground','2026-08-30','18:00:00','hoodie','','Unworn, tag attached.','Recovered',NULL,NULL,'2026-09-22 16:03:32','2026-09-22 16:03:32');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('match','claim','info','system') DEFAULT 'info',
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES
(1,1,'match','🔥 91% possible match — your lost Black Noise Smartwatch may match a smartwatch found at the College Library.',0,'2026-09-22 16:03:32'),
(2,1,'claim','Your claim for the Black Noise Smartwatch is now Under Review.',0,'2026-09-22 16:03:32'),
(3,1,'match','Two new possible matches were found for your reports in the last 24 hours.',0,'2026-09-22 16:03:32'),
(4,1,'info','Tip: adding more identifying details improves your match accuracy by up to 30%.',0,'2026-09-22 16:03:32'),
(5,1,'system','Welcome to FindIt, Arjun! Start by reporting an item or searching the campus lost & found.',0,'2026-09-22 16:03:32'),
(6,9,'claim','New claim submitted for your Black Smartwatch by Test User.',0,'2026-09-22 16:06:25');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('student','admin') DEFAULT 'student',
  `photo` varchar(255) DEFAULT '',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Arjun Sharma','arjun@student.edu','+91 98201 44567','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(2,'Priya Nair','priya@student.edu','+91 99870 12348','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(3,'Rahul Verma','rahul@student.edu','+91 91670 88912','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(4,'Sneha Iyer','sneha@student.edu','+91 98190 33456','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(5,'Kabir Malhotra','kabir@student.edu','+91 90040 77123','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(6,'Ananya Gupta','ananya@student.edu','+91 96190 22110','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(7,'Vikram Rathore','vikram@student.edu','+91 97699 55443','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(8,'Meera Krishnan','meera@student.edu','+91 88790 66554','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(9,'Rohan Deshpande','rohan@student.edu','+91 98220 90909','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(10,'Divya Menon','divya@student.edu','+91 97020 80808','$2a$10$rcfPSVFGPCxPXJohQflLZ.eyyzgb8cM09Fg1lAHwcrb6llEb7ozzu','student','','2026-09-22 16:03:32','2026-09-22 16:03:32'),
(11,'Dr. S. Kulkarni','admin@findit.edu','+91 98220 10001','$2a$10$cO8MHdxsp83ajfkkLkaB0.7uPckeUg7pl3kfCBdPVveEMhQ4Q8I.S','admin','','2026-09-22 16:03:32','2026-09-22 16:03:32');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-09-22 17:01:11
