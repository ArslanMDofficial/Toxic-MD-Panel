import moment from "moment-timezone";
import axios from "axios";
import yts from "yt-search";

// Time logic (same as menu.js)
const xtime = moment.tz("Asia/Karachi").format("HH:mm:ss");
const xdate = moment.tz("Asia/Karachi").format("DD/MM/YYYY");
const time2 = moment().tz("Asia/Karachi").format("HH:mm:ss");

// Fancy font utility (same as menu.js)
function toFancyFont(text, isUpperCase = false) {
  const fonts = {
    A: "𝘼", B: "𝘽", C: "𝘾", D: "𝘿", E: "𝙀", F: "𝙁", G: "𝙂", H: "𝙃", 
    I: "𝙄", J: "𝙅", K: "𝙆", L: "𝙇", M: "𝙈", N: "𝙉", O: "𝙊", P: "𝙋", 
    Q: "𝙌", R: "𝙍", S: "𝙎", T: "𝙏", U: "𝙐", V: "𝙑", W: "𝙒", X: "𝙓", 
    Y: "𝙔", Z: "𝙕", a: "𝙖", b: "𝙗", c: "𝙘", d: "𝙙", e: "𝙚", f: "𝙛", 
    g: "𝙜", h: "𝙝", i: "𝙞", j: "𝙟", k: "𝙠", l: "𝙡", m: "𝙢", n: "𝙣", 
    o: "𝙤", p: "𝙥", q: "𝙦", r: "𝙧", s: "𝙨", t: "𝙩", u: "𝙪", v: "𝙫", 
    w: "𝙬", x: "𝙭", y: "𝙮", z: "𝙯"
  };
  
  const formattedText = isUpperCase ? text.toUpperCase() : text;
  return formattedText
    .split("")
    .map((char) => fonts[char] || char)
    .join("");
}

// Retry helper (from your working code)
async function tryRequest(getter, attempts = 3) {
    let last;
    for (let i = 1; i <= attempts; i++) {
        try { return await getter(); } 
        catch (e) { last = e; if(i<attempts) await new Promise(r => setTimeout(r, 1000*i)); }
    }
    throw last;
}

// Video APIs (from your working code)
async function getIzumiVideoByUrl(url) {
    const api = `https://izumiiiiiiii.dpdns.org/downloader/youtube?url=${encodeURIComponent(url)}&format=720`;
    const res = await tryRequest(() => axios.get(api, {
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }));
    if(res?.data?.result?.download) return res.data.result;
    throw new Error("Izumi API has no download link");
}

async function getOkatsuVideoByUrl(url) {
    const api = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=${encodeURIComponent(url)}`;
    const res = await tryRequest(() => axios.get(api, {
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }));
    if(res?.data?.result?.mp4) {
        return { download: res.data.result.mp4, title: res.data.result.title };
    }
    throw new Error("Okatsu API has no mp4");
}

// Main video command
const videoCommand = async (m, Matrix) => {
    try {
        const prefix = '.'; // Aapka bot prefix
        const body = m.body || "";
        const args = body.slice(prefix.length).trim().split(" ");
        const cmd = args[0].toLowerCase();
        const query = args.slice(1).join(" ");

        if (cmd === "video" || cmd === "ytmp4" || cmd === "mp4" || cmd === "videos") {
            if (!query) {
                const helpText = `◈━━━━━━━━━━━━━━━━◈
│❒ ${toFancyFont("Video Downloader")} 🎬
│
│ 📌 *${toFancyFont("Usage")}:* .video <song name/url>
│ 
│ ✘ *${toFancyFont("Examples")}:*
│   .video baby shark
│   .video https://youtu.be/xxxx
│   .video https://youtube.com/watch?v=xxxx
│
│ 📥 *${toFancyFont("Features")}:*
│   ✅ YouTube Video Download
│   ✅ Multiple Quality Options
│   ✅ Fast & Reliable
│   ✅ Interactive Buttons
◈━━━━━━━━━━━━━━━━◈`;

                const buttons = [
                    {
                        buttonId: `${prefix}video tutorial`,
                        buttonText: { displayText: "📹 Tutorial" },
                        type: 1
                    },
                    {
                        buttonId: `${prefix}play baby shark`,
                        buttonText: { displayText: "🔍 Example" },
                        type: 1
                    },
                    {
                        buttonId: `${prefix}download-menu`,
                        buttonText: { displayText: "📥 Download Menu" },
                        type: 1
                    }
                ];

                return await Matrix.sendMessage(m.from, {
                    text: helpText,
                    footer: "Pσɯҽɾҽԃ Ⴆყ ᴀʀꜱʟᴀɴ-ɱԃȥ",
                    buttons: buttons,
                    headerType: 1,
                    mentions: [m.sender]
                }, { quoted: m });
            }

            // Searching reaction
            await Matrix.sendMessage(m.from, { 
                react: { text: "🔍", key: m.key } 
            });

            // Search YouTube
            const search = await yts(query);
            if (!search?.videos?.length) {
                return await Matrix.sendMessage(m.from, {
                    text: `◈━━━━━━━━━━━━━━━━◈
│❒ No video found! 😔
│ ✘ Try different keywords
│ ✘ Make sure spelling is correct
◈━━━━━━━━━━━━━━━━◈`
                }, { quoted: m });
            }

            const info = search.videos[0];
            const videoUrl = info.url;

            // Encode video URL for button callbacks
            const encodedUrl = Buffer.from(videoUrl).toString('base64');

            const caption = `◈━━━━━━━━━━━━━━━━◈
│❒ ${toFancyFont("YouTube Video Found")} 🎬
│
│ 📌 *${toFancyFont("Title")}:* ${info.title}
│ ⏱️ *${toFancyFont("Duration")}:* ${info.timestamp || 'N/A'}
│ 👁️ *${toFancyFont("Views")}:* ${info.views?.toLocaleString() || 'N/A'}
│ 👤 *${toFancyFont("Channel")}:* ${info.author?.name || 'N/A'}
│ 📅 *${toFancyFont("Uploaded")}:* ${info.ago || 'N/A'}
◈━━━━━━━━━━━━━━━━◈

*Choose download format:*`;

            // Create buttons for format selection
            const buttons = [
                {
                    buttonId: `${prefix}vdmp4 ${encodedUrl}`,
                    buttonText: { displayText: "🎬 Normal Video" },
                    type: 1
                },
                {
                    buttonId: `${prefix}vddoc ${encodedUrl}`,
                    buttonText: { displayText: "📁 Document" },
                    type: 1
                },
                {
                    buttonId: `${prefix}vdptv ${encodedUrl}`,
                    buttonText: { displayText: "📹 Video Note" },
                    type: 1
                }
            ];

            // Send video info with buttons
            await Matrix.sendMessage(m.from, {
                image: { url: info.thumbnail },
                caption: caption,
                footer: "Pσɯҽɾҽԃ Ⴆყ ᴀʀꜱʟᴀɴ-ɱԃȥ",
                buttons: buttons,
                headerType: 4,
                mentions: [m.sender],
                contextInfo: {
                    externalAdReply: {
                        title: `${toFancyFont("Arslan-MD")} Video Downloader`,
                        body: `Download ${info.title.substring(0, 30)}...`,
                        thumbnail: info.thumbnail,
                        sourceUrl: videoUrl,
                        mediaType: 1
                    }
                }
            }, { quoted: m });
        }

        // Handle button callbacks for video download
        else if (cmd === "vdmp4" || cmd === "vddoc" || cmd === "vdptv") {
            const encodedUrl = args[1];
            if (!encodedUrl) return;

            const videoUrl = Buffer.from(encodedUrl, 'base64').toString('ascii');
            
            // Downloading reaction
            await Matrix.sendMessage(m.from, { 
                react: { text: "⏬", key: m.key } 
            });

            let videoData;
            try { 
                videoData = await getIzumiVideoByUrl(videoUrl); 
            } catch(e) { 
                try {
                    videoData = await getOkatsuVideoByUrl(videoUrl);
                } catch(err) {
                    return await Matrix.sendMessage(m.from, {
                        text: `◈━━━━━━━━━━━━━━━━◈
│❒ Download failed! 😔
│ ✘ All APIs are down
│ ✘ Try again later
◈━━━━━━━━━━━━━━━━◈`
                    }, { quoted: m });
                }
            }

            if (cmd === "vdmp4") {
                // Send as normal video
                await Matrix.sendMessage(m.from, { 
                    video: { url: videoData.download }, 
                    mimetype: "video/mp4", 
                    caption: `*${videoData.title || 'YouTube Video'}*\n\n⬇️ Downloaded via ${toFancyFont("Arslan-MD")}`
                }, { quoted: m });
            } 
            else if (cmd === "vddoc") {
                // Send as document
                await Matrix.sendMessage(m.from, { 
                    document: { url: videoData.download }, 
                    mimetype: "video/mp4", 
                    fileName: `${(videoData.title || 'video').substring(0, 50)}.mp4`,
                    caption: `*${videoData.title || 'YouTube Video'}*\n\n📁 Document via ${toFancyFont("Arslan-MD")}`
                }, { quoted: m });
            } 
            else if (cmd === "vdptv") {
                // Send as video note (PTV)
                await Matrix.sendMessage(m.from, { 
                    video: { url: videoData.download }, 
                    mimetype: "video/mp4",
                    ptv: true,
                    caption: `📹 Video Note\n${videoData.title || ''}`
                }, { quoted: m });
            }

            // Success reaction
            await Matrix.sendMessage(m.from, { 
                react: { text: "✅", key: m.key } 
            });
        }

    } catch (error) {
        console.error("❌ Video command error:", error);
        await Matrix.sendMessage(m.from, {
            text: `◈━━━━━━━━━━━━━━━━◈
│❒ Video command failed! 😡
│ ✘ Error: ${error.message}
│ ✘ Try again later
◈━━━━━━━━━━━━━━━━◈`
        }, { quoted: m });
    }
};

export default videoCommand;
