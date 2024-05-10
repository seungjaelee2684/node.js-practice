const express = require('express');
const router = express.Router();
const connection = require('../database/MySQL');

router.get('/test', async function(req, res) {
  try {
    // const test = await new Promise((resolve, reject) => {
    //   connection.query(
    //     `SELECT * FROM jongchantest`,
    //     [],
    //     async function(error, results, fields) {
    //       if (error) throw error;
    //       resolve(results);
    //     }
    //   );
    // });

    res.status(200).json({
      message: 'success!',
      test
    });
  } catch (error) {
    res.status(500).json({
      message: 'fail...'
    });
  };
});

module.exports = router;