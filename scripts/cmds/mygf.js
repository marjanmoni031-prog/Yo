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
      const { threadID, messageID, senderID } = event;
      const threadInfo = await api.getThreadInfo(threadID);
      const users = threadInfo.userInfo;

      const mentions = Object.keys(event.mentions || {});
      const replyID =
        event.type === "message_reply"
          ? event.messageReply.senderID
          : null;

      let targetUserID;

      // ───── CASE 1: Mention 2 users ─────
      if (mentions.length >= 2) {
        targetUserID = mentions[1]; // Only the 2nd mentioned user
      }

      // ───── CASE 2: Mention 1 user ─────
      else if (mentions.length === 1) {
        targetUserID = mentions[0]; // Only mentioned user
      }

      // ───── CASE 3: Reply ─────
      else if (replyID) {
        targetUserID = replyID; // Only replied user
      }

      // ❌ No reply & no mention
      else {
        return api.sendMessage(
          "⚠️ Please reply to someone or mention user(s).\n\nExamples:\n• pair5 @user\n• pair5 @user1 @user2\n• Reply + pair5",
          threadID,
          messageID
        );
      }

      const targetUser = users.find(u => u.id === targetUserID);

      if (!targetUser)
        return api.sendMessage(
          "⚠️ Couldn't find the user info.",
          threadID,
          messageID
        );

      // ───── Load avatar ─────
      const avatar = await loadImage(
        `https://graph.facebook.com/${targetUserID}/picture?width=720&height=720`
      );

      // ───── Canvas ─────
      const canvas = createCanvas(400, 400);
      const ctx = canvas.getContext("2d");

      const bg = await loadImage(
        "https://i.postimg.cc/tRFY2HBm/0602f6fd6933805cf417774fdfab157e.jpg"
      );
      ctx.drawImage(bg, 0, 0, 400, 400);

      ctx.drawImage(avatar, 120, 100, 160, 160);

      const filePath = path.join(__dirname, "pair.png");
      const stream = fs.createWriteStream(filePath);
      canvas.createPNGStream().pipe(stream);

      stream.on("finish", async () => {
        const targetName = (await usersData.get(targetUserID)).name;

        // ✅ Custom message with only target user name
        const message = `আমার গল্পে, আমার সাহিত্যে, আমার উপন্যাসে নিঃসন্দেহে ${targetName} ভীষণ সুন্দর! 🤍🌻😻😫`;

        api.sendMessage(
          {
            body: message,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          () => fs.unlinkSync(filePath),
          messageID
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
