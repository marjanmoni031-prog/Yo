const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mygf",
    author: "Hasib (Perfect fit template)",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // ================= USER DATA =================
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData?.name || "Unknown";

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      function normalizeGender(g) {
        if (g === "MALE" || g === 1) return "MALE";
        if (g === "FEMALE" || g === 2) return "FEMALE";
        return null;
      }

      const myData = users.find(u => u.id === event.senderID);
      const myGender = normalizeGender(myData?.gender);

      if (!myGender) {
        return api.sendMessage(
          "⚠️ Could not determine your gender.",
          event.threadID,
          event.messageID
        );
      }

      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(
          u => normalizeGender(u.gender) === "FEMALE" && u.id !== event.senderID
        );
      } else {
        matchCandidates = users.filter(
          u => normalizeGender(u.gender) === "MALE" && u.id !== event.senderID
        );
      }

      if (!matchCandidates.length) {
        return api.sendMessage(
          "❌ No suitable match found in the group.",
          event.threadID,
          event.messageID
        );
      }

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];

      const matchName = selectedMatch.name || "Unknown";

      // ================= CANVAS =================
      const width = 1344;
      const height = 768;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ================= BACKGROUND =================
      const backgroundUrl =
        "https://i.postimg.cc/RFVB0KdS/grok-image-xang5o4.jpg";
      const background = await loadImage(backgroundUrl);
      ctx.drawImage(background, 0, 0, width, height);

      // ================= PLACEHOLDER =================
      const placeholderPath = path.join(__dirname, "placeholder.png");
      const placeholder = fs.existsSync(placeholderPath)
        ? await loadImage(placeholderPath)
        : null;

      // ================= PROFILE IMAGE =================
      async function loadProfilePic(userId) {
        try {
          const url = `https://graph.facebook.com/${userId}/picture?width=720&height=720`;
          return await loadImage(url);
        } catch {
          return placeholder;
        }
      }

      const senderImage = await loadProfilePic(event.senderID);
      const matchImage = await loadProfilePic(selectedMatch.id);

      // ================= ELLIPSE AVATAR =================
      function drawEllipseAvatar(img, centerX, centerY, radiusX, radiusY) {
        if (!img) return;

        ctx.save();
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
          img,
          centerX - radiusX,
          centerY - radiusY,
          radiusX * 2,
          radiusY * 2
        );

        ctx.restore();
      }

      // ================= AVATAR SIZE =================
      const avatarRadiusX = 175; // 350 / 2
      const avatarRadiusY = 177; // 354 / 2

      // ================= DRAW AVATARS (PERFECT FIT) =================
      // King (Left)
      drawEllipseAvatar(senderImage, 352, 360, avatarRadiusX, avatarRadiusY);

      // Queen (Right)
      drawEllipseAvatar(matchImage, 992, 360, avatarRadiusX, avatarRadiusY);

      // ================= SAVE IMAGE =================
      const outputPath = path.join(
        __dirname,
        `pair_${event.senderID}_${Date.now()}.png`
      );

      const buffer = canvas.toBuffer("image/png");
      await fs.promises.writeFile(outputPath, buffer);

      // ================= LOVE PERCENT =================
      const base = 60 + Math.floor(Math.random() * 20);
      const nameBonus = Math.min(20, senderName.length + matchName.length);
      const lovePercent = Math.min(100, base + nameBonus);

      const message =
        `🥰 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴\n` +
        `・${senderName} 👑\n` +
        `・${matchName} 👑\n` +
        `💌 𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 ❤️\n` +
        `💖 𝗟𝗼𝘃𝗲 𝗣𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}%`;

      api.sendMessage(
        {
          body: message,
          attachment: fs.createReadStream(outputPath),
        },
        event.threadID,
        () => fs.promises.unlink(outputPath).catch(() => {}),
        event.messageID
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Error while creating the pair image.\n" + err.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
