import express from "express";
import pg from "pg";
import axios from "axios";

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Connection (Render / Neon / Supabase)
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

await db.connect();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

let books = [];
let titles = [];
let order = "id";

// Change sorting order
app.post("/", (req, res) => {
  order = req.body.order;
  res.redirect("/");
});

// Home Page
app.get("/", async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM books ORDER BY ${order}`);
    const titleResult = await db.query("SELECT title FROM books");

    books = result.rows;
    titles = titleResult.rows;

    // Fetch Open Library Cover IDs
    for (const item of titles) {
      try {
        const title = item.title;

        const response = await axios.get(
          `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}`
        );

        if (
          response.data.docs.length > 0 &&
          response.data.docs[0].cover_edition_key
        ) {
          const olid = response.data.docs[0].cover_edition_key;

          await db.query(
            "UPDATE books SET olid = $1 WHERE title = $2",
            [olid, title]
          );
        }
      } catch (error) {
        console.error(`Error fetching cover for "${item.title}":`, error.message);
      }
    }

    res.render("index.ejs", { books, titles });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
