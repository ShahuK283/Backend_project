
//importing required modules
const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('./database');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

// Uploading and processing CSV file

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;
  const valid = [];
  const failed = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      try {
        const { sku, name, brand, color, size, mrp, price, quantity } = row;

        // Basic validation
        if (!sku || !name || !brand || !mrp || !price)
          throw new Error('Missing required fields');

        const mrpNum = parseFloat(mrp);
        const priceNum = parseFloat(price);
        const quantityNum = parseInt(quantity);

        if (isNaN(mrpNum) || isNaN(priceNum))
          throw new Error('Invalid numeric values');
        if (priceNum > mrpNum)
          throw new Error('Price > MRP');
        if (quantityNum < 0)
          throw new Error('Negative quantity');

        valid.push([sku, name, brand, color, size, mrpNum, priceNum, quantityNum]);
      } catch (err) {
        failed.push({ ...row, reason: err.message });
      }
    })
    .on('end', () => {
      let failedFile = null;

      // Save failed rows to a CSV
      if (failed.length > 0) {
        failedFile = path.join('uploads', `failed_rows_${Date.now()}.csv`);
        const header = Object.keys(failed[0]).join(',') + '\n';
        const rows = failed.map(r => Object.values(r).join(',')).join('\n');
        fs.writeFileSync(failedFile, header + rows);
      }

      // Insert valid rows into DB
      if (valid.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          error: 'No valid rows to insert',
          failedFile
        });
      }

      const query = `
        INSERT INTO products
        (sku, name, brand, color, size, mrp, price, quantity)
        VALUES ?`;

      db.query(query, [valid], (err) => {
        fs.unlinkSync(filePath);
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Database insert failed', details: err });
        }
        res.json({
          stored: valid.length,
          failed: failed.length,
          failedFile
        });
      });
    });
});

// GET PRODUCTS WITH PAGINATION
app.get('/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const query = 'SELECT * FROM products LIMIT ? OFFSET ?';
  db.query(query, [limit, offset], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json({
      page,
      limit,
      total: results.length,
      data: results
    });
  });
});

// SEARCH PRODUCTS
app.get('/products/search', (req, res) => {
  const { brand, color, minPrice, maxPrice } = req.query;
  const conditions = [];
  const params = [];

  if (brand) { conditions.push('brand = ?'); params.push(brand); }
  if (color) { conditions.push('color = ?'); params.push(color); }
  if (minPrice) { conditions.push('price >= ?'); params.push(parseFloat(minPrice)); }
  if (maxPrice) { conditions.push('price <= ?'); params.push(parseFloat(maxPrice)); }

  let query = 'SELECT * FROM products';
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// GET PRODUCT BY SKU
app.get('/products/:sku', (req, res) => {
  const { sku } = req.params;
  db.query('SELECT * FROM products WHERE sku = ?', [sku], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    if (results.length === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json(results[0]);
  });
});

// UPDATE PRODUCT BY SKU
app.put('/products/:sku', (req, res) => {
  const { sku } = req.params;
  const { name, brand, color, size, mrp, price, quantity } = req.body;

  const query = `
    UPDATE products
    SET name=?, brand=?, color=?, size=?, mrp=?, price=?, quantity=?
    WHERE sku=?`;

  db.query(
    query,
    [name, brand, color, size, mrp, price, quantity, sku],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Product not found' });
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// DELETE PRODUCT BY SKU
app.delete('/products/:sku', (req, res) => {
  const { sku } = req.params;
  db.query('DELETE FROM products WHERE sku = ?', [sku], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  });
});

// Finally, start the server
app.listen(8000, () => console.log('Server running on http://localhost:8000'));
