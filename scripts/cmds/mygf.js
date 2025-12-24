const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "mygf",
    author: "Hasib",
    category: "TOOLS",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const threadData = await api.getThreadInfo(event.threadID);
      const users = threadData.userInfo;

      const mentions = event.mentions || {};
      const mentionIDs = Object.keys(mentions);
      const repliedUserID =
        event.type === "message_reply"
          ? event.messageReply.senderID
          : null;
      const senderID = event.senderID;

      let user1ID = null;
      let user2ID = null;

      // ===== Pair selection =====
      if (mentionIDs.length >= 2) {
        const filtered = mentionIDs.filter(id => id !== senderID);
        if (filtered.length < 2) {
          return api.sendMessage(
            "⚠️ Please mention two different users.",
            event.threadID,
            event.messageID
          );
        }
        user1ID = filtered[0];
        user2ID = filtered[1];
      } else if (mentionIDs.length === 1 && mentionIDs[0] !== senderID) {
        user1ID = senderID;
        user2ID = mentionIDs[0];
      } else if (repliedUserID && repliedUserID !== senderID) {
        user1ID = senderID;
        user2ID = repliedUserID;
      }

      let baseUserID;
      let matchName;
      let sIdImage;
      let pairPersonImage;

      // ===== Manual pairing =====
      if (user1ID && user2ID) {
        const user1 = users.find(u => u.id === user1ID);
        const user2 = users.find(u => u.id === user2ID);

        if (!user1 || !user2 || !user1.gender || !user2.gender) {
          return api.sendMessage(
            "⚠️ Couldn't determine gender.",
            event.threadID,
            event.messageID
          );
        }

        if (user1.gender === user2.gender) {
          return api.sendMessage(
            "⚠️ Same gender pairing not allowed.",
            event.threadID,
            event.messageID
          );
        }

        baseUserID = user1ID;
        matchName = user2.name;

        sIdImage = await loadImage(
          `https://graph.facebook.com/${user1ID}/picture?width=720&height=720`
        );
        pairPersonImage = await loadImage(
          `https://graph.facebook.com/${user2ID}/picture?width=720&height=720`
        );
      }
      // ===== Random pairing =====
      else {
        const senderData = users.find(u => u.id === senderID);
        if (!senderData || !senderData.gender) {
          return api.sendMessage(
            "⚠️ Could not determine your gender.",
            event.threadID,
            event.messageID
          );
        }

        const candidates =
          senderData.gender === "MALE"
            ? users.filter(u => u.gender === "FEMALE" && u.id !== senderID)
            : users.filter(u => u.gender === "MALE" && u.id !== senderID);

        if (!candidates.length) {
          return api.sendMessage(
            "❌ No suitable match found.",
            event.threadID,
            event.messageID
          );
        }

        const selectedMatch =
          candidates[Math.floor(Math.random() * candidates.length)];

        baseUserID = senderID;
        matchName = selectedMatch.name;

        sIdImage = await loadImage(
          `https://graph.facebook.com/${senderID}/picture?width=720&height=720`
        );
        pairPersonImage = await loadImage(
          `https://graph.facebook.com/${selectedMatch.id}/picture?width=720&height=720`
        );
      }

      const baseUserData = await usersData.get(baseUserID);
      const senderName = baseUserData.name;

      // ===== Canvas =====
      const background = await loadImage(
        "https://i.postimg.cc/RFVB0KdS/grok-image-xang5o4.jpg"
      );

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0);

      // ===== Circular avatar function =====
      const avatarSize = 240;

      function drawCircleImage(ctx, img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // 👑 King (sender)
      drawCircleImage(ctx, sIdImage, 231, 329, avatarSize);

      // 👑 Queen (match)
      drawCircleImage(ctx, pairPersonImage, 717, 288, avatarSize);

      // ===== Save image =====
      const outputPath = path.join(__dirname, "pair_output.png");
      const out = fs.createWriteStream(outputPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);

      out.on("finish", () => {
        const lovePercent = Math.floor(Math.random() * 31) + 70;
        api.sendMessage(
          {
            body:
              `👑 KING & QUEEN 👑\n\n` +
              `🤴 ${senderName}\n` +
              `👸 ${matchName}\n` +
              `💖 Love: ${lovePercent}%`,
            attachment: fs.createReadStream(outputPath),
          },
          event.threadID,
          () => fs.unlinkSync(outputPath),
          event.messageID
        );
      });
    } catch (err) {
      api.sendMessage(
        "❌ Error:\n" + err.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
