import express from 'express';
import zokrates from '@eyblockchain/zokrates.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { name } = req.body;
  try {
    await zokrates.compile(`./code/${name}.code`, `./output`, `${name}_out`);
    return res.send('Compiled');
  } catch (err) {
    return next(err);
  }
});

export default router;
