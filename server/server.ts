import express from "express";
import { z } from "zod";

//initialization of the app
const app = express();
const PORT = 3000;

//start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

//set up a basic ping route
app.get("/ping", (req, res) => {
  const msg = {
    message: `pong`,
  };
  res.json(msg);
});

const randomuserSchema = z.object({
  results: z.array(
    z.object({
      name: z.object({
        title: z.string(),
        first: z.string(),
        last: z.string(),
      }),
      location: z.object({
        country: z.string(),
      }),
    })
  ),
});

//set up random-person route
app.get("/random-person", async (req, res) => {
  try {
    const response = await fetch("https://randomuser.me/api/");
    const data = await response.json();
    const validatedUser = randomuserSchema.safeParse(data);
    if (!validatedUser.success) {
      return res.status(500).json({
        error: "Invalid user data",
        details: validatedUser.error,
      });
    } else {
      const user = validatedUser.data.results[0];
      res.json({
        title: `${user?.name.title}`,
        name: `${user?.name.first} ${user?.name.last}`,
        country: `${user?.location.country}`,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed fetching random user" + error,
    });
  }
});

const userSchema = z.object({
  name: z.string().max(12).min(3),
  age: z.number().min(8).max(1100).optional().default(28),
  email: z.email().toLowerCase(),
});

//users route
app.use(express.json());
app.post("/users", (req, res) => {
  const user = req.body;

  const validatedUser = userSchema.safeParse(user);

  if (!validatedUser.success) {
    return res.status(400).json({
      error: "Not valid data",
      details: validatedUser.error,
    });
  } else {
    res.status(201).json({ user: validatedUser.data });
  }
});

//random-login route
const randomLoggedUser = z.object({
  results: z.array(
    z.object({
      name: z.object({
        first: z.string(),
        last: z.string(),
      }),
      registered: z.object({
        date: z.coerce.date().transform((d) => d.toISOString().split("T")[0]),
      }),
    })
  ),
});

app.get("/random-login", async (req, res) => {
  try {
    const response = await fetch("https://randomuser.me/api/");
    const data = await response.json();

    const validatedUser = randomLoggedUser.safeParse(data);
    if (!validatedUser.success) {
      return res.status(500).json({
        error: "Invalid user data",
        details: validatedUser.error,
      });
    } else {
      const user = validatedUser.data.results[0];
      res.json({
        name: `${user?.name.first} ${user?.name.last}`,
        date: `${user?.registered.date}`,
        summary: `${user.name.first} ${user?.name.last} registered on ${user?.registered.date}`,
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed fetching user data" + error,
    });
  }
});
