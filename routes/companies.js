const express = require("express");
const ExpressError = require("../expressError");
const router = new express.Router();
const slugify = require("slugify");

const db = require("../db");

/** GET / => list of companies.
 * => {companies: [{code, name, description}, {code, name, description}, ...]}
 */

router.get('/', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT code, name
       FROM companies
       ORDER BY name`
       );
    return res.json({ "companies": result.rows })
  } catch (err) {
    return next(err);
  }
})


/** GET /[code] => details of specific company.
 * => {company: {code, name, description, invoices: [id, ...]}}
 * Returns 404 if company cannot be found
 */
router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const compResult = await db.query(
      `SELECT code, name, description 
      FROM companies
      WHERE code = $1`,
      [code]
    );

    const invResult = await db.query(
      `SELECT id
       FROM invoices
       WHERE comp_code = $1`,
       [code]
    );
    if (compResult.rows.length === 0) {
      throw new ExpressError(`Can't find company with code of ${code}`, 404);
    }

    const company = compResult.rows[0];
    const invoices = invResult.rows;

    company.invoices = invoices.map(inv => inv.id);

    return res.json({ "company": company });
  } catch (err) {
    return next(err);
  }
});


/** POST / => Adds a company when given JSON like: { code, name, description }
 * Returns details of new company
 * => {company: {code, name, description}}
 */

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    let code = slugify(name, {lower: true});

    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
       VALUES ($1, $2, $3) 
       RETURNING code, name, description`, 
       [code, name, description]
    );
    return res.status(201).json({ "company": result.rows[0] })
  } catch (err) {
    return next(err)
  }
})


/** PUT /[code] => Edits existing company when given JSON like: { name, description }.
 * Returns 404 if company not found else updates and returns company details
 * => {company: {code, name, description}}
 */
router.put('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      `UPDATE companies  
       SET name=$1, description=$2
       WHERE code=$3
       RETURNING code, name, description`, 
       [name, description, code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find company with code ${code}`, 404)
    } else {
    return res.json({ "company": result.rows[0] })
    }
  } catch (err) {
    return next(err)
  }
});


/** DELETE /[code] => Deletes existing company 
 * Returns 404 if company not found else deletes company and returns status of deleted
 * => {status: "deleted"}
 */
router.delete('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await db.query(
      `DELETE FROM companies 
       WHERE code = $1
       RETURNING code`,
      [code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(`Cannot find company with code ${code}`, 404)
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
})


module.exports = router;