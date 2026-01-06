import axios from "axios";
import yts from "yt-search";
import config from "../config.cjs";

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

export { video, vget };
