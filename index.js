import {
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason,
  useMultiFileAuthState,
} from "baileys-pro";
import { Handler, Callupdate, GroupUpdate } from "./data/index.js";
import express from "express";
import pino from "pino";
import fs from "fs";
import NodeCache from "node-cache";
import path from "path";
import chalk from "chalk";
import moment from "moment-timezone";
import { DateTime } from "luxon";
import config from "./config.cjs";
import pkg from "./lib/autoreact.cjs";
const { emojis, doReact } = pkg;
const prefix = config.PREFIX || "!";
const app = express();
const PORT = config.PORT || 3000;

const MAIN_LOGGER = pino({
  timestamp: () => `,"time":"${new Date().toJSON()}"`,
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const msgRetryCounterCache = new NodeCache();

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, "session");
const credsPath = path.join(sessionDir, "creds.json");

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// ================== ENHANCED SESSION MANAGEMENT ==================
const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');

if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
}

async function loadBase64Session() {
    try {
        if (!config.SESSION_ID) {
            console.log(chalk.yellow('[⚠️] No SESSION_ID - Will use QR/Pairing'));
            return null;
        }

        console.log(chalk.cyan('[🔰] Processing SESSION_ID...'));

        // ✅ ARSLAN-MD FORMAT
        if (config.SESSION_ID.includes('ARSLAN-MD~')) {
            console.log(chalk.cyan('[🔰] Detected ARSLAN-MD format session'));
            const base64Data = config.SESSION_ID.split("ARSLAN-MD~")[1];
            if (!base64Data) {
                console.log(chalk.red('[❌] Invalid ARSLAN-MD format'));
                return null;
            }
            try {
                const sessionData = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(credsPath, sessionData);
                console.log(chalk.green('[✅] ARSLAN-MD session saved!'));
                return JSON.parse(sessionData.toString());
            } catch (e) {
                console.log(chalk.red(`[❌] ARSLAN-MD parse error: ${e.message}`));
                return null;
            }
        }
        // ✅ PLAIN BASE64 FORMAT
        else if (config.SESSION_ID.length > 100 && !config.SESSION_ID.includes('http')) {
            console.log(chalk.cyan('[🔰] Detected direct base64 session'));
            try {
                if (!/^[A-Za-z0-9+/=]+$/.test(config.SESSION_ID)) {
                    console.log(chalk.red('[❌] Invalid base64 format'));
                    return null;
                }
                const sessionData = Buffer.from(config.SESSION_ID, 'base64');
                fs.writeFileSync(credsPath, sessionData);
                console.log(chalk.green('[✅] Base64 session saved!'));
                return JSON.parse(sessionData.toString());
            } catch (e) {
                console.log(chalk.red(`[❌] Base64 parse error: ${e.message}`));
                return null;
            }
        }
        // ✅ DIRECT JSON STRING
        else if (config.SESSION_ID.startsWith('{')) {
            console.log(chalk.cyan('[🔰] Detected direct JSON session'));
            try {
                const sessionData = JSON.parse(config.SESSION_ID);
                fs.writeFileSync(credsPath, JSON.stringify(sessionData));
                console.log(chalk.green('[✅] JSON session saved!'));
                return sessionData;
            } catch (e) {
                console.log(chalk.red(`[❌] JSON parse error: ${e.message}`));
                return null;
            }
        }
        // ✅ MEGA.NZ URL FORMAT
        else if (config.SESSION_ID.includes('mega.nz')) {
            console.log(chalk.cyan('[🔰] Detected MEGA.NZ URL session'));
            try {
                const { default: Mega } = require('megajs');
                const mega = new Mega({});
                const file = await mega.getFileByUrl(config.SESSION_ID);
                const data = await new Promise((resolve, reject) => {
                    file.download((err, data) => {
                        if (err) reject(err);
                        else resolve(data);
                    });
                });
                fs.writeFileSync(credsPath, data);
                console.log(chalk.green('[✅] MEGA session downloaded & saved!'));
                return JSON.parse(data.toString());
            } catch (error) {
                console.log(chalk.red(`[❌] MEGA session error: ${error.message}`));
                console.log(chalk.yellow('[💡] Install megajs: npm install megajs'));
                return null;
            }
        } else {
            console.log(chalk.yellow('[⚠️] Unknown SESSION_ID format'));
            return null;
        }

    } catch (error) {
        console.log(chalk.red(`[❌] Session load error: ${error.message}`));
        return null;
    }
}

async function start() {
  try {
    await loadBase64Session();
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const Matrix = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      browser: ["Ubuntu", "Chrome", "20.0.4"],
      auth: state,
      getMessage: async (key) => {
        if (store) {
          const msg = await store.loadMessage(key.remoteJid, key.id);
          return msg.message || undefined;
        }
        return { conversation: "Toxic-MD whatsapp user bot" };
      },
    });

    let hasSentStartMessage = false;

    // Connection update handler
    Matrix.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        const statusCode = lastDisconnect.error?.output?.statusCode;
        switch (statusCode) {
          case DisconnectReason.badSession:
            console.error(chalk.red(`◈━━━━━━━━━━━━━━━━◈
│❒ Invalid session, please delete the 'session' folder and restart.
◈━━━━━━━━━━━━━━━━◈`));
            process.exit();
            break;
          case DisconnectReason.connectionClosed:
          case DisconnectReason.connectionLost:
          case DisconnectReason.restartRequired:
          case DisconnectReason.timedOut:
            start();
            break;
          case DisconnectReason.connectionReplaced:
            process.exit();
            break;
          case DisconnectReason.loggedOut:
            console.error(chalk.red(`◈━━━━━━━━━━━━━━━━◈
│❒ Logged out, please delete the 'session' folder and restart.
◈━━━━━━━━━━━━━━━━◈`));
            hasSentStartMessage = false;
            process.exit();
            break;
          default:
            start();
        }
        return;
      }

      if (connection === "open") {
        try {
          await Matrix.groupAcceptInvite("GoXKLVJgTAAC3556FXkfFI");
        } catch (error) {
          // Ignore group invite errors
        }

        if (!hasSentStartMessage) {
          const firstMessage = [
            `◈━━━━━━━━━━━━━━━━◈`,
            `│❒ *${getGreeting()}*`,
            `│❒ Welcome to *Toxic-MD*! You're now connected.`,
            ``,
            `✨ *Bot Name*: Toxic-MD`,
            `🔧 *Mode*: ${config.MODE || "public"}`,
            `➡️ *Prefix*: ${prefix}`,
            `🕒 *Time*: ${getCurrentTime()}`,
            `💾 *Database*: None`,
            `📚 *Library*: Baileys`,
            ``,
            `│❒ *Credits*: xh_clinton`,
            `◈━━━━━━━━━━━━━━━━◈`,
          ].join("\n");

          const secondMessage = [
            `◈━━━━━━━━━━━━━━━━◈`,
            `│❒ Tap to view commands:`,
            `◈━━━━━━━━━━━━━━━━◈`,
          ].join("\n");

          await Matrix.sendMessage(Matrix.user.id, {
            text: firstMessage,
            footer: `Powered by Toxic-MD`,
            viewOnce: true,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                title: "Toxic-MD",
                body: `Bot initialized successfully.`,
                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });

          await Matrix.sendMessage(Matrix.user.id, {
            text: secondMessage,
            footer: `Powered by Toxic-MD`,
            buttons: [
              {
                buttonId: `${prefix}menu`,
                buttonText: { displayText: `📖 ${toFancyFont("MENU")}` },
                type: 1,
              },
            ],
            headerType: 1,
            viewOnce: true,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                title: "Toxic-MD",
                body: `Select to proceed.`,
                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                mediaType: 1,
                renderLargerThumbnail: true,
              },
            },
          });

          hasSentStartMessage = true;
        }

        console.log(chalk.green(`◈━━━━━━━━━━━━━━━━◈
│❒ Toxic-MD connected
◈━━━━━━━━━━━━━━━━◈`));
      }
    });

    // Save credentials
    Matrix.ev.on("creds.update", saveCreds);

    // Message handler
    Matrix.ev.on("messages.upsert", async (chatUpdate) => {
      try {
        const mek = chatUpdate.messages[0];
        if (!mek || !mek.message) return;

        if (
          mek.message?.protocolMessage ||
          mek.message?.ephemeralMessage ||
          mek.message?.reactionMessage
        )
          return;

        const fromJid = mek.key.participant || mek.key.remoteJid;

        // Status handling
        if (mek.key.remoteJid === "status@broadcast" && config.AUTO_STATUS_SEEN) {
          await Matrix.readMessages([mek.key]);
          // Autolike function
          if (config.AUTO_LIKE) {
            const autolikeEmojis = ['🗿', '⌚️', '💠', '👣', '🍆', '💔', '🤍', '❤️‍🔥', '💣', '🧠', '🦅', '🌻', '🧊', '🛑', '🧸', '👑', '📍', '😅', '🎭', '🎉', '😳', '💯', '🔥', '💫', '🐒', '💗', '❤️‍🔥', '👁️', '👀', '🙌', '🙆', '🌟', '💧', '🦄', '🟢', '🎎', '✅', '🥱', '🌚', '💚', '💕', '😉', '😒'];
            const randomEmoji = autolikeEmojis[Math.floor(Math.random() * autolikeEmojis.length)];
            const nickk = await Matrix.decodeJid(Matrix.user.id);
            await Matrix.sendMessage(mek.key.remoteJid, { 
              react: { text: randomEmoji, key: mek.key } 
            }, { statusJidList: [mek.key.participant, nickk] });
          }
          // Status reply function
          if (config.AUTO_STATUS_REPLY) {
            const randomReply = toxicReplies[Math.floor(Math.random() * toxicReplies.length)];
            await Matrix.sendMessage(fromJid, { text: randomReply }, { quoted: mek });
          }
          return;
        }

        // Auto-react function
        if (!mek.key.fromMe && config.AUTO_REACT && mek.message) {
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          await doReact(randomEmoji, mek, Matrix);
        }

        // Auto-read function
        if (config.AUTO_READ && !mek.key.fromMe) {
          await Matrix.readMessages([mek.key]);
        }

        // Command handler
        await Handler(chatUpdate, Matrix, logger);
      } catch (err) {
        // Suppress non-critical errors
      }
    });

    // Call handler
    Matrix.ev.on("call", async (json) => await Callupdate(json, Matrix));

    // Group update handler
    Matrix.ev.on("group-participants.update", async (messag) => await GroupUpdate(Matrix, messag));

    // Set bot mode
    if (config.MODE === "public") {
      Matrix.public = true;
    } else if (config.MODE === "private") {
      Matrix.public = false;
    }
  } catch (error) {
    console.error(chalk.red(`◈━━━━━━━━━━━━━━━━◈
│❒ Critical Error: ${error.message}
◈━━━━━━━━━━━━━━━━◈`));
    process.exit(1);
  }
}

start();

app.get("/", (req, res) => {
  res.send("Toxic-MD is running!");
});

app.listen(PORT, () => {});
