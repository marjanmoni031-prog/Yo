const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const FONT_BASE =
  "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

// fallback avatar if FB dp is locked/unavailable
const FALLBACK_AVATAR = "https://i.imgur.com/6VBx3io.png";

module.exports = {
  config: {
    name: "pair2",
    aliases: ["lovepair2", "match2"],
    author: "Hasib",
    version: "1.1",
    role: 0,
    category: "love",
    shortDescription: {
      en: "💞 Love match with avatars"
    },
    longDescription: {
      en: "Finds a love match from the group and generates an image with circular avatars."
    },
    guide: {
      en: "{p}{n} — Use in a group chat"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // ===== Sender =====
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData?.name || "You";

      // ===== Thread Info =====
      const threadInfo = await api.getThreadInfo(event.threadID);
      const users = threadInfo.userInfo || [];
      const botID = api.getCurrentUserID();

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠️ Your gender is unavailable. Cannot find a match.",
          event.threadID,
          event.messageID
        );
      }

      // ===== Match Logic =====
      let candidates = [];
      if (myData.gender === "MALE") {
        candidates = users.filter(
          u => u.gender === "FEMALE" && u.id !== event.senderID && u.id !== botID
        );
      } else if (myData.gender === "FEMALE") {
        candidates = users.filter(
          u => u.gender === "MALE" && u.id !== event.senderID && u.id !== botID
        );
      }

      if (!candidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const matchUser =
        candidates[Math.floor(Math.random() * candidates.length)];
      let matchName = matchUser.name || "Unknown";

      // ===== Load Stylish Font =====
      let fontMap = {};
      try {
        const { data } = await axios.get(`${FONT_BASE}/21.json`);
        fontMap = data;
      } catch {}

      const fancy = text =>
        text.split("").map(ch => fontMap[ch] || ch).join("");

      senderName = fancy(senderName);
      matchName = fancy(matchName);

      // ===== Canvas =====
      const width = 735;
      const height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage("https://files.catbox.moe/4l3pgh.jpg");
      ctx.drawImage(bg, 0, 0, width, height);

      // ===== Load Avatars (same as your FIRST link) =====
      async function loadAvatar(uid) {
        try {
          return await loadImage(
            `https://graph.facebook.com/${uid}/picture?width=720&height=720`
          );
        } catch {
          return await loadImage(FALLBACK_AVATAR);
        }
      }

      const senderAvatar = await loadAvatar(event.senderID);
      const matchAvatar = await loadAvatar(matchUser.id);

      // ===== Draw Circular Avatar =====
      function drawCircle(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      drawCircle(senderAvatar, 64, 111, 123);
      drawCircle(matchAvatar, width - 187, 111, 123);

      // ===== Save Image =====
      const outputPath = path.join(__dirname, "pair2_output.png");
      fs.writeFileSync(outputPath, canvas.toBuffer());

      // ===== Message =====
      const love = Math.floor(Math.random() * 31) + 70;

      const msg = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${senderName}
🎀 ${matchName}

💘 Compatibility: ${love}% 💘

🕊️ Destiny has written your names together ✨`;

      api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(outputPath)
        },
        event.threadID,
        () => fs.unlinkSync(outputPath),
        event.messageID
      );
    } catch (err) {
      api.sendMessage(
        "❌ Error: " + err.message,
        event.threadID,
        event.messageID
      );
    }
  }
};
