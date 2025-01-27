import express from 'express';
import pg from 'pg';
import axios from 'axios';
const app = express()
const port = 3000;

const db = new pg.Client(
    {
        user: 'postgres',
        host: 'localhost',
        database: 'book_basket',
        port: '5432',
        password: 'byebyebye'
    }
)

db.connect();

app.use(express.static('public'))

app.use(express.urlencoded({extended: true}));

let books = [];
let titles = [];
let order = 'id';
const result = await db.query('select * from books');
// console.log(result.rows);
app.post('/', (req, res) => {
order = req.body.order;
console.log(order);
res.redirect('/');
})
app.get('/', async (req, res) => {
    try {
        const result = await db.query(`select * from books order by ${order}`);
        const title = await db.query('select title from books');
        books = result.rows;
        titles = title.rows;
        // console.log(books);
        titles.forEach(async (title) => {
            try {
                title = title.title;
                const response = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
                // console.log(`https://openlibrary.org/search.json?title=${title}`)
                // console.log(response.data.docs);
                let olid = response.data.docs[0].cover_edition_key;
                // console.log(olid);
                await db.query('update books set olid = ($1) where title = ($2)', [olid, title]);
              } catch (error) {
                console.error(error);
              }
        })
        // console.log(titles);
        console.log(books);
        res.render('index.ejs', {books, titles});
    }
    catch(err) {
     console.log(err);
    }
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`);
})