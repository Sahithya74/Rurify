-- Rurify — MySQL schema reference.
-- This is a hand-maintained mirror of the Sequelize models in server/models/.
-- For local development, the app uses SQLite automatically (see server/config/db.js) and
-- creates this same shape via Sequelize's sync() — this file is for MySQL deployments and
-- for reviewing the schema without reading JS.

CREATE DATABASE IF NOT EXISTS rurify CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rurify;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('retailer', 'vendor', 'admin') NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(32),
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE regions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  state VARCHAR(255) NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE retailers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  shopName VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  regionId INT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (regionId) REFERENCES regions(id)
);

CREATE TABLE vendors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  businessName VARCHAR(255) NOT NULL,
  address VARCHAR(500) NOT NULL,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  regionId INT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  reliabilityScore FLOAT NOT NULL DEFAULT 75,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (regionId) REFERENCES regions(id)
);

CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoryId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  variety VARCHAR(255) DEFAULT '',
  description TEXT,
  imageUrl VARCHAR(500),
  unit VARCHAR(32) NOT NULL DEFAULT 'kg',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (categoryId) REFERENCES categories(id),
  UNIQUE KEY uniq_product_name_variety (name, variety),
  KEY idx_product_name (name)
);

CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  vendorId INT NOT NULL,
  quantity FLOAT NOT NULL DEFAULT 0,
  price FLOAT NOT NULL,
  moq FLOAT NOT NULL DEFAULT 1,
  freshness ENUM('FRESH', 'GOOD', 'AVERAGE') NOT NULL DEFAULT 'FRESH',
  expiryDate DATE,
  deliveryAvailable BOOLEAN NOT NULL DEFAULT TRUE,
  isActive BOOLEAN NOT NULL DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (vendorId) REFERENCES vendors(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_inventory_product_vendor (productId, vendorId)
);

CREATE TABLE inventory_update_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inventoryId INT NOT NULL,
  field VARCHAR(64) NOT NULL,
  oldValue VARCHAR(255),
  newValue VARCHAR(255),
  changeType ENUM('CREATED', 'UPDATED', 'DEACTIVATED') NOT NULL DEFAULT 'UPDATED',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (inventoryId) REFERENCES inventory(id) ON DELETE CASCADE
);

CREATE TABLE retailer_vendor_connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  retailerId INT NOT NULL,
  vendorId INT NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (retailerId) REFERENCES retailers(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  UNIQUE KEY uniq_connection (retailerId, vendorId)
);

CREATE TABLE search_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  retailerId INT NOT NULL,
  query VARCHAR(255) NOT NULL,
  productId INT,
  resultsCount INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (retailerId) REFERENCES retailers(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id),
  KEY idx_search_created (createdAt),
  KEY idx_search_product (productId)
);

CREATE TABLE demand_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  retailerId INT NOT NULL,
  productId INT NOT NULL,
  requiredQty FLOAT NOT NULL,
  requiredDate DATE,
  preferredPrice FLOAT,
  notes TEXT,
  status ENUM('PENDING', 'FULFILLED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (retailerId) REFERENCES retailers(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id),
  KEY idx_demand_status (status),
  KEY idx_demand_product (productId)
);

CREATE TABLE vendor_responses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  demandRequestId INT NOT NULL,
  vendorId INT NOT NULL,
  response ENUM('AVAILABLE', 'CAN_STOCK', 'NOT_AVAILABLE') NOT NULL,
  notes TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (demandRequestId) REFERENCES demand_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  UNIQUE KEY uniq_response (demandRequestId, vendorId)
);

CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  retailerId INT NOT NULL,
  vendorId INT NOT NULL,
  inventoryId INT NOT NULL,
  productId INT NOT NULL,
  quantity FLOAT NOT NULL,
  pricePerUnit FLOAT NOT NULL,
  totalPrice FLOAT NOT NULL,
  status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'PROCESSING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (retailerId) REFERENCES retailers(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id),
  FOREIGN KEY (inventoryId) REFERENCES inventory(id),
  FOREIGN KEY (productId) REFERENCES products(id),
  KEY idx_order_status (status),
  KEY idx_order_retailer (retailerId),
  KEY idx_order_vendor (vendorId)
);

CREATE TABLE order_status_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  status VARCHAR(32) NOT NULL,
  changedBy INT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  isRead BOOLEAN NOT NULL DEFAULT FALSE,
  relatedEntityType VARCHAR(64),
  relatedEntityId INT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_notification_user (userId),
  KEY idx_notification_read (isRead)
);

CREATE TABLE stocking_recommendations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  productId INT NOT NULL,
  vendorId INT,
  priority ENUM('HIGH_PRIORITY', 'CONSIDER_INCREASING', 'NONE') NOT NULL,
  demandScore FLOAT NOT NULL,
  reason TEXT NOT NULL,
  computedAt DATETIME NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (vendorId) REFERENCES vendors(id)
);

CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  action VARCHAR(128) NOT NULL,
  entityType VARCHAR(64),
  entityId INT,
  details TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id)
);
