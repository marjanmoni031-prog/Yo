const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "pair5",
    author: "Hasib",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderData = await usersData.get(event.senderID);
      const senderName = senderData.name;

      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const myData = users.find((user) => user.id === event.senderID);
      if (!myData || !myData.gender)
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);

      const myGender = myData.gender;
      let matchCandidates = [];

      if (myGender === "MALE") {
        matchCandidates = users.filter(u => u.gender === "FEMALE" && u.id !== event.senderID);
      } else if (myGender === "FEMALE") {
        matchCandidates = users.filter(u => u.gender === "MALE" && u.id !== event.senderID);
      } else {
        return api.sendMessage("⚠️ Your gender is undefined. Cannot find a match.", event.threadID, event.messageID);
      }

      if (matchCandidates.length === 0)
        return api.sendMessage("❌ No suitable match found in the group.", event.threadID, event.messageID);

      const selectedMatch = matchCandidates[Math.floor(Math.random() * matchCandidates.length)];
      const matchName = selectedMatch.name;

      // Canvas
      const width = 800, height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const backgroundUrl = "https://i.imgur.com/OntEBiq.png";
      const background = await loadImage(backgroundUrl);

      const senderImage = await loadImage(`https://graph.facebook.com/${event.senderID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
      const matchImage = await loadImage(`https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

      ctx.drawImage(background, 0, 0, width, height);
      ctx.drawImage(senderImage, 385, 40, 170, 170);
      ctx.drawImage(matchImage, width - 213, 190, 180, 170);

      // Save image
      const outputPath = path.join(__dirname, "pair_output.png");
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70; // 70-100%
        const fancySender = senderName;
        const fancyMatch = matchName;

        const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${fancySender} ✨️
🎀 ${fancyMatch} ✨️

🕊️ 𝓓𝓮𝓼𝓽𝓲𝔫𝔂 𝓱𝓪𝓼 𝔀𝓻𝓲𝓽𝓽𝓮𝓷 𝔂𝓸𝓾𝓻 𝓷𝓪𝓶𝓮𝓼 𝓽𝓸𝓰𝓮𝓽𝓱𝓮𝓻 🌹 𝓜𝓪𝔂 𝔂𝓸𝓾𝓻 𝓫𝓸𝓷𝓭 𝓵𝓪𝓼𝓽 𝓯𝓸𝓻𝓮𝓿𝓮𝓻 ✨️  

💘 𝙲𝚘𝚖𝚙𝚊𝚝𝚒𝚋𝚒𝚕𝚒𝚝𝚢: ${lovePercent}% 💘`;

        api.sendMessage(
          { body: message, attachment: fs.createReadStream(outputPath) },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });

    } catch (err) {
      api.sendMessage("❌ An error occurred: " + err.message, event.threadID, event.messageID);
    }
  }
};
