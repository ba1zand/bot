import { Markup } from "telegraf";

export const mainMenuKeyboard = (referralCode: string, totalReferrals: number) =>
  Markup.inlineKeyboard([
    [
      Markup.button.callback("╔══ 🔗 لینک دعوت من ══╗", "my_link"),
    ],
    [
      Markup.button.callback(`╔══ 👥 زیرمجموعه‌های من: ${totalReferrals} نفر ══╗`, "my_referrals"),
    ],
    [
      Markup.button.callback("╔══ 🏆 جدول برترین‌ها ══╗", "leaderboard"),
    ],
    [
      Markup.button.callback("╔══ 📊 آمار کامل من ══╗", "stats"),
    ],
  ]);

export const backKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("◀️ بازگشت به منو", "main_menu")],
  ]);

export const shareKeyboard = (botUsername: string, referralCode: string) =>
  Markup.inlineKeyboard([
    [
      Markup.button.url(
        "📤 اشتراک‌گذاری لینک دعوت",
        `https://t.me/share/url?url=https://t.me/${botUsername}?start=${referralCode}&text=🌟 با این لینک به ما بپیوند!`
      ),
    ],
    [Markup.button.callback("◀️ بازگشت به منو", "main_menu")],
  ]);
