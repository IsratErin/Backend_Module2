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
