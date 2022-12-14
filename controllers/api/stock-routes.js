const router = require("express").Router();
const { Stock } = require("../../models");
const fetch = require("node-fetch");
require("dotenv").config();

// get db stock list api/stocks
router.get("/", (req, res) => {
  Stock.findAll()
    .then((dbStockData) => {
      res.json(dbStockData);
      // res.render('dashboard');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// find by id api/stocks/#
router.get("/:id", (req, res) => {
  Stock.findOne({
    where: {
      id: req.params.id,
    },
    attributes: ["id", "name", "ticker", "shares", "cost"],
  })
    .then((dbStockData) => {
      if (!dbStockData) {
        res.status(404).json({ message: "No post found with this id" });
        return;
      }
      res.json(dbStockData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// post to stock list api/stocks
router.post("/", async (req, res) => {
  if (req.session) {
    // can modularize 43-58 import and use function 
    const options = {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.API_KEY,
        "X-RapidAPI-Host": "alpha-vantage.p.rapidapi.com",
      },
    };
    try {

      const response = await fetch(
        // can i change this fetch to pull based on company name? Then ticker can be inserted based on company.
        `https://alpha-vantage.p.rapidapi.com/query?function=GLOBAL_QUOTE&symbol=${req.body.ticker}&datatype=json`,
        options
      );
      const fetchData = await response.json();
      console.log(fetchData);
      if (fetchData) {
        const newStock = await Stock.create({
          name: req.body.name,
          ticker: req.body.ticker,
          shares: req.body.shares,
          cost: req.body.cost,
          user_id: req.session.user_id,
          current_price: fetchData["Global Quote"]["05. price"],
        });
        res.json(newStock);
      } else {
        res.status(400).json({ message: "Confirm company information." });
      }
    } catch (err) {
      console.log(err);
      res.status(400).json(err);
    }
  }
});

// Put or update
router.put("/:id", (req, res) => {
  Stock.update(
    {
      shares: req.body.shares,
      cost: req.body.cost,
      user_id: req.body.user_id,
    },
    {
      where: {
        id: req.params.id,
      },
    }
  )
    .then((dbStockData) => {
      if (!dbStockData) {
        res.status(404).json({ message: "No stock found with this id" });
        return;
      }
      res.json(dbStockData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

// delete
router.delete("/:id", (req, res) => {
  Stock.destroy({
    where: {
      id: req.params.id,
    },
  })
    .then((dbStockData) => {
      if (!dbStockData) {
        res.status(404).json({ message: "No stock found with this id!" });
        return;
      }
      res.json(dbStockData);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(err);
    });
});

module.exports = router;
