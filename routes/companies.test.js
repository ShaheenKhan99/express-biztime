// Tell Node that we're in test "mode"
process.env.NODE_ENV = 'test';

/** Tests for companies. */

const request = require("supertest");

const app = require("../app");
const { createData } = require("../_test-common");
const db = require("../db");

// before each test, clean out data
beforeEach(createData);

afterAll(async () => {
  await db.end()
})

describe("GET /", function () {

  test("It should respond with array of companies", async function () {
    const response = await request(app).get("/companies");
    expect(response.body).toEqual({
      "companies": [
        {code: "apple", name: "Apple"},
        {code: "ibm", name: "IBM"}
      ]
    });
  })
});


describe("GET /apple", function () {

  test("It should return company info", async function () {
    const response = await request(app).get("/companies/apple");
    console.log(response.body);
    expect(response.body).toEqual(
        {
          "company": {
            code: "apple",
            name: "Apple",
            description: "Maker of OSX.",
            invoices: [1, 2],
          }
        }
    );
  });

  test("It should return 404 for non-existing company", async function () {
    const response = await request(app).get("/companies/nonexistent");
    expect(response.status).toEqual(404);
  })
});


describe("POST /", function () {

  test("It should add company", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "DollarTree", description: "Cheap"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "dollartree",
            name: "DollarTree",
            description: "Cheap",
          }
        }
    );
  });

  test("It should return 500 for conflict", async function () {
    const response = await request(app)
        .post("/companies")
        .send({name: "Apple", description: "Duplicate"});

    expect(response.status).toEqual(500);
  })
});


describe("PUT /", function () {

  test("It should update company", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({name: "AppleUpdate", description: "NewDescription"});

    expect(response.body).toEqual(
        {
          "company": {
            code: "apple",
            name: "AppleUpdate",
            description: "NewDescription",
          }
        }
    );
  });

  test("It should return 404 for non-existing company", async function () {
    const response = await request(app)
        .put("/companies/nonexistent")
        .send({name: "Somename"});

    expect(response.status).toEqual(404);
  });

  test("It should return 500 for missing data", async function () {
    const response = await request(app)
        .put("/companies/apple")
        .send({});

    expect(response.status).toEqual(500);
  })
});


describe("DELETE /", function () {

  test("It should delete company", async function () {
    const response = await request(app)
        .delete("/companies/apple");

    expect(response.body).toEqual({"status": "deleted"});
  });

  test("It should return 404 for nonexisting company", async function () {
    const response = await request(app)
        .delete("/companies/nonexistent");

    expect(response.status).toEqual(404);
  });
});


