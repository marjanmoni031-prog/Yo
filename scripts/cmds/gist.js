const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ALLOWED_UID = ["61557991443492","100060606189407"];

const baseApiUrl = async () => {
  const base = await axios.get('https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json');
  return base.data.gist;
};

module.exports = {
  config: {
    name: "gist",
    version: "2.0",
    role: 0, // role ignored, UID-based lock
    author: "Hasib",
    usePrefix: true,
    description: "Generate a Gist link from replied code or from local bot files",
    category: "convert",
    guide: { 
      en: "{pn} → Reply to a code snippet to create a Gist\n{pn} [filename] → Create a Gist from cmds folder\n{pn} -e [filename] → Create a Gist from events folder" 
    },
    countDown: 1
  },

  onStart: async function ({ api, event, args }) {

    /* 🔒 UID LOCK */
    if (event.senderID !== ALLOWED_UID) {
      return api.sendMessage(
        "𝐀𝐣𝐤𝐞 𝐦𝐞𝐣𝐚𝐣 𝐠𝐨𝐫𝐨𝐦, 𝐮𝐥𝐭𝐚𝐩𝐚𝐥𝐭𝐚 𝐛𝐨𝐥𝐥𝐞 𝐭𝐡𝐚𝐩𝐩𝐨𝐫 𝐤𝐡𝐚𝐛𝐢 👋🤬.",
        event.threadID,
        event.messageID
      );
    }

    let fileName = args[0];
    let code = "";

    try {

      // 📌 Reply with code
      if (event.type === "message_reply" && event.messageReply?.body) {
        code = event.messageReply.body;

        if (!fileName) {
          const time = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
          fileName = `gist_${time}.js`;
        } else if (!fileName.endsWith(".js")) {
          fileName = `${fileName}.js`;
        }
      }

      // 📁 From bot files
      else if (fileName) {
        let filePath;

        if (args[0] === "-e") {
          const evFile = args[1];
          if (!evFile) {
            return api.sendMessage(
              "⚠ | Please provide a filename after -e.",
              event.threadID,
              event.messageID
            );
          }
          fileName = evFile.endsWith(".js") ? evFile : `${evFile}.js`;
          filePath = path.resolve(__dirname, '../../scripts/events', fileName);
        } else {
          const commandsPath = path.resolve(__dirname, '../../scripts/cmds');
          filePath = fileName.endsWith(".js")
            ? path.join(commandsPath, fileName)
            : path.join(commandsPath, `${fileName}.js`);
        }

        if (!fs.existsSync(filePath)) {
          const dirToSearch = args[0] === "-e"
            ? path.resolve(__dirname, '../../scripts/events')
            : path.resolve(__dirname, '../../scripts/cmds');

          const files = fs.readdirSync(dirToSearch);
          const similar = files.filter(f =>
            f.toLowerCase().includes(fileName.replace(".js", "").toLowerCase())
          );

          if (similar.length > 0) {
            return api.sendMessage(
              `❌ File not found. Did you mean:\n${similar.join('\n')}`,
              event.threadID,
              event.messageID
            );
          }

          return api.sendMessage(
            `❌ File "${fileName}" not found in ${args[0] === "-e" ? "events" : "cmds"} folder.`,
            event.threadID,
            event.messageID
          );
        }

        code = await fs.promises.readFile(filePath, "utf-8");
        if (!fileName.endsWith(".js")) fileName = `${fileName}.js`;
      }

      // ❌ No input
      else {
        return api.sendMessage(
          "⚠ | Please reply with code OR provide a file name.",
          event.threadID,
          event.messageID
        );
      }

      const encoded = encodeURIComponent(code);
      const apiUrl = await baseApiUrl();

      const response = await axios.post(`${apiUrl}/gist`, {
        code: encoded,
        nam: fileName
      });

      const link = response.data?.data;
      if (!link) throw new Error("Invalid API response");

      return api.sendMessage(link, event.threadID, event.messageID);

    } catch (err) {
      console.error("❌ Gist Error:", err.message || err);
      return api.sendMessage(
        "⚠️ Failed to create gist. Maybe server issue.\n💬 Contact author for help: https://m.me/ye.bi.nobi.tai.244493",
        event.threadID,
        event.messageID
      );
    }
  }
};
