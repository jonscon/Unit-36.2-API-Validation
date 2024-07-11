/** Integration tests for books routes. */

process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

// isbn of sample book
let book_isbn;


beforeEach(async function () {
    let result = await db.query(`
        INSERT INTO books
            (isbn, amazon_url, author, language, pages, publisher, title, year)
        VALUES (
            '1234567',
            'https://amazon.com/test',
            'Tester',
            'English',
            250,
            'Test Publisher',
            'The Test Book',
            2024)
        RETURNING isbn`);
    book_isbn = result.rows[0].isbn;
})

/** Test GET / books */
describe("GET /books", function () {
    test("Get a list of books", async function() {
        const response = await request(app).get('/books');
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("title");
    })
})

/** Test GET /[isbn]  */
describe("GET /books/:isbn", function () {
    test("Get a book based on isbn", async function() {
        const response = await request(app).get(`/books/${book_isbn}`);
        const book = response.body.book;
        expect(book).toHaveProperty("isbn");
        expect(book.isbn).toBe(book_isbn);
    })

    test("Respods with 404 if can't find book", async function () {
        const response = await request(app).get(`/books/7654321`);
        const book = response.body.book;
        expect(response.statusCode).toBe(404);
    })
})

/** Test POST / */
describe("POST /books", function () {
    test("Create a book", async function () {
        const response = await request(app)
            .post('/books')
            .send({
                isbn: '345678',
                amazon_url: 'https://amazon.com/burrito',
                author: 'Burrito Man',
                language: 'English',
                pages: 400,
                publisher: 'Burrito Publisher',
                title: 'The Last Burrito Standing',
                year: 2020
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    })
    test("Create an invalid book", async function () {
        const response = await request(app)
            .post('/books')
            .send({
                author: "Taco Man"
            })
    expect(response.statusCode).toBe(400);
    })
})

/** Test PUT /:isbn */
describe("PUT /books/:isbn", function () {
    test("Update a book", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: 'https://amazon.com/taco',
                author: 'Taco Man',
                language: 'English',
                pages: 300,
                publisher: 'Taco Publisher',
                title: 'The First Taco Born',
                year: 2022
            });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.title).toBe("The First Taco Born");
    })
    test("Do a bad update of a book", async function () {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                author: 'Taco Man',
                language: "English",
                random: "RANDOM FIELD",
                pages: "300",
                publisher: 'Taco Publisher',
                title: 'The First Taco Born',
                year: 2022
            });
        expect(response.statusCode).toBe(400);
    })
    test("Return status 404 if cannot find book", async function () {
        const response = await request(app)
            .put(`/books/000`)
            .send({
                amazon_url: 'https://amazon.com/taco',
                author: 'Taco Man',
                language: 'English',
                pages: 300,
                publisher: 'Taco Publisher',
                title: 'The First Taco Born',
                year: 2022
            });
        expect(response.statusCode).toBe(404);
    })
})

/** Test DELETE /:isbn */
describe("DELETE /books/:isbn", function() {
    test("Delete a book", async function () {
        const response = await request(app)
            .delete(`/books/${book_isbn}`);
        expect(response.body).toEqual({ message : "Book deleted" });
    })
    test("Delete a book with invalid isbn", async function () {
        const response = await request(app)
            .delete('/books/000');
        expect(response.statusCode).toBe(404);
    })
})

afterEach(async function () {
    await db.query("DELETE FROM books");
})

afterAll(async function () {
    await db.end();
})
