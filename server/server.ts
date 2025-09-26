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
