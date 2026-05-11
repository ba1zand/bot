import { Telegraf, Markup } from "telegraf";
import { logger } from "../lib/logger";
import { getOrCreateUser, getUserReferrals, getLeaderboard } from "./db";

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is required");
}

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const glass = (text: string) => `⌾ ${text} ⌾`;

function userName(u: { firstName: string; lastName?: string | null; username?: string | null }) {
  if (u.username) return `@${u.username}`;
  return [u.firstName, u.lastName].filter(Boolean).join(" ");
}

async function sendMainMenu(ctx: any, user: any) {
  const botInfo = await bot.telegram.getMe();
  const link = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

  const text =
    `✨ *خوش اومدی، ${user.firstName}!* ✨\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `👤 *نام:* ${user.firstName}${user.lastName ? " " + user.lastName : ""}\n` +
    `🔑 *کد دعوت:* \`${user.referralCode}\`\n` +
    `👥 *زیرمجموعه‌های مستقیم:* ${user.totalReferrals} نفر\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `از منو زیر یه گزینه انتخاب کن 👇`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback("🔗  لینک دعوت من  🔗", "my_link")],
    [Markup.button.callback("👥  زیرمجموعه‌های من  👥", "my_referrals")],
    [Markup.button.callback("🏆  جدول برترین‌ها  🏆", "leaderboard")],
    [Markup.button.callback("📊  آمار کامل من  📊", "stats")],
  ]);

  try {
    await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
  } catch {
    await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
  }
}

bot.start(async (ctx) => {
  const payload = ctx.startPayload;
  const tgUser = ctx.from;

  if (!tgUser) return;

  try {
    const user = await getOrCreateUser(
      tgUser.id,
      tgUser.first_name,
      tgUser.last_name,
      tgUser.username,
      payload || undefined
    );

    const botInfo = await bot.telegram.getMe();
    const link = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

    const isNew = !payload || user.referredBy == null;
    const welcomeMsg = payload && user.referredBy
      ? `🎉 *با موفقیت ثبت‌نام کردی!*\nاز طریق یه لینک دعوت وارد شدی.\n\n`
      : `🌟 *خوش اومدی!*\n\n`;

    const text =
      welcomeMsg +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *نام:* ${user.firstName}${user.lastName ? " " + user.lastName : ""}\n` +
      `🔑 *کد دعوت:* \`${user.referralCode}\`\n` +
      `👥 *زیرمجموعه‌های مستقیم:* ${user.totalReferrals} نفر\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `از منو زیر یه گزینه انتخاب کن 👇`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔗  لینک دعوت من  🔗", "my_link")],
      [Markup.button.callback("👥  زیرمجموعه‌های من  👥", "my_referrals")],
      [Markup.button.callback("🏆  جدول برترین‌ها  🏆", "leaderboard")],
      [Markup.button.callback("📊  آمار کامل من  📊", "stats")],
    ]);

    await ctx.reply(text, { parse_mode: "Markdown", ...keyboard });
  } catch (err) {
    logger.error({ err }, "Error in /start handler");
    await ctx.reply("❌ خطایی رخ داد. لطفاً دوباره تلاش کن.");
  }
});

bot.action("main_menu", async (ctx) => {
  await ctx.answerCbQuery();
  const tgUser = ctx.from;
  if (!tgUser) return;
  try {
    const user = await getOrCreateUser(tgUser.id, tgUser.first_name, tgUser.last_name, tgUser.username);
    await sendMainMenu(ctx, user);
  } catch (err) {
    logger.error({ err }, "Error in main_menu action");
  }
});

bot.action("my_link", async (ctx) => {
  await ctx.answerCbQuery();
  const tgUser = ctx.from;
  if (!tgUser) return;

  try {
    const user = await getOrCreateUser(tgUser.id, tgUser.first_name, tgUser.last_name, tgUser.username);
    const botInfo = await bot.telegram.getMe();
    const link = `https://t.me/${botInfo.username}?start=${user.referralCode}`;

    const text =
      `🔗 *لینک اختصاصی دعوت شما*\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `\`${link}\`\n` +
      `━━━━━━━━━━━━━━━━━━━\n\n` +
      `🎯 این لینک رو برای دوستات بفرست!\n` +
      `هر کسی با این لینک بیاد، زیرمجموعه مستقیم تو میشه.\n\n` +
      `👥 *زیرمجموعه‌های فعلی:* ${user.totalReferrals} نفر`;

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.url(
          "📤  اشتراک‌گذاری لینک  📤",
          `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("🌟 با این لینک به ما بپیوند!")}`
        ),
      ],
      [Markup.button.callback("🔄  کپی کد دعوت  🔄", `copy_code_${user.referralCode}`)],
      [Markup.button.callback("◀️  بازگشت به منو  ◀️", "main_menu")],
    ]);

    await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
  } catch (err) {
    logger.error({ err }, "Error in my_link action");
  }
});

bot.action(/^copy_code_(.+)$/, async (ctx) => {
  const code = (ctx.match as RegExpMatchArray)[1];
  await ctx.answerCbQuery(`کد دعوت شما: ${code}`, { show_alert: true });
});

bot.action("my_referrals", async (ctx) => {
  await ctx.answerCbQuery();
  const tgUser = ctx.from;
  if (!tgUser) return;

  try {
    const user = await getOrCreateUser(tgUser.id, tgUser.first_name, tgUser.last_name, tgUser.username);
    const referrals = await getUserReferrals(tgUser.id);

    let text = `👥 *زیرمجموعه‌های مستقیم شما*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n`;
    text += `📊 *تعداد کل:* ${referrals.length} نفر\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n\n`;

    if (referrals.length === 0) {
      text += `😔 هنوز زیرمجموعه‌ای نداری!\n\n`;
      text += `💡 لینک دعوتت رو با دوستات شیر کن تا زیرمجموعه بگیری.`;
    } else {
      referrals.slice(0, 20).forEach((r, i) => {
        const name = r.username ? `@${r.username}` : `${r.firstName}${r.lastName ? " " + r.lastName : ""}`;
        const date = new Date(r.joinedAt).toLocaleDateString("fa-IR");
        text += `${i + 1}. 👤 ${name}\n   📅 ${date}\n`;
      });

      if (referrals.length > 20) {
        text += `\n...و ${referrals.length - 20} نفر دیگه`;
      }
    }

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("◀️  بازگشت به منو  ◀️", "main_menu")],
    ]);

    await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
  } catch (err) {
    logger.error({ err }, "Error in my_referrals action");
  }
});

bot.action("leaderboard", async (ctx) => {
  await ctx.answerCbQuery();

  try {
    const top = await getLeaderboard(10);

    let text = `🏆 *جدول برترین دعوت‌کنندگان*\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━\n`;

    const medals = ["🥇", "🥈", "🥉"];

    top.forEach((u, i) => {
      const medal = medals[i] ?? `${i + 1}.`;
      const name = u.username ? `@${u.username}` : u.firstName;
      text += `${medal} ${name} — *${u.totalReferrals}* نفر\n`;
    });

    if (top.length === 0) {
      text += `هنوز کسی دعوت نکرده!\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("◀️  بازگشت به منو  ◀️", "main_menu")],
    ]);

    await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
  } catch (err) {
    logger.error({ err }, "Error in leaderboard action");
  }
});

bot.action("stats", async (ctx) => {
  await ctx.answerCbQuery();
  const tgUser = ctx.from;
  if (!tgUser) return;

  try {
    const user = await getOrCreateUser(tgUser.id, tgUser.first_name, tgUser.last_name, tgUser.username);
    const referrals = await getUserReferrals(tgUser.id);
    const leaderboard = await getLeaderboard(100);
    const rank = leaderboard.findIndex((u) => {
      return u.firstName === user.firstName && u.totalReferrals === user.totalReferrals;
    }) + 1;

    const joinDate = new Date(user.joinedAt).toLocaleDateString("fa-IR");

    const text =
      `📊 *آمار کامل شما*\n\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👤 *نام:* ${user.firstName}${user.lastName ? " " + user.lastName : ""}\n` +
      `🆔 *کد دعوت:* \`${user.referralCode}\`\n` +
      `📅 *تاریخ عضویت:* ${joinDate}\n` +
      `━━━━━━━━━━━━━━━━━━━\n` +
      `👥 *زیرمجموعه‌های مستقیم:* ${user.totalReferrals} نفر\n` +
      `🏆 *رتبه شما:* ${rank > 0 ? rank : "-"}\n` +
      `${user.referredBy ? "✅ *از طریق دعوت وارد شدی*" : "🌟 *عضو اصلی هستی*"}\n` +
      `━━━━━━━━━━━━━━━━━━━`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("🔗  لینک دعوت من  🔗", "my_link")],
      [Markup.button.callback("◀️  بازگشت به منو  ◀️", "main_menu")],
    ]);

    await ctx.editMessageText(text, { parse_mode: "Markdown", ...keyboard });
  } catch (err) {
    logger.error({ err }, "Error in stats action");
  }
});

bot.command("help", async (ctx) => {
  const text =
    `📖 *راهنمای ربات*\n\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `🔗 *لینک دعوت:* لینک اختصاصی شما برای دعوت دیگران\n` +
    `👥 *زیرمجموعه‌ها:* لیست کسایی که با لینک شما وارد شدن\n` +
    `🏆 *جدول برترین‌ها:* کسایی که بیشترین دعوت داشتن\n` +
    `📊 *آمار:* آمار کامل حساب شما\n` +
    `━━━━━━━━━━━━━━━━━━━\n\n` +
    `برای شروع /start رو بزن`;

  await ctx.reply(text, { parse_mode: "Markdown" });
});

export function startBot() {
  bot.launch({ dropPendingUpdates: true });
  logger.info("Telegram bot started (long polling)");

  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
