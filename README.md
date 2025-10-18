# Backend_project

# Features
Bulk Upload: Import and validate products from a CSV file.
Error Reporting: Invalid rows are saved to a separate CSV for easy correction.
Paginated View: Browse all products with simple page navigation.
Search: Filter products by brand, color, or price range.
Product Management: Update and delete products by their SKU.

# Tech Stack
Node.js (Express.js framework)
MySQL (for product database)
csv-parser (for CSV reading)
multer (for file uploads)
dotenv (for environment variables)

# Create a .env file in the root folder:
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=productsdb
DB_PORT=3306


# Setup Instruction
To connect the data MySQL is used so make sure it is installed.
If not this is the link : https://dev.mysql.com/downloads/installer

# Now for creating the database:

CREATE DATABASE IF NOT EXISTS productsdb;
USE productsdb;
CREATE TABLE IF NOT EXISTS products (
  sku VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(50) NOT NULL,
  color VARCHAR(30),
  size VARCHAR(10),
  mrp DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL
);

Enable local infile support: SET GLOBAL local_infile = 1;
Start MySQL client with: "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" --local-infile=1 -u root -p
Run inside your database:  USE productsdb;

# Running the Server
node index.js

# 1. for posting 
POST /upload

# 2. Get Products (Pagination)
GET /products?page=1&limit=10

# 3. Search Products
GET /products/search?brand=XYZ&color=Red&minPrice=100&maxPrice=500

# 4. Get Product by SKU
GET /products/:sku

# 5. Update Product by SKU
PUT /products/:sku

# 6. Delete Product by SKU
DELETE /products/:sku


