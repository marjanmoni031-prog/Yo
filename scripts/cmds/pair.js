const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

const baseUrl = "https://raw.githubusercontent.com/Saim12678/Saim69/1a8068d7d28396dbecff28f422cb8bc9bf62d85f/font";

module.exports = {
  config: {
    name: "pair",
    author: "Hasib",
    category: "love",
    version: "1.1",
    role: 0,
    shortDescription: {
      en: "💘 Generate a love match between you and another group member"
    },
    longDescription: {
      en: "This command calculates a love match between you and a suitable member of the current group based on gender."
    },
    guide: {
      en: "{p}{n} — Use this command in a group"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      let senderName = senderData?.name || "You";

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo || [];

      const myData = users.find(u => u.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠️ Gender data not found. Try again later.",
          event.threadID,
          event.messageID
        );
      }

      // Facebook gender: 1 = Female, 2 = Male
      const myGender = myData.gender;
      let matchCandidates = [];

      if (myGender === 2) {
        matchCandidates = users.filter(u => u.gender === 1 && u.id !== event.senderID);
      } else if (myGender === 1) {
        matchCandidates = users.filter(u => u.gender === 2 && u.id !== event.senderID);
      }

      if (!matchCandidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in this group.",
          event.threadID,
          event.messageID
        );
      }

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      let matchName = selectedMatch?.name || "Unknown";

      // --- Fancy font load ---
      let fontMap = {};
      try {
        const { data } = await axios.get(`${baseUrl}/21.json`);
        fontMap = data || {};
      } catch (_) {}

      const convertFont = text =>
        text.split("").map(c => fontMap[c] || c).join("");

      senderName = convertFont(senderName);
      matchName = convertFont(matchName);

      // --- Canvas ---
      const width = 735, height = 411;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage("https://files.catbox.moe/g6lr9y.jpg");
      ctx.drawImage(bg, 0, 0, width, height);

      const senderImg = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`
      );
      const partnerImg = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720`
      );

      const drawCircle = (img, x, y, size) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      };

      drawCircle(senderImg, 131, 128, 154);
      drawCircle(partnerImg, width - 302, 128, 154);

      const filePath = path.join(__dirname, `pair_${event.senderID}.png`);
      const out = fs.createWriteStream(filePath);
      canvas.createPNGStream().pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;

        api.sendMessage(
          {
            body:
`💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${senderName}
🎀 ${matchName}

💘 Compatibility: ${lovePercent}% 💘`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => fs.unlinkSync(filePath),
          event.messageID
        );
      });

    } catch (err) {
      api.sendMessage(
        "❌ Error: " + err.message,
        event.threadID,
        event.messageID
      );
    }
  }
};
