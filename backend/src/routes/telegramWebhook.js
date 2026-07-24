import { Router } from 'express';
import { setChannelSubscribed } from '../db/index.js';
import { sendBotMessage } from '../utils/telegram.js';

const router = Router();

const APP_URL = process.env.APP_URL || 'https://parhub-shop.ru';

router.post('/', async (req, res) => {
  res.json({ ok: true }); // Telegram ждёт 200 быстро

  const update = req.body;

  // Обработка команды /start
  const message = update.message;
  if (message?.text?.startsWith('/start')) {
    const chatId = message.chat.id;
    await sendBotMessage(
      chatId,
      '👋 Добро пожаловать в <b>ParHub</b>!\n\nНажмите кнопку ниже, чтобы открыть магазин:',
      {
        replyMarkup: {
          inline_keyboard: [[
            { text: '🛍 Открыть магазин', web_app: { url: APP_URL } },
          ]],
        },
      },
    ).catch(err => console.error('[tg-webhook] /start reply error:', err.message));
    return;
  }

  // Обновление статуса подписки на канал
  const chatMember = update.chat_member;
  if (!chatMember) return;

  const channel = process.env.REQUIRED_CHANNEL?.replace('@', '');
  if (channel && chatMember.chat.username !== channel) return;

  const userId = String(chatMember.new_chat_member.user.id);
  const status = chatMember.new_chat_member.status;
  const subscribed = ['member', 'administrator', 'creator', 'restricted'].includes(status);

  console.log(`[tg-webhook] userId=${userId} status=${status} subscribed=${subscribed}`);
  await setChannelSubscribed(userId, subscribed).catch(() => {});
});

export default router;
