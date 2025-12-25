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

      const matchCandidates =
        myGender === "MALE"
          ? users.filter(u => normalizeGender(u.gender) === "FEMALE" && u.id !== event.senderID)
          : users.filter(u => normalizeGender(u.gender) === "MALE" && u.id !== event.senderID);

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
      const canvas = createCanvas(1344, 768);
      const ctx = canvas.getContext("2d");

      // ================= BACKGROUND =================
      const backgroundUrl =
        "https://i.postimg.cc/RFVB0KdS/grok-image-xang5o4.jpg";
      const background = await loadImage(backgroundUrl);
      ctx.drawImage(background, 0, 0, 1344, 768);

      // ================= PLACEHOLDER =================
      const placeholderPath = path.join(__dirname, "placeholder.png");
      const placeholder = fs.existsSync(placeholderPath)
        ? await loadImage(placeholderPath)
        : null;

      // ================= PROFILE IMAGE =================
      async function loadProfilePic(uid) {
        try {
          return await loadImage(
            `https://graph.facebook.com/${uid}/picture?width=720&height=720`
          );
        } catch {
          return placeholder;
        }
      }

      const senderImage = await loadProfilePic(event.senderID);
      const matchImage = await loadProfilePic(selectedMatch.id);

      // ================= ELLIPSE AVATAR =================
      function drawEllipseAvatar(img, cx, cy, rx, ry) {
        if (!img) return;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, cx - rx, cy - ry, rx * 2, ry * 2);
        ctx.restore();
      }

      // ================= AVATAR SIZE =================
      const rx = 175;
      const ry = 177;

      // ================= FINAL POSITIONS (OPTION B) =================
      drawEllipseAvatar(senderImage, 520, 360, rx, ry); // 👑 King
      drawEllipseAvatar(matchImage, 340, 360, rx, ry); // 👑 Queen

      // ================= SAVE =================
      const outputPath = path.join(
        __dirname,
        `pair_${event.senderID}_${Date.now()}.png`
      );
      await fs.promises.writeFile(outputPath, canvas.toBuffer());

      // ================= MESSAGE =================
      const lovePercent = Math.min(
        100,
        60 + Math.floor(Math.random() * 20) + senderName.length + matchName.length
      );

      api.sendMessage(
        {
          body:
            `🥰 Successful pairing\n` +
            `・${senderName} 👑\n` +
            `・${matchName} 👑\n` +
            `💖 Love Percentage: ${lovePercent}%`,
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
