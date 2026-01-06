import fetch from 'node-fetch';
import ytSearch from 'yt-search';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import osCallbacks from 'os';
import config from "../config.cjs";

const streamPipeline = promisify(pipeline);
const tmpDir = osCallbacks.tmpdir();
import axios from "axios";

/* ================= AXIOS ================= */
const AXIOS_DEFAULTS = {
  timeout: 60000,
  headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" }
};

/* ================= RETRY ================= */
async function tryRequest(fn, attempts = 3) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (i < attempts) await new Promise(r => setTimeout(r, i * 1000));
    }
  }
  throw last;
}

/* ================= APIS ================= */
async function getIzumi(url) {
  const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=720`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.download) return res.data.result;
  throw new Error("Izumi failed");
}

async function getOkatsu(url) {
  const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`;
  const res = await tryRequest(() => axios.get(api, AXIOS_DEFAULTS));
  if (res?.data?.result?.mp4) {
    return { download: res.data.result.mp4 };
  }
  throw new Error("Okatsu failed");
}

/* ================= CACHE ================= */
const videoCache = new Map();

/* ================= MAIN ================= */
const video = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || ".";
    const body = m.body || "";
    const cmd = body.startsWith(prefix)
      ? body.slice(prefix.length).split(" ")[0].toLowerCase()
      : "";

    if (!["video", "ytmp4", "mp4"].includes(cmd)) return;

    const query = body.slice(prefix.length + cmd.length).trim();
    if (!query) {
      return await Matrix.sendMessage(
        m.from,
        { text: "⚠️ Example:\n.video pasoori" },
        { quoted: m }
      );
    }

    await Matrix.sendMessage(m.from, {
      react: { text: "🎬", key: m.key }
    });

    /* ========== SEARCH ========== */
    const search = await yts(query);
    if (!search?.videos?.length) {
      return await Matrix.sendMessage(m.from, { text: "❌ No video found" }, { quoted: m });
    }

    const info = search.videos[0];
    const vid = info.videoId;
    videoCache.set(vid, info.url);

    const caption = `
🎬 *${info.title}*
⏱ ${info.timestamp}
👁 ${info.views.toLocaleString()}
👤 ${info.author.name}

👇 *Select download type*
`;

    await Matrix.sendMessage(
      m.from,
      {
        image: { url: info.thumbnail },
        caption,
        buttons: [
          { buttonId: `${prefix}vget normal ${vid}`, buttonText: { displayText: "🎬 Normal Video" }, type: 1 },
          { buttonId: `${prefix}vget document ${vid}`, buttonText: { displayText: "📁 Document" }, type: 1 },
          { buttonId: `${prefix}vget ptv ${vid}`, buttonText: { displayText: "📹 Video Note" }, type: 1 }
        ],
        footer: "Arslan-XMD Video Downloader",
        headerType: 4
      },
      { quoted: m }
    );

  } catch (e) {
    console.error(e);
    await Matrix.sendMessage(m.from, { text: "❌ Video error" }, { quoted: m });
  }
};

/* ================= BUTTON HANDLER ================= */
const vget = async (m, Matrix) => {
  try {
    const prefix = config.PREFIX || ".";
    const body = m.body || "";
    if (!body.startsWith(prefix + "vget")) return;

    const [, type, vid] = body.split(" ");
    const url = videoCache.get(vid);
    if (!url) return;

    await Matrix.sendMessage(m.from, {
      react: { text: "📥", key: m.key }
    });

    let data;
    try {
      data = await getIzumi(url);
    } catch {
      data = await getOkatsu(url);
    }

    if (type === "normal") {
      await Matrix.sendMessage(
        m.from,
        { video: { url: data.download }, mimetype: "video/mp4" },
        { quoted: m }
      );
    } else if (type === "document") {
      await Matrix.sendMessage(
        m.from,
        {
          document: { url: data.download },
          mimetype: "video/mp4",
          fileName: "video.mp4"
        },
        { quoted: m }
      );
    } else if (type === "ptv") {
      await Matrix.sendMessage(
        m.from,
        { video: { url: data.download }, mimetype: "video/mp4", ptv: true },
        { quoted: m }
      );
    }

    await Matrix.sendMessage(m.from, {
      react: { text: "✅", key: m.key }
    });

  } catch (e) {
    console.error(e);
  }
};

const song = async (m, Matrix) => {
  try {
    const prefix = config.Prefix || config.PREFIX || ".";
    const cmd = m.body?.startsWith(prefix) ? m.body.slice(prefix.length).split(" ")[0].toLowerCase() : "";
    const args = m.body.slice(prefix.length + cmd.length).trim().split(" ");

    if (cmd === "song") {
      if (args.length === 0 || !args.join(" ")) {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ Give me a song name or keywords to search 😎
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }

      const searchQuery = args.join(" ");
      await Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Arslan-XMD* huntin’ for "${searchQuery}"... 🎧
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });

      // Search YouTube for song info
      const searchResults = await ytSearch(searchQuery);
      if (!searchResults.videos || searchResults.videos.length === 0) {
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ No tracks found for "${searchQuery}". You slippin’! 💀
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }

      const song = searchResults.videos[0];
      const safeTitle = song.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_').substring(0, 100);
      const filePath = `${tmpDir}/${safeTitle}.mp3`;

      // Fetch download URL from the new API
      let apiResponse;
      try {
        const apiUrl = `https://api.giftedtech.web.id/api/download/dlmp3?apikey=gifted_api_se5dccy&url=${encodeURIComponent(song.url)}`;
        apiResponse = await fetch(apiUrl);
        if (!apiResponse.ok) {
          throw new Error(`API responded with status: ${apiResponse.status}`);
        }
        const data = await apiResponse.json();
        if (!data.success || !data.result.download_url) {
          throw new Error('API response missing download URL or failed');
        }

        // Send song info from yt-search and API
        const songInfo = `
◈━━━━━━━━━━━━━━━━◈
│❒ *Arslan-XMD* Song Intel 🔥
│❒ *Title*: ${song.title}
│❒ *Views*: ${song.views.toLocaleString()}
│❒ *Duration*: ${song.timestamp}
│❒ *Channel*: ${song.author.name}
│❒ *Quality*: ${data.result.quality}
│❒ *Uploaded*: ${song.ago}
│❒ *URL*: ${song.url}
◈━━━━━━━━━━━━━━━━◈`;
        await Matrix.sendMessage(m.from, { text: songInfo }, { quoted: m });

        // Download the audio file
        const downloadResponse = await fetch(data.result.download_url);
        if (!downloadResponse.ok) {
          throw new Error(`Failed to download audio: ${downloadResponse.status}`);
        }
        const fileStream = fs.createWriteStream(filePath);
        await streamPipeline(downloadResponse.body, fileStream);
      } catch (apiError) {
        console.error(`API error:`, apiError.message);
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Arslan-XMD* couldn’t hit the API for "${song.title}". Server’s actin’ up! 😡
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }

      // Send the audio file
      try {
        const doc = {
          audio: {
            url: filePath,
          },
          mimetype: 'audio/mpeg',
          ptt: false,
          fileName: `${safeTitle}.mp3`,
        };
        await Matrix.sendMessage(m.from, doc, { quoted: m });

        // Clean up temp file after 5 seconds
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`Deleted temp file: ${filePath}`);
            }
          } catch (cleanupErr) {
            console.error('Error during file cleanup:', cleanupErr);
          }
        }, 5000);
      } catch (sendError) {
        console.error(`Failed to send audio:`, sendError.message);
        return Matrix.sendMessage(m.from, {
          text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Arslan-XMD* can’t song "${song.title}". Failed to send audio 😣
◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });
      }

      await Matrix.sendMessage(m.from, {
        text: `◈━━━━━━━━━━━━━━━━◈
│❒ *${song.title}* dropped by *Arslan-XMD*! Blast it! 🎶
◈━━━━━━━━━━━━━━━━◈`,
      }, { quoted: m });
    }
  } catch (error) {
    console.error(`❌ song error: ${error.message}`);
    await Matrix.sendMessage(m.from, {
      text: `◈━━━━━━━━━━━━━━━━◈
│❒ *Arslan-XMD* hit a snag, fam! Try again or pick a better track! 😈
◈━━━━━━━━━━━━━━━━◈`,
    }, { quoted: m });
  }
};

export default song;
