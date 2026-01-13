const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mygf",
    aliases: ["mybf", "couple"],
    author: "Hasib",
    category: "mygf",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // Get thread users
      const threadData = await api.getThreadInfo(event.threadID);
      const usersObj = threadData.userInfo || {};
      const users = Array.isArray(usersObj)
        ? usersObj
        : Object.entries(usersObj).map(([id, u]) => ({ id, ...u }));

      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);
      const repliedUserID = event.type === "message_reply" ? event.messageReply.senderID : null;
      const senderID = event.senderID;

      // Get sender data
      const senderData = users.find(u => u.id === senderID);
      if (!senderData || !senderData.gender) {
        return api.sendMessage("⚠️ Could not determine your gender.", event.threadID, event.messageID);
      }
      const senderGender = (senderData.gender || "").toString().toUpperCase();

      let user1ID = senderID;
      let user2ID = null;

      // --- 1️⃣ Mentions check ---
      if (mentionIDs.length > 0) {
        const firstMention = users.find(u => u.id === mentionIDs[0]);
        if (!firstMention || !firstMention.gender) {
          return api.sendMessage("⚠️ Could not determine the mentioned user's gender.", event.threadID, event.messageID);
        }

        const mentionGender = (firstMention.gender || "").toString().toUpperCase();
        if (mentionGender === senderGender) {
          return api.sendMessage("⚠️ You cannot mention someone of the same gender!", event.threadID, event.messageID);
        }

        user2ID = firstMention.id;
      } 
      // --- 2️⃣ Reply check ---
      else if (repliedUserID) {
        const repliedUser = users.find(u => u.id === repliedUserID);
        if (!repliedUser || !repliedUser.gender) {
          return api.sendMessage("⚠️ Could not determine the replied user's gender.", event.threadID, event.messageID);
        }

        const replyGender = (repliedUser.gender || "").toString().toUpperCase();
        if (replyGender === senderGender) {
          return api.sendMessage("⚠️ You cannot reply to someone of the same gender!", event.threadID, event.messageID);
        }

        user2ID = repliedUserID;
      }

      // --- 3️⃣ Random opposite-gender selection ---
      if (!user2ID) {
        const oppositeGenderUsers = users.filter(u => {
          const g = (u.gender || "").toString().toUpperCase();
          return u.id !== senderID && (
            (senderGender === "MALE" && (g === "FEMALE" || g === "F")) ||
            (senderGender === "FEMALE" && (g === "MALE" || g === "M"))
          );
        });

        if (oppositeGenderUsers.length === 0) {
          return api.sendMessage("❌ No opposite-gender users found in the group.", event.threadID, event.messageID);
        }

        const selectedRandom = oppositeGenderUsers[Math.floor(Math.random() * oppositeGenderUsers.length)];
        user2ID = selectedRandom.id;
      }

      const user1 = users.find(u => u.id === user1ID);
      const user2 = users.find(u => u.id === user2ID);

      // --- 4️⃣ Load avatars ---
      const safeLoadImage = async (url) => {
        try { return await loadImage(url); }
        catch (err) { throw new Error("Failed to load image: " + err.message); }
      };

      const sIdImage = await safeLoadImage(
        `https://graph.facebook.com/${user1ID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );
      const pairPersonImage = await safeLoadImage(
        `https://graph.facebook.com/${user2ID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
      );

      // --- 5️⃣ Get sender name from usersData if possible ---
      let senderName = user1.name;
      try {
        const data = await usersData.get(user1ID);
        if (data && data.name) senderName = data.name;
      } catch (err) {}

      const matchName = user2.name;

      // --- 6️⃣ Create canvas ---
      const width = 800;
      const height = 400;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await safeLoadImage("https://i.postimg.cc/tRFY2HBm/0602f6fd6933805cf417774fdfab157e.jpg");
      ctx.drawImage(background, 0, 0, width, height);
      ctx.drawImage(sIdImage, 385, 40, 170, 170);
      ctx.drawImage(pairPersonImage, width - 213, 190, 180, 170);

      // --- 7️⃣ Output file ---
      const outputPath = path.join(__dirname, `pair_output_${Date.now()}.png`);
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70; // 70-100%

        const messageBody = `🎉 𝐇𝐲𝐞 𝐭𝐰𝐨 𝐬𝐨𝐮𝐥𝐦𝐚𝐭𝐞𝐬 💫
${senderName} & ${matchName}
💘 Love Percentage: ${lovePercent}%
💌 𝓨𝓸𝓾 𝓫𝓸𝓽𝓱 𝔀𝓲𝓵𝓵 𝓫𝓮 𝓯𝓾𝓽𝓾𝓻𝐞 𝓱𝓾𝓼𝓫𝓪𝓷𝐝 & 𝔀𝓲𝓯𝓮
𝓐𝓵𝔀𝓪𝔂𝓼 𝓫𝓮 𝓵𝓸𝔂𝓪𝓵 𝓽𝓸 𝓮𝓪𝓬𝓱 𝓸𝓽𝓱𝓮𝓻
𝓜𝓪𝔂 𝓐𝓵𝓵𝓪𝓱 𝓴𝓮𝓮𝓹 𝔂𝓸𝓾 𝓽𝓸𝓰𝓮𝓽𝓱𝓮𝓻 𝓯𝓸𝓻𝓮𝓿𝓮𝓻 💕`;

        api.sendMessage(
          {
            body: messageBody,
            attachment: fs.createReadStream(outputPath),
          },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ An error occurred: " + (error.message || error), event.threadID, event.messageID);
    }
  },
};
