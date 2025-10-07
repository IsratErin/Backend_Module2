import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import { z } from "zod";

const PORT = 3000;
const app = express();

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

dotenv.config();
const { Pool } = pg;

const envSchema = z.object({
  DB_USER: z.string(),
  DB_HOST: z.string(),
  DB_DATABASE: z.string(),
  DB_PASSWORD: z.string(),
});

const validatedEnv = envSchema.safeParse(process.env);
if (!validatedEnv.success) {
  console.error(
    "Invalid enviroment variables",
    z.treeifyError(validatedEnv.error)
  );
  process.exit(1);
}
const { DB_USER, DB_HOST, DB_DATABASE, DB_PASSWORD } = validatedEnv.data;

const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
});

const playersScehema = z.object({
  name: z.string(),
  join_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

app.post("/players", async (req, res) => {
  const validatedPlayer = playersScehema.safeParse(req.body);
  if (!validatedPlayer.success) {
    return res.status(500).json({ error: validatedPlayer.error });
  }
  const { name, join_date } = validatedPlayer.data;
  try {
    const result = await pool.query(
      "INSERT INTO players (name, join_date) VALUES ($1, $2) RETURNING id, name, TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date",
      [name, join_date]
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Unknown error");
    }
  }
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
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Unknown error");
    }
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
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Unknown error");
    }
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
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).send(err.message);
    } else {
      res.status(500).send("Unknown error");
    }
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
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Unknown error");
    }
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
    if (error instanceof Error) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send("Unknown error");
    }
  }
});
