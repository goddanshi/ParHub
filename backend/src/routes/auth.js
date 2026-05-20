import { Router } from 'express';
import { telegramAuth } from '../middleware/telegramAuth.js';

const router = Router();

router.post('/verify', telegramAuth, (req, res) => {
  res.json({
    user: {
      id: req.telegramUser.id,
      firstName: req.telegramUser.first_name,
      lastName: req.telegramUser.last_name,
      username: req.telegramUser.username,
      languageCode: req.telegramUser.language_code,
      photoUrl: req.telegramUser.photo_url || null,
    },
  });
});

export default router;
