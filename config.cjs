const fs = require("fs");
require("dotenv").config();

const config = {
  SESSION_ID: process.env.SESSION_ID || "ARSLAN-MD~eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoia0huUkgwcTRzcjZ1NU9TUVhhSW00MmtlblZMVWVCa0xjZkdyZHQ1SUtXWT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiOVhwdG94cHZoMlU5OS9zb3JYcXZ0ekxhWmp1K1BqeDJVTCs5UWdMdHl6RT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJVTHd3bklUYWw4bjB2SVFzUlFxck1WU3ZXWUY4TWQ2d25TUStPOWpnTldNPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJPbG9DQ2NXUXM2Sk93Vkxaand6eEpJWDNrY2I0ZXZyZzN3R0NrLzNuZ2tvPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IklIMHYxNnJzc2ppbWRvdndPQW9tT0VyK1ZueHBrUXhKQUQ1aWhadmFmSFU9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InYraVRRY2JxdlVJRnAzeWtkczh1Ui8zdzlzcTJNbjlHQWxQdW1TQkFSQWc9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiUURCWWdMNkVTQ0RZRjJ1ZFdwK0VNbUR6R3pwellsYTdmTnJUakltSEVucz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiRVJ2V0hvR1IrZGdYdUo4Y2pKR0Z4VS9qakxOYTQya2Q4VkdLdWVyZnNsYz0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IjhJUGRUQktFVisrTEFOb2FaVEJBOXRMeEdua1V3czlrdXBHOStZZ3Y4YkJ5RVBoeUtDd2FJTytwVGNSNlZyVXNxcXUwWHFxMy81cE0xMjNSQVJCMUNRPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6NDcsImFkdlNlY3JldEtleSI6InhEMTZ6TnpYYTl5clRrWWZzQnZyK2htd0wrLzNadm1GYjFOcTUzWWFWMDQ9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbeyJrZXkiOnsicmVtb3RlSmlkIjoiOTIzMzkyNjE2MjYzQHMud2hhdHNhcHAubmV0IiwiZnJvbU1lIjp0cnVlLCJpZCI6IkE1RDM2MUNFMTQ5OEJBM0IyRDQ1MkU0Qzg1OENDQjQ2In0sIm1lc3NhZ2VUaW1lc3RhbXAiOjE3Njc2Mzk2NDN9XSwibmV4dFByZUtleUlkIjo4MTMsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjo4MTMsImFjY291bnRTeW5jQ291bnRlciI6MCwiYWNjb3VudFNldHRpbmdzIjp7InVuYXJjaGl2ZUNoYXRzIjpmYWxzZX0sInJlZ2lzdGVyZWQiOnRydWUsInBhaXJpbmdDb2RlIjoiWVVQUkFERVYiLCJtZSI6eyJpZCI6IjkyMzM5MjYxNjI2MzozN0BzLndoYXRzYXBwLm5ldCIsIm5hbWUiOiJBcnNsYW4tTUQiLCJsaWQiOiIxNjMwODkwODU0Mjc4OTY6MzdAbGlkIn0sImFjY291bnQiOnsiZGV0YWlscyI6IkNJVHYwcElIRU1XVThNb0dHQ1lnQVNnQSIsImFjY291bnRTaWduYXR1cmVLZXkiOiJCN0w2Q2ttYlJETE1sTHFydHIwTnJEcTdEVXpLZjdaRnB1Z3ovZ29JLzA4PSIsImFjY291bnRTaWduYXR1cmUiOiI4eEUrMkIzUys0b3E4SFVYaFlXKzVqMTYrdFpFckhBWUtadnJEOGU3ekpKa3ljZXpCdVFpM3ZzMEFSSlUvMlhEWlY0ZGtjTkgwUldjT3BoeEFoQTRCUT09IiwiZGV2aWNlU2lnbmF0dXJlIjoiVEN0K043NjVHNkFGUkI4ejdKa2p3Q2JmY0loUEZib2pqSEgyMVl2YzIrV3I4dXFqei9xdUVxVkZ2dm9pcTNqZmQ2Z1l0ZjhXNFRlb01qVlA3YmZaQlE9PSJ9LCJzaWduYWxJZGVudGl0aWVzIjpbeyJpZGVudGlmaWVyIjp7Im5hbWUiOiI5MjMzOTI2MTYyNjM6MzdAcy53aGF0c2FwcC5uZXQiLCJkZXZpY2VJZCI6MH0sImlkZW50aWZpZXJLZXkiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJCUWV5K2dwSm0wUXl6SlM2cTdhOURhdzZ1dzFNeW4rMlJhYm9NLzRLQ1A5UCJ9fV0sInBsYXRmb3JtIjoic21iYSIsInJvdXRpbmdJbmZvIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQ0FJSURRZ1MifSwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzY3NjM5NjM2LCJsYXN0UHJvcEhhc2giOiJQV2s1QiIsIm15QXBwU3RhdGVLZXlJZCI6IkFBQUFBQmxKIn0=",
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
