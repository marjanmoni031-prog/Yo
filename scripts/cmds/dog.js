const axios = require('axios');
const fs = require('fs');
const path = __dirname + '/assets/';

if (!fs.existsSync(path)) fs.mkdirSync(path);

const OWNER_ID = '61557991443492'; // replace with your actual owner ID

module.exports = {
  config: {
    name: "dog",
    aliases: ["dog"],
    version: "1.0",
    author: "JUNMAR",
    countDown: 5,
    role: 0,
    shortDescription: "dog images",
    longDescription: "dog images",
    category: "fun",
    guide: { en: "{pn}" },
  },

  onStart: async function ({ message, args, api, event }) {
    if (event.senderID !== OWNER_ID) {
      return api.sendMessage("❌ Only the owner can use this command.", event.threadID, event.messageID);
    }

    try {
      const res = await axios.get('https://random.dog/woof.json');
      const url = res.data.url;
      const ext = url.substring(url.lastIndexOf('.') + 1);
      const filePath = path + `dog2.${ext}`;

      const writer = fs.createWriteStream(filePath);
      const response = await axios({ url, method: 'GET', responseType: 'stream' });
      response.data.pipe(writer);

      writer.on('finish', () => {
        api.sendMessage({
          attachment: fs.createReadStream(filePath)
        }, event.threadID, () => fs.unlinkSync(filePath), event.messageID);
      });

    } catch (err) {
      api.sendMessage("Failed to fetch dog image 😢", event.threadID);
      console.error(err);
    }
  }
};
