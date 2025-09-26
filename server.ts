import express from "express";
import { json } from "stream/consumers";

//initialization of the app
const app = express();

const PORT = 3000;

//set up a basic route
app.get(`/`, (req, res) => {
  res.send("Welcome to our API!");
});

//start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

app.get(`/users`, (req, res) => {
  const users = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "John Smith" },
  ];
  res.json(users);
});

app.use(express.json());

app.post(`/users`, (req, res) => {
  const newUser = req.body;
  console.log(newUser);
  res.json({ message: `Use added!`, user: newUser });
});
