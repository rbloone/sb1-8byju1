require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { WalletTracker } = require('./walletTracker');
const { TradeManager } = require('./tradeManager');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const tracker = new WalletTracker(process.env.RPC_URL);
const trader = new TradeManager(process.env.PRIVATE_KEY, process.env.RPC_URL);

let isWatching = false;

// Command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 
    '🚀 Welcome to Solana Wallet Tracker!\n\n' +
    'Commands:\n' +
    '/watch - Start tracking wallet\n' +
    '/stop - Stop tracking\n' +
    '/status - Check tracking status\n' +
    '/sell - Sell all tracked tokens\n' +
    '/balance - Check your wallet balance'
  );
});

bot.onText(/\/watch/, async (msg) => {
  const chatId = msg.chat.id;
  if (!isWatching) {
    isWatching = true;
    bot.sendMessage(chatId, '👀 Started watching wallet transactions');
    
    tracker.startWatching(process.env.WALLET_TO_WATCH, async (transaction) => {
      if (transaction.type === 'buy') {
        await bot.sendMessage(chatId, 
          `🔔 Tracked wallet bought:\n` +
          `Token: ${transaction.token}\n` +
          `Amount: ${transaction.amount}\n` +
          `Price: ${transaction.price} SOL`
        );
        
        try {
          const copyResult = await trader.copyTrade(transaction);
          await bot.sendMessage(chatId,
            `✅ Successfully copied trade:\n` +
            `Transaction: ${copyResult.signature}`
          );
        } catch (error) {
          await bot.sendMessage(chatId,
            `❌ Failed to copy trade:\n${error.message}`
          );
        }
      }
    });
  } else {
    bot.sendMessage(chatId, '⚠️ Already watching wallet');
  }
});

bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  if (isWatching) {
    isWatching = false;
    tracker.stopWatching();
    bot.sendMessage(chatId, '🛑 Stopped watching wallet');
  } else {
    bot.sendMessage(chatId, '⚠️ Not currently watching any wallet');
  }
});

bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  const status = isWatching ? '✅ Active' : '❌ Inactive';
  bot.sendMessage(chatId, `Tracking status: ${status}`);
});

bot.onText(/\/sell/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const result = await trader.sellAllTokens();
    bot.sendMessage(chatId,
      `✅ Successfully sold all tokens:\n` +
      `Transactions: ${result.signatures.join('\n')}`
    );
  } catch (error) {
    bot.sendMessage(chatId,
      `❌ Failed to sell tokens:\n${error.message}`
    );
  }
});

bot.onText(/\/balance/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const balance = await trader.getWalletBalance();
    bot.sendMessage(chatId,
      `💰 Wallet Balance:\n` +
      `SOL: ${balance.sol}\n` +
      `Tokens: ${balance.tokens.map(t => `\n${t.symbol}: ${t.amount}`).join('')}`
    );
  } catch (error) {
    bot.sendMessage(chatId,
      `❌ Failed to fetch balance:\n${error.message}`
    );
  }
});