const { createCanvas, loadImage } = require("canvas");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "myqueen",
    aliases: ["myking", "queen", "king"],
    version: "3.0",
    author: "Hasib",
    category: "love",
    role: 0,
    shortDescription: { en: "💍 Future life partner matcher" },
    longDescription: { en: "Match yourself with someone by replying or mentioning them." },
    guide: { en: "{p}{n} — reply to a message or mention someone" }
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      // --------- GET TARGET (reply or mention) ---------
      let targetID;

      if (event.messageReply?.senderID) {
        targetID = event.messageReply.senderID;
      } else if (event.mentions && Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        return api.sendMessage(
          "⚠️ Please reply to someone or mention a user.",
          event.threadID,
          event.messageID
        );
      }

      if (targetID === event.senderID) {
        return api.sendMessage(
          "❌ You cannot pair with yourself.",
          event.threadID,
          event.messageID
        );
      }

      // --------- USER DATA ---------
      const senderData = await usersData.get(event.senderID);
      const targetData = await usersData.get(targetID);

      const senderName = senderData.name;
      const targetName = targetData.name;

      // --------- CANVAS SETUP ---------
      const width = 960;
      const height = 547;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      const background = await loadImage(
        "https://i.postimg.cc/dQgn42LC/IMG-20260109-WA0000.jpg"
      );
      ctx.drawImage(background, 0, 0, width, height);

      // --------- DRAW CIRCLE AVATAR ---------
      function drawCircle(img, x, y, size) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      const size = 255;

      const senderImg = await loadImage(
        `https://graph.facebook.com/${event.senderID}/picture?width=720&height=720`
      );
      const targetImg = await loadImage(
        `https://graph.facebook.com/${targetID}/picture?width=720&height=720`
      );

      drawCircle(senderImg, 105, 162, size);
      drawCircle(targetImg, 599, 162, size);

      // --------- SAVE IMAGE ---------
      const filePath = path.join(__dirname, `pair_${event.senderID}.png`);
      const out = fs.createWriteStream(filePath);
      canvas.createPNGStream().pipe(out);

      out.on("finish", () => {
        const love = Math.floor(Math.random() * 31) + 70;

        const message =
`𝐅𝐮𝐭𝐮𝐫𝐞 𝐥𝐢𝐟𝐞 𝐩𝐚𝐫𝐭𝐧𝐞𝐫 💍
${senderName} ❤️ ${targetName}

𝐘𝐨𝐮 𝐛𝐨𝐭𝐡 𝐥𝐨𝐨𝐤 𝐬𝐨 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥 𝐭𝐨𝐠𝐞𝐭𝐡𝐞𝐫 ✨
𝐋𝐨𝐯𝐞 𝐩𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: ${love}%`;

        api.sendMessage(
          {
            body: message,
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
