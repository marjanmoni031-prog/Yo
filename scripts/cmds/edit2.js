const axios = require("axios");

module.exports = {
  config: {
    name: "edit2",
    aliases: ["imgedit"],
    version: "2.4",
    author: "Hasib", //API by RIFAT
    countDown: 15,
    role: 0,
    shortDescription: { en: "Edit image with Seedream V4" },
    longDescription: { en: "Edit or modify an existing image using Seedream V4 Edit AI model" },
    category: "image",
    guide: {
      en: "Reply to an image with: {pn} <prompt>"
    }
  },

  onStart: async function ({ message, event, api, args }) {
    const hasPhotoReply = event.type === "message_reply" && event.messageReply?.attachments?.[0]?.type === "photo";

    if (!hasPhotoReply) {
      return message.reply("Please reply to an image to edit.");
    }

    const prompt = args.join(" ").trim();
    if (!prompt) {
      return message.reply("Please provide a prompt.");
    }

    const model = "seedream v4 edit";
    const imageUrl = event.messageReply.attachments[0].url;

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const res = await axios.get("https://fluxcdibai-1.onrender.com/generate", {
        params: { prompt, model, imageUrl },
        timeout: 120000
      });

      const data = res.data;
      const resultUrl = data?.data?.imageResponseVo?.url;

      if (!resultUrl) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return message.reply("Failed to edit image.");
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      await message.reply({
        body: "Image edited 🐦",
        attachment: await global.utils.getStreamFromURL(resultUrl)
      });

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("Error while editing image.");
    }
  }
};
