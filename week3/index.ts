import express from "express";
import pg from "pg";
import dotenv from "dotenv";

const PORT = 3000;
const app = express();

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

dotenv.config();
const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//lists all players, the games they’ve played, and their scores
app.get("/players-scores", async (req, res) => {
  try {
    const result =
      await pool.query(`SELECT players.name, games.title, scores.score
        FROM scores
        INNER JOIN players ON scores.player_id =players.id
        INNER JOIN games ON scores.game_id = games.id`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//find high scores and top 3 players
app.get("/top-players", async (req, res) => {
  try {
    const result =
      await pool.query(`SELECT players.name, SUM(scores.score) as total_score
        FROM scores
        INNER JOIN players on scores.player_id = players.id
        GROUP BY players.id, players.name
        ORDER BY total_score DESC
        LIMIT 3`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// find players who did not play any games
app.get("/inactive-players", async (req, res) => {
  try {
    const result =
      await pool.query(`SELECT players.name, players.id, scores.score
        FROM players
        LEFT OUTER JOIN scores ON players.id = scores.player_id
        WHERE scores.player_id is NULL;`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//popular game genres
app.get("/popular-genres", async (req, res) => {
  try {
    const result = await pool.query(`SELECT games.genre, COUNT(scores.game_id) 
        FROM scores
        INNER JOIN games on scores.game_id = games.id
        GROUP BY games.genre;`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//Recently joined players
app.get("/recent-players", async (req, res) => {
  try {
    const result = await pool.query(`SELECT players.name, players.join_date
        FROM players
        WHERE join_date >= CURRENT_DATE - INTERVAL '30 days';`);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
