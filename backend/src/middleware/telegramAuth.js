import { validateInitData } from '../utils/telegram.js';

export function telegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  const botToken = process.env.BOT_TOKEN;

  if (process.env.NODE_ENV === 'development' && !initData) {
    req.telegramUser = {
      id: 123456789,
      first_name: 'Dev',
      last_name: 'User',
      username: 'devuser',
      language_code: 'ru',
    };
    return next();
  }

  const user = validateInitData(initData, botToken);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: invalid Telegram init data' });
  }

  req.telegramUser = user;
  next();
}
