import {
  makeWASocket,
  fetchLatestBaileysVersion,
  DisconnectReason,
  useMultiFileAuthState,
} from "whiskeysockets/baileys";
import { Handler, Callupdate, GroupUpdate } from "./data/index.js";
import express from "express";
import pino from "pino";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { DateTime } from "luxon";
import config from "./config.cjs";
import pkg from "./lib/autoreact.cjs";
const { emojis, doReact } = pkg;

const prefix = config.PREFIX || ".";
const app = express();
const PORT = process.env.PORT || 3000;

const MAIN_LOGGER = pino({
  timestamp: () => `,"time":"${new Date().toJSON()}"`,
});
const logger = MAIN_LOGGER.child({});
logger.level = "trace";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, "session");
const credsPath = path.join(sessionDir, "creds.json");

if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

// Advanced Session Manager using config.cjs
class SessionManager {
  constructor() {
    this.config = config;
    this.sessionDir = sessionDir;
    this.credsPath = credsPath;
  }

  // Check if session has ARSLAN-MD~ prefix
  hasArslanPrefix(sessionId) {
    return sessionId && sessionId.startsWith("ARSLAN-MD~");
  }

  // Extract Base64 from ARSLAN-MD~ format
  extractBase64(sessionId) {
    if (this.hasArslanPrefix(sessionId)) {
      return sessionId.split("~")[1];
    }
    return sessionId;
  }

  // Load session from config.cjs
  async loadSessionFromConfig() {
    const sessionId = this.config.SESSION_ID;
    
    // Check if session ID exists in config
    if (!sessionId || sessionId === "ARSLAN-MD~YOUR_BASE64_SESSION_STRING_HERE") {
      console.log(chalk.yellow(`
╔══════════════════════════════════╗
║    ⚠️ Session ID Not Configured  ║
╚══════════════════════════════════╝

Please set your session ID in config.cjs:
1. Open config.cjs file
2. Set SESSION_ID: "ARSLAN-MD~your_base64_string"
3. Save and restart bot
      `));
      return false;
    }

    // Extract Base64 from ARSLAN-MD~ format
    let base64Creds;
    if (this.hasArslanPrefix(sessionId)) {
      base64Creds = this.extractBase64(sessionId);
      console.log(chalk.green(`
╔══════════════════════════════════╗
║   ✅ ARSLAN-MD Format Detected   ║
╚══════════════════════════════════╝
      `));
    } else {
      base64Creds = sessionId;
      console.log(chalk.yellow(`
╔══════════════════════════════════╗
║   ⚠️ Plain Base64 Detected      ║
╚══════════════════════════════════╝
      `));
    }

    // Decode Base64 and save to creds.json
    try {
      const decodedBuffer = Buffer.from(base64Creds, "base64");
      const decodedString = decodedBuffer.toString("utf-8");
      
      // Validate if it's proper JSON
      JSON.parse(decodedString);
      
      // Write to creds.json
      await fs.promises.writeFile(this.credsPath, decodedBuffer);
      
      console.log(chalk.green(`
╔══════════════════════════════════╗
║      ✅ Session Loaded          ║
╚══════════════════════════════════╝
• Source: config.cjs
• Format: ${this.hasArslanPrefix(sessionId) ? "ARSLAN-MD~" : "Plain Base64"}
• Size: ${decodedBuffer.length} bytes
• Saved to: ${this.credsPath}
      `));
      
      return true;
    } catch (error) {
      console.error(chalk.red(`
╔══════════════════════════════════╗
║     ❌ Invalid Session ID        ║
╚══════════════════════════════════╝

Error: ${error.message}

Your SESSION_ID in config.cjs might be:
1. Corrupted
2. Not in proper Base64 format
3. Missing or extra characters

Please check your config.cjs file.
      `));
      return false;
    }
  }

  // Get session info
  getSessionInfo() {
    const sessionId = this.config.SESSION_ID;
    
    if (!sessionId || sessionId === "ARSLAN-MD~YOUR_BASE64_SESSION_STRING_HERE") {
      return { configured: false };
    }
    
    return {
      configured: true,
      format: this.hasArslanPrefix(sessionId) ? "ARSLAN-MD~" : "Plain",
      length: sessionId.length,
      prefix: this.hasArslanPrefix(sessionId) ? "Yes" : "No",
      source: "config.cjs"
    };
  }
}

// Get greeting based on time
function getGreeting() {
  const hour = DateTime.now().setZone("Asia/Karachi").hour;
  if (hour >= 5 && hour < 12) return "Good Morning! 🌄";
  if (hour >= 12 && hour < 17) return "Good Afternoon! 🌅";
  if (hour >= 17 && hour < 21) return "Good Evening! 🌃";
  return "Good Night! 🌌";
}

// Get current time
function getCurrentTime() {
  return DateTime.now().setZone("Asia/Karachi").toLocaleString(DateTime.TIME_SIMPLE);
}

// Status reply messages
const statusReplies = [
  "واہ بہت خوب! 😍",
  "شاندار سٹیٹس! 👏",
  "زبردست! 🔥",
  "بہت عمدہ! 👍",
  "واہ کیا بات ہے! 💯",
];

async function start() {
  try {
    console.log(chalk.cyan(`
╔══════════════════════════════════╗
║       🚀 POWER MD BOT            ║
║     Config.cjs Session System    ║
╚══════════════════════════════════╝
    `));
    
    // Log bot configuration
    console.log(chalk.blue(`
╔══════════════════════════════════╗
║        📋 Bot Configuration      ║
╚══════════════════════════════════╝
• Bot Name: ${config.BOT_NAME || "Power MD"}
• Prefix: ${config.PREFIX}
• Mode: ${config.MODE}
• Owner: ${config.OWNER_NAME}
• Session: ${config.SESSION_ID ? "Configured" : "Not Set"}
    `));
    
    // Initialize Session Manager
    const sessionManager = new SessionManager();
    const sessionInfo = sessionManager.getSessionInfo();
    
    if (sessionInfo.configured) {
      console.log(chalk.green(`
📁 Session Information:
• Format: ${sessionInfo.format}
• Length: ${sessionInfo.length} characters
• Source: ${sessionInfo.source}
• ARSLAN-MD Prefix: ${sessionInfo.prefix}
      `));
    }
    
    // Load session from config.cjs
    const sessionLoaded = await sessionManager.loadSessionFromConfig();
    
    if (!sessionLoaded) {
      console.log(chalk.yellow(`
╔══════════════════════════════════╗
║   📱 QR Code Mode Activated      ║
╚══════════════════════════════════╝

Please scan the QR code to login...
      `));
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const Matrix = makeWASocket({
      version,
      logger: pino({ level: "silent" }),
      browser: [config.BOT_NAME || "Power MD", "Chrome", "1.0.0"],
      auth: state,
      printQRInTerminal: !sessionLoaded, // Show QR only if no session
      getMessage: async (key) => {
        return { conversation: config.BOT_NAME || "Power MD WhatsApp Bot" };
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
            console.error(chalk.red(`
╔══════════════════════════════════╗
║     ❌ Invalid Session           ║
╚══════════════════════════════════╝

• Please check SESSION_ID in config.cjs
• Make sure it's a valid session
• Or delete 'session' folder and restart
            `));
            break;
            
          case DisconnectReason.loggedOut:
            console.error(chalk.red(`
╔══════════════════════════════════╗
║     🚪 Logged Out               ║
╚══════════════════════════════════╝

• You have been logged out
• Please update SESSION_ID in config.cjs
• Get new session ID and update config
            `));
            hasSentStartMessage = false;
            break;
            
          case DisconnectReason.connectionClosed:
          case DisconnectReason.connectionLost:
          case DisconnectReason.restartRequired:
          case DisconnectReason.timedOut:
            console.log(chalk.yellow("🔄 Reconnecting..."));
            setTimeout(() => start(), 5000);
            break;
            
          case DisconnectReason.connectionReplaced:
            console.log(chalk.yellow("📱 Connection replaced..."));
            process.exit();
            break;
            
          default:
            console.log(chalk.yellow("🔄 Trying to reconnect..."));
            setTimeout(() => start(), 10000);
        }
        return;
      }

      if (connection === "open") {
        if (!hasSentStartMessage) {
          const firstMessage = `
╔══════════════════════════════════╗
║       🎉 ${config.BOT_NAME}       ║
╚══════════════════════════════════╝

${getGreeting()} 

🤖 *Bot Information:*
├─ 📛 Name: ${config.BOT_NAME}
├─ 🔧 Mode: ${config.MODE}
├─ 🔣 Prefix: ${config.PREFIX}
├─ 🕐 Time: ${getCurrentTime()}
├─ 📚 Library: Baileys
└─ 🔒 Session: ${sessionLoaded ? "From Config" : "New QR"}

👑 *Owner:* ${config.OWNER_NAME}
📞 *Contact:* ${config.OWNER_NUMBER}

${config.DESCRIPTION || "⚡ Powered by Power MD"}
          `;

          await Matrix.sendMessage(Matrix.user.id, {
            text: firstMessage,
            footer: `Powered by ${config.OWNER_NAME}`,
            contextInfo: {
              externalAdReply: {
                title: `🚀 ${config.BOT_NAME}`,
                body: "Bot successfully connected!",
                thumbnail: config.MENU_IMAGE ? { url: config.MENU_IMAGE } : undefined,
                sourceUrl: `https://github.com/Arslan-MD/Power-MD`,
                mediaType: 1,
              },
            },
          });

          hasSentStartMessage = true;
        }

        console.log(chalk.green(`
╔══════════════════════════════════╗
║   ✅ ${config.BOT_NAME} Connected ║
╚══════════════════════════════════╝

• User: ${Matrix.user.id}
• Platform: WhatsApp
• Session: ${sessionLoaded ? "Config Loaded" : "New Login"}
• Time: ${new Date().toLocaleTimeString()}
        `));
      }
    });

    // Save credentials
    Matrix.ev.on("creds.update", saveCreds);

    // Message handler with all config features
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

        // Status handling with config settings
        if (mek.key.remoteJid === "status@broadcast") {
          // Auto seen status
          if (config.AUTO_STATUS_SEEN) {
            await Matrix.readMessages([mek.key]);
          }
          
          // Auto like status
          if (config.AUTO_LIKE) {
            const autolikeEmojis = ['❤️', '🔥', '👍', '🎉', '👏', '💯', '🚀', '⭐'];
            const randomEmoji = autolikeEmojis[Math.floor(Math.random() * autolikeEmojis.length)];
            await Matrix.sendMessage(mek.key.remoteJid, { 
              react: { text: randomEmoji, key: mek.key } 
            });
          }
          
          // Auto status reply
          if (config.AUTO_STATUS_REPLY) {
            const randomReply = statusReplies[Math.floor(Math.random() * statusReplies.length)];
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
        console.error("Message handling error:", err.message);
      }
    });

    // Call handler
    Matrix.ev.on("call", async (json) => {
      if (config.REJECT_CALL) {
        await Callupdate(json, Matrix);
      }
    });

    // Group update handler
    Matrix.ev.on("group-participants.update", async (messag) => {
      if (config.WELCOME) {
        await GroupUpdate(Matrix, messag);
      }
    });

    // Set bot mode from config
    if (config.MODE === "public") {
      Matrix.public = true;
    } else if (config.MODE === "private") {
      Matrix.public = false;
    }

    // Additional features from config
    if (config.ALWAYS_ONLINE) {
      setInterval(async () => {
        try {
          await Matrix.sendPresenceUpdate('available');
        } catch (error) {
          // Silent error
        }
      }, 60000); // Every minute
    }

    if (config.AUTO_TYPING) {
      // Auto typing logic can be added here
    }

  } catch (error) {
    console.error(chalk.red(`
╔══════════════════════════════════╗
║        ❌ Critical Error         ║
╚══════════════════════════════════╝

Error: ${error.message}

Troubleshooting:
1. Check config.cjs file
2. Verify SESSION_ID is valid
3. Delete 'session' folder if exists
4. Restart bot
    `));
    process.exit(1);
  }
}

// Start bot
start();

// Express server for monitoring
app.get("/", (req, res) => {
  const sessionManager = new SessionManager();
  const sessionInfo = sessionManager.getSessionInfo();
  
  const status = {
    status: "running",
    bot: config.BOT_NAME,
    owner: config.OWNER_NAME,
    prefix: config.PREFIX,
    mode: config.MODE,
    session: sessionInfo.configured ? "configured" : "not_set",
    time: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  res.json(status);
});

app.get("/config", (req, res) => {
  // Return safe config (without sensitive data)
  const safeConfig = {
    botName: config.BOT_NAME,
    prefix: config.PREFIX,
    mode: config.MODE,
    owner: config.OWNER_NAME,
    features: {
      autoStatusSeen: config.AUTO_STATUS_SEEN,
      autoLike: config.AUTO_LIKE,
      autoRead: config.AUTO_READ,
      autoReact: config.AUTO_REACT,
      welcome: config.WELCOME,
      alwaysOnline: config.ALWAYS_ONLINE
    }
  };
  
  res.json(safeConfig);
});

app.listen(PORT, () => {
  console.log(chalk.cyan(`
╔══════════════════════════════════╗
║       🌐 HTTP Server Running     ║
╚══════════════════════════════════╝

• Port: ${PORT}
• URL: http://localhost:${PORT}
• Config: http://localhost:${PORT}/config
• Status: http://localhost:${PORT}/
  `));
});
