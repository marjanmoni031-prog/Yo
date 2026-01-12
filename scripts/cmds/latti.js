const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

module.exports = {
  config: {
    name: "latti",
    aliases: ["usta", "latti", "kik"],
    version: "2.0.0",
    author: "Hasib",
    countDown: 5,
    role: 0,
    longDescription: "{p}latthi @mention or reply someone to kick them 🦶",
    category: "funny",
    guide: "{p}latthi and mention or reply to someone 🦶",
    usePrefix: true,
    premium: false
  },

  onStart: async function ({ api, message, event, usersData }) {

    /* 🔐 AUTHOR PROTECTION */
    const encoded = "SGFzaWI="; // Hasib
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    if (module.exports.config.author !== decoded) {
      return message.reply("Author change kora hoyeche. Please set author to Hasib 🙂");
    }

    const senderID = event.senderID;
    let targetID;

    // Mention or Reply detect
    const mentions = Object.keys(event.mentions || {});
    if (mentions.length > 0) {
      targetID = mentions[0];
    } else if (event.type === "message_reply") {
      targetID = event.messageReply?.senderID;
    }

    if (!targetID) {
      return message.reply("Kake latthi marte chao? take mention ba reply koro 🌚");
    }

    /* 👑 OWNER FUN MESSAGE (IMAGE WILL STILL SEND) */
    const OWNER_ID = "61557991443492";
    if (targetID === OWNER_ID) {
      try {
        const info = await usersData.get(targetID);
        if (info?.gender === "female") {
          message.reply("Karim re usta na diya kiss daw bby 😘😘");
        } else if (info?.gender === "male") {
          message.reply("koto boro sahos😾👋");
        }
      } catch (e) {}
    }

    try {
      // Avatar URLs
      const avatar1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;
      const avatar2 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      const loadAvatar = async (url) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        return loadImage(res.data);
      };

      // Canvas
      const canvas = createCanvas(950, 850);
      const ctx = canvas.getContext("2d");

      const [bg, av1, av2] = await Promise.all([
        loadImage("https://i.imgur.com/3DZjUH7.jpeg"),
        loadAvatar(avatar1),
        loadAvatar(avatar2)
      ]);

      // Draw background
      ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

      // Sender avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(180, 250, 85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(av1, 95, 165, 170, 170);
      ctx.restore();

      // Target avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(700, 120, 85, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(av2, 615, 35, 170, 170);
      ctx.restore();

      // Save image
      const dir = `${__dirname}/tmp`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);

      const imgPath = `${dir}/latthi_${senderID}.png`;
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      // Send
      message.reply(
        {
          body: "Usta kha! 🦶😵",
          attachment: fs.createReadStream(imgPath)
        },
        () => {
          if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
      );

    } catch (err) {
      console.error("Latthi Error:", err);
      message.reply("Profile picture load korte problem hoise 🐸");
    }
  }
};
