/**
 * Required External Modules
 */
const express = require("express");
const { query, validationResult } = require("express-validator");
const { scrapeHeadings, structureAnalysis } = require("./utils/scrapper");

/**
 * App Variables
 */
const app = express();
const port = process.env.PORT || 8000;

/**
 * Routes Definitions
 */
app.get(
  "/",
  [query("u").isURL().withMessage("invalid URL provided")], // middleware
  async (req, res) => {
    // check for errors in the request
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      //extract the url from the request
      let url = req.query.u;
      // scrape the url extracting the semantic structure
      scrapeHeadings(url)
        .then((semanticStructure) => {
          //anylise actual structure looking for incongrunent elements
          structureAnalysis(url, semanticStructure)
            .then((structureEvaluation) => {
              // return the evaluated structure
              res.status(200).json({ data: structureEvaluation });
            })
            .catch((err) => {
              res.status(500).json({ error: err.message });
            });
        })
        .catch((err) => {
          res.status(500).json({ error: err.message });
        });
    }
  }
);

/**
 * Server Activation
 */
app.listen(port, () => console.log(`Express is listening on port ${port}!`));
