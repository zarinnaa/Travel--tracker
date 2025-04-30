import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "0103",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId ;

let users = [
  { id: 1, name: "Zarina", color: "teal" },
  { id: 2, name: "Z", color: "powderblue" },
];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1", [currentUserId]);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function getCurrentUser() {
  const result = await  db.query('SELECT * FROM users' )
  users = result.rows
  return users.find ((user) => user.id == currentUserId)
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUserId= await getCurrentUser()
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUserId?.color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser = await getCurrentUser()

  try {
    const color = req.body.color.toLowerCase();
    const result = await db.query(
      "SELECT country_code FROM counries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  if(req.body.add === 'new'){
    res.render('new.ejs')
  }else{
    currentUserId = req.body.user
    res.redirect('/')
  }})

app.post("/new", async (req, res) => {
  const name = req.body.name 
  const color = req.body.color

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2 ) RETURNING *; ",
    [name, color]
  )
  const id = result.rows[0].id
  currentUserId = id
  res.redirect('/')
});

app.post("/delete", async (req, res) => {
  const currentUser = await getCurrentUser()
  console.log(currentUser.id)
  try {
    await db.query('DELETE FROM visited_countries WHERE user_id = $1', [currentUser?.id])
    await db.query('DELETE FROM users WHERE id = $1', [currentUser?.id])
    res.redirect('/')
    currentUserId = await getCurrentUser()
  } catch (err) {
    console.log(err);
  }
})

app.post("/edit", async (req, res) => {
  const newName = req.body.newName 
  const currentUser = await getCurrentUser()
  try {
    await db.query('UPDATE users SET name = $1 WHERE id = $2', [newName, currentUser.id]) 
    // await db.query('UPDATE FROM title WHERE id = $2', [currentUser.id])
    res.redirect('/')
    // currentUserId = await getCurrentUserId()
  } catch (err) {
    console.log(err)
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
