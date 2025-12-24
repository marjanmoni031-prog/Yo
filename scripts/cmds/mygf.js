const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mygf",
    author: "Hasib (modified with Grok's measurements)",
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

      // === Updated to match your exact template ===
      const width = 1280;  // Original template width
      const height = 720;  // Original template height
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Load background (your King & Queen template)
      const backgroundUrl = "https://i.postimg.cc/RFVB0KdS/grok-image-xang5o4.jpg";
      const background = await loadImage(backgroundUrl);
      ctx.drawImage(background, 0, 0, width, height);

      // Load profile pictures (high quality)
      const senderImage = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      const matchImage = await loadImage(
        `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      // Function to draw circular avatar
      function drawCircleAvatar(img, centerX, centerY, radius) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, centerX - radius, centerY - radius, radius * 2, radius * 2);
        ctx.restore();
      }

      // === Exact positions and size from your template ===
      const avatarRadius = 156; // Diameter 312px → radius 156px

      // Left circle - King (usually sender if male)
      drawCircleAvatar(senderImage, 340, 360, avatarRadius);

      // Right circle - Queen (matched person)
      drawCircleAvatar(matchImage, 940, 360, avatarRadius);

      // Save output
      const outputPath = path.join(__dirname, "pair_output.png");
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.toBuffer(); // Faster than streaming for most cases

      fs.writeFileSync(outputPath, stream);

      const lovePercent = Math.floor(Math.random() * 31) + 70;

      const message = `🥰 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹 𝗽𝗮𝗶𝗿𝗶𝗻𝗴\n` +
                      `・${senderName} 🎀\n` +
                      `・${matchName} 🎀\n` +
                      `💌 𝗪𝗶𝘀𝗵 𝘆𝗼𝘂 𝘁𝘄𝗼 𝗵𝘂𝗻𝗱𝗿𝗲𝗱 𝘆𝗲𝗮𝗿𝘀 𝗼𝗳 𝗵𝗮𝗽𝗽𝗶𝗻𝗲𝘀𝘀 ❤️❤️\n` +
                      `𝗟𝗼𝘃𝗲 𝗽𝗲𝗿𝗰𝗲𝗻𝘁𝗮𝗴𝗲: ${lovePercent}% 💙`;

      api.sendMessage(
        { body: message, attachment: fs.createReadStream(outputPath) },
        event.threadID,
        () => {
          fs.unlinkSync(outputPath); // Clean up
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
