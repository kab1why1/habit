const { query } = require('../config/db');


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


async function getAllPosts() {
const sql = `SELECT * FROM posts ORDER BY id DESC`;
const result = await query(sql);
return result.rows;
}


async function getPostById(id) {
const sql = `SELECT * FROM posts WHERE id = $1 LIMIT 1`;
const result = await query(sql, [id]);
return result.rows[0];
}


module.exports = {
createPostTable,
createPost,
getAllPosts,
getPostById,
};