const { query } = require('../config/db');

// Create table if it doesn't exist (run once)
async function createPostTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS posts (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  return query(sql);
}

// Insert a new post
async function createPost({ title, description }) {
  const sql = `
    INSERT INTO posts (title, description)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const params = [title, description];
  const result = await query(sql, params);
  return result.rows[0];
}

// Get all posts
async function getAllPosts() {
  const sql = `SELECT * FROM posts ORDER BY id DESC`;
  const result = await query(sql);
  return result.rows;
}

module.exports = {
  createPostTable,
  createPost,
  getAllPosts,
};
