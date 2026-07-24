import { Router } from 'express';
import { telegramAuth } from '../middleware/telegramAuth.js';
import { upsertUser } from '../db/index.js';
import { checkChannelMember } from '../utils/telegram.js';

const router = Router();

router.post('/verify', telegramAuth, async (req, res) => {
  const user = req.telegramUser;
  await upsertUser(user).catch(() => {});

  const subscribed = await checkChannelMember(user.id).catch(() => true);

  res.json({
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      languageCode: user.language_code,
      photoUrl: user.photo_url || null,
    },
    subscribed,
    channelUrl: process.env.REQUIRED_CHANNEL
      ? `https://t.me/${process.env.REQUIRED_CHANNEL.replace('@', '')}`
      : null,
  });
});

export default router;
