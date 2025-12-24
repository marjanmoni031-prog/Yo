const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mygf",
    author: "Hasib (Grok template improved)",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find((user) => user.id === event.senderID);
      if (!myData || !myData.gender) {
        return api.sendMessage(
          "⚠️ Could not determine your gender.",
          event.threadID,
          event.messageID
        );
      }

      const myGender = myData.gender;
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(
          (user) => user.gender === "FEMALE" && user.id !== event.senderID
        );
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(
          (user) => user.gender === "MALE" && user.id !== event.senderID
        );
      } else {
        return api.sendMessage(
          "⚠️ Your gender is undefined. Cannot find a match.",
          event.threadID,
          event.messageID
        );
      }

      if (matchCandidates.length === 0) {
        return api.sendMessage(
          "❌ No suitable match found in the group.",
          event.threadID,
          event.messageID
        );
      }

      const selectedMatch =
        matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      // Canvas dimensions (template)
      const width = 1280;
      const height = 720;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Load background template
      const backgroundUrl = "https://i.postimg.cc/RFVB0KdS/grok-image-xang5o4.jpg";
      const background = await loadImage(backgroundUrl);
      ctx.drawImage(background, 0, 0, width, height);

      // Helper: fallback avatar
      const placeholderPath = path.join(__dirname, "placeholder.png");
      const placeholder = fs.existsSync(placeholderPath)
        ? await loadImage(placeholderPath)
        : null;

      // Helper function to load profile pic with fallback
      async function loadProfilePic(userId) {
        try {
          const url = `https://graph.facebook.com/${userId}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          return await loadImage(url);
        } catch (err) {
          return placeholder;
        }
      }

      const senderImage = await loadProfilePic(event.senderID);
      const matchImage = await loadProfilePic(selectedMatch.id);

      // Draw circular avatar
      function drawCircleAvatar(img, centerX, centerY, radius) {
        if (!img) return;
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      // Avatar positions
      const avatarRadius = 156; // Diameter 312px → radius 156px
      drawCircleAvatar(senderImage, width * 0.266, height * 0.5, avatarRadius); // left
      drawCircleAvatar(matchImage, width * 0.734, height * 0.5, avatarRadius); // right

      // Save output
      const outputPath = path.join(__dirname, `pair_${event.senderID}.png`);
      const buffer = canvas.toBuffer();
      await fs.promises.writeFile(outputPath, buffer);

      // Calculate love percentage (optional: based on name length)
      const lovePercent = Math.min(
        100,
        50 + Math.floor((senderName.length + matchName.length) * 2 + Math.random() * 20)
      );

      const message = `🥰 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴\n` +
                      `・${senderName} 🎀\n` +
                      `・${matchName} 🎀\n` +
                      `💌 𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 ❤️❤️\n` +
                      `𝗟𝗼𝘃𝗲 𝗽𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙`;

      api.sendMessage(
        { body: message, attachment: fs.createReadStream(outputPath) },
        event.threadID,
        () => {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        },
        event.messageID
      );

    } catch (error) {
      console.error(error);
      api.sendMessage(
        "❌ An error occurred while creating the pair image.\n" + error.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
