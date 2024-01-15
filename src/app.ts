import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";
import * as dotenv from "dotenv";
import CurrencyService from "./services/CurrencyService";
import { prepareFullInfo } from "./utill/utill";
import { greatings, info } from "./utill/messages";

dotenv.config();

const currencyService = new CurrencyService();

const bot: TelegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
    polling: true,
});

const menu = [
    {
        text: "Курси",
        callback_data: "listRecent",
    },
    {
        text: "Обране",
        callback_data: "listFavourite",
    },
    {
        text: "Про Бота",
        callback_data: "about",
    },
];

bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    console.log(msg.from?.first_name);
    console.log(msg);
    await bot.sendMessage(
        msg.chat.id,
        `Вітаю ${msg.from?.first_name}! ${greatings}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Курси",
                            callback_data: "listRecent",
                        },
                        {
                            text: "Обране",
                            callback_data: "listFavourite",
                        },
                        {
                            text: "Про Бота",
                            callback_data: "about",
                        },
                    ],
                ],
            },
        }
    );
});
bot.on("callback_query", async (query) => {
    if (!query.data || query.data !== "listRecent") {
        return;
    }

    const currencies = await currencyService.getRecentList();
    let section: InlineKeyboardButton[] = [];
    const inlineKeyboard: InlineKeyboardButton[][] = [];
    currencies.forEach((c) => {
        if (section.length === 2) {
            inlineKeyboard.push(section);
            section = [];
        }
        section.push({
            text: `${c.symbol} - ${c.price} $`,
            callback_data: c.symbol,
        });
    });
    inlineKeyboard.push(section);
    inlineKeyboard.push(menu);

    bot.answerCallbackQuery(query.id);

    await bot.sendMessage(query.from.id, "📈Cryptocurrency rate📈", {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        },
    });
});

bot.on("callback_query", async (query) => {
    if (!query.data) {
        return;
    }

    const fullInfo = await currencyService.getFullInfo(query.data);
    if (!fullInfo) {
        return;
    }

    bot.answerCallbackQuery(query.id);

    const addToFollowing = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Додаты в обране",
                        callback_data: "add",
                    },
                ],
            ],
        },
    };

    const removeFromFollowing = {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Видалити з обраного",
                        callback_data: "delete",
                    },
                ],
            ],
        },
    };
    const resp = prepareFullInfo(fullInfo);
    const symbolExistsInFavorite = await currencyService.existsInFavorite(
        query.from.id,
        fullInfo.symbol
    );
    if (symbolExistsInFavorite) {
        await bot.sendMessage(query.from.id, resp, removeFromFollowing);
    } else {
        await bot.sendMessage(query.from.id, resp, addToFollowing);
    }
});

bot.on("callback_query", async (query) => {
    if (!query.data || query.data !== "add") {
        return;
    }
    bot.answerCallbackQuery(query.id);
    await bot.deleteMessage(query.from.id, query.message?.message_id + "");
    const symbol = query.message?.text?.split(" ")[0];

    await currencyService.addToFavoriteList(query.from.id, symbol!);
    const currencies = await currencyService.getFavoriteList(query.from.id);

    let section: InlineKeyboardButton[] = [];
    const inlineKeyboard: InlineKeyboardButton[][] = [];
    currencies.forEach((c) => {
        if (section.length === 2) {
            inlineKeyboard.push(section);
            section = [];
        }
        section.push({
            text: `${c.symbol} - ${c.price} $`,
            callback_data: c.symbol,
        });
    });
    inlineKeyboard.push(section);

    await bot.sendMessage(query.from.id, "FAVORITE", {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        },
    });
});

bot.on("callback_query", async (query) => {
    const symbol = query.message?.text?.split(" ")[0];
    const action = query.data;

    if (!action || action !== "delete") {
        return;
    }

    bot.answerCallbackQuery(query.id);
    await bot.deleteMessage(query.from.id, query.message?.message_id + "");

    currencyService.deleteFromFavoriteList(query.from.id, symbol!);
    const currencies = await currencyService.getFavoriteList(query.from.id);

    let section: InlineKeyboardButton[] = [];
    const inlineKeyboard: InlineKeyboardButton[][] = [];
    currencies.forEach((c) => {
        if (section.length === 2) {
            inlineKeyboard.push(section);
            section = [];
        }
        section.push({
            text: `${c.symbol} - ${c.price} $`,
            callback_data: c.symbol,
        });
    });
    inlineKeyboard.push(section);

    await bot.sendMessage(query.from.id, "FAVORITE", {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        },
    });
});

bot.on("callback_query", async (query) => {
    if (!query.data || query.data !== "listFavourite") {
        return;
    }

    bot.answerCallbackQuery(query.id);
    const currencies = await currencyService.getFavoriteList(query.from.id);

    let section: InlineKeyboardButton[] = [];
    const inlineKeyboard: InlineKeyboardButton[][] = [];
    currencies.forEach((c) => {
        if (section.length === 2) {
            inlineKeyboard.push(section);
            section = [];
        }
        section.push({
            text: `${c.symbol} - ${c.price} $`,
            callback_data: c.symbol,
        });
    });
    inlineKeyboard.push(section);
    inlineKeyboard.push(menu);

    bot.answerCallbackQuery(query.id);

    await bot.sendMessage(query.from.id, "FAVORITE", {
        reply_markup: {
            inline_keyboard: inlineKeyboard,
        },
    });
});

bot.on("callback_query", async (query) => {
    if (!query.data || query.data !== "about") {
        return;
    }

    bot.answerCallbackQuery(query.id);

    await bot.sendMessage(query.from.id, info, {
        reply_markup: {
            inline_keyboard: [menu],
        },
    });
});
// https://t.me/lambda_dnepr_bot
