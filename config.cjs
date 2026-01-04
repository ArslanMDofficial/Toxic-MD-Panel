const fs = require("fs");
require("dotenv").config();

const config = {
  SESSION_ID: process.env.SESSION_ID || "eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiY1A1MkFuTnBmOGxyOWFuankwWHBmV0diS2xnMjVUNWIwSEE5WkZCYVQxaz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiVm5ZNTd4TnMwK0pHSHZCdGtWWlltbnUzODNXWXoyK242ZjlXSFNQRHFtST0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIwTW9obGFQc0VGdDRqMzYwVWkvWHZ5d1d2VW9uMkpqZ1FOUGhLalFDUTJJPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJtQVAzR1dEMWovc0ExRXBPd0NrYnNlbHJ4ZTlMUFMrTTZvTWErNDJJUFRrPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjBJRk1nU21TMzErRkxkRmNNY1lQUFRpUFFNWk44Z1NTUHJkMld3NVAxMjg9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkRoQk8rN3QwMmh6NDJ6YWdGUk5OYmQ4eStTbGNJWEFFQ2NsS25lZFIrZ0E9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiOEowUzRxMGpyL20vdkFxdXlsSU10RnhqYWQyaFRvUWhzMWc2Tmx0TDJYQT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSHpqS0JNWTFlT1ZVa01iNm1Ma01QR0F4TGJiTGhMeXlBdWNneHlIZ0JGWT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkVlc1h2cWdleTQ3MUdXMVZYQkwrR1doYnhvdDJUZWp4UmdCYVlTbmU5N0ZWcm5CVTlmNTNJbmduYlo4UjR4dXNaeWF5RG8raU40ZW1wenk1OFYyWGp3PT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6NTksImFkdlNlY3JldEtleSI6IkhkVGVzTjNFMVJ2UkxnRGY2MjJpNy9wOElzQTduY0srY1dGNWgxOTZWU0k9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbeyJrZXkiOnsicmVtb3RlSmlkIjoiOTIzMzkyNjE2MjYzQHMud2hhdHNhcHAubmV0IiwiZnJvbU1lIjp0cnVlLCJpZCI6IkE1ODcyQ0FENDY2RDcyM0FGMTkzQzRCNDY0NjU2MDMyIn0sIm1lc3NhZ2VUaW1lc3RhbXAiOjE3NjczNzQyMzB9LHsia2V5Ijp7InJlbW90ZUppZCI6IjkyMzM5MjYxNjI2M0BzLndoYXRzYXBwLm5ldCIsImZyb21NZSI6dHJ1ZSwiaWQiOiJBNTc3OEM3RjU2MTQ2QzEzRjYzMDNCRTUyMjE4Rjc2QiJ9LCJtZXNzYWdlVGltZXN0YW1wIjoxNzY3Mzc0MjMxfSx7ImtleSI6eyJyZW1vdGVKaWQiOiI5MjMzOTI2MTYyNjNAcy53aGF0c2FwcC5uZXQiLCJmcm9tTWUiOnRydWUsImlkIjoiQTVFRUQ4NkUxRkFFRUUxNUU1NzM0QjhFQjg2MzRFODEifSwibWVzc2FnZVRpbWVzdGFtcCI6MTc2NzM3NDIzM31dLCJuZXh0UHJlS2V5SWQiOjgxMywiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjgxMywiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJZVVBSQURFViIsIm1lIjp7ImlkIjoiOTIzMzkyNjE2MjYzOjM1QHMud2hhdHNhcHAubmV0IiwibmFtZSI6IkFyc2xhbi1NRCIsImxpZCI6IjE2MzA4OTA4NTQyNzg5NjozNUBsaWQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0lUdjBwSUhFSUg3MzhvR0dDUWdBU2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6IkI3TDZDa21iUkRMTWxMcXJ0cjBOckRxN0RVektmN1pGcHVnei9nb0kvMDg9IiwiYWNjb3VudFNpZ25hdHVyZSI6IktUYW1BMjJaVE81bnZ3bzRYOWU2QjlTVm5wcHUxTjBDcWpXNERUaWdZUXlZbDl0M1lzbWdyOCtvWU9WZEhqUkFwQ2VEblcxbTJmcm5MNnBYMVNUa0RBPT0iLCJkZXZpY2VTaWduYXR1cmUiOiI4M1VrSUpLeFgzRDlid0NHYXNBRWEyRzk3MjIrTmFDcjdGaEVkOE5XbEtKeVUvdFMvQnIxZi8vRko1NGxOcXdqaGVXZ3ZZaTJ2cXlmRm9Kalc4Y1loUT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6IjkyMzM5MjYxNjI2MzozNUBzLndoYXRzYXBwLm5ldCIsImRldmljZUlkIjowfSwiaWRlbnRpZmllcktleSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkJRZXkrZ3BKbTBReXpKUzZxN2E5RGF3NnV3MU15bisyUmFib00vNEtDUDlQIn19XSwicGxhdGZvcm0iOiJzbWJhIiwicm91dGluZ0luZm8iOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJDQUlJRFFnUyJ9LCJsYXN0QWNjb3VudFN5bmNUaW1lc3RhbXAiOjE3NjczNzQyMjQsImxhc3RQcm9wSGFzaCI6IlBXazVCIiwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFCbEoifQ==",
  PREFIX: process.env.PREFIX || ".",
  AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN !== undefined ? process.env.AUTO_STATUS_SEEN === "true" : true,
  AUTO_LIKE: process.env.AUTO_LIKE !== undefined ? process.env.AUTO_LIKE === "true" : true,
  AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY !== undefined ? process.env.AUTO_STATUS_REPLY === "true" : false,
  STATUS_READ_MSG: process.env.STATUS_READ_MSG || "",
  ANTI_DELETE: process.env.ANTI_DELETE !== undefined ? process.env.ANTI_DELETE === "true" : false,
  ANTI_DELETE_PATH: process.env.ANTI_DELETE_PATH || "inbox",
  AUTO_DL: process.env.AUTO_DL !== undefined ? process.env.AUTO_DL === "true" : false,
  AUTO_READ: process.env.AUTO_READ !== undefined ? process.env.AUTO_READ === "true" : false,
  AUTO_TYPING: process.env.AUTO_TYPING !== undefined ? process.env.AUTO_TYPING === "true" : false,
  AUTO_RECORDING: process.env.AUTO_RECORDING !== undefined ? process.env.AUTO_RECORDING === "true" : false,
  ALWAYS_ONLINE: process.env.ALWAYS_ONLINE !== undefined ? process.env.ALWAYS_ONLINE === "true" : true,
  AUTO_REACT: process.env.AUTO_REACT !== undefined ? process.env.AUTO_REACT === "true" : false,
  AUTO_BLOCK: process.env.AUTO_BLOCK !== undefined ? process.env.AUTO_BLOCK === "true" : false,
  REJECT_CALL: process.env.REJECT_CALL !== undefined ? process.env.REJECT_CALL === "true" : false,
  NOT_ALLOW: process.env.NOT_ALLOW !== undefined ? process.env.NOT_ALLOW === "true" : false,
  MODE: process.env.MODE || "public",
  BOT_NAME: process.env.BOT_NAME || "Toxic-MD",
  MENU_IMAGE: process.env.MENU_IMAGE || "https://files.catbox.moe/7l1tt5.jpg",
  DESCRIPTION: process.env.DESCRIPTION || "Savage WhatsApp Bot by Toxic-Master",
  OWNER_NAME: process.env.OWNER_NAME || "Toxic-Master",
  OWNER_NUMBER: process.env.OWNER_NUMBER || "254735342808",
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || "",
  GEMINI_KEY: process.env.GEMINI_KEY || "AIzaSyCUPaxfIdZawsKZKqCqJcC-GWiQPCXKTDc",
  WELCOME: process.env.WELCOME !== undefined ? process.env.WELCOME === "true" : false,
};

module.exports = config;
