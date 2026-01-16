const axios = require("axios");
const fs = require("fs");

module.exports = {
  config: {
    name: "pending",
    aliases: ["pen", "pend", "pe"],
    version: "1.7.0",
    author: "♡ Hasib ♡ ",
    countDown: 5,
    role: 1,
    shortDescription: "Handle pending requests",
    longDescription: "Approve pending users or group requests",
    category: "utility",
  },

  // ================= REPLY HANDLER =================
  onReply: async function ({ api, event, Reply }) {
    const { author, pending, messageID } = Reply;
    if (String(event.senderID) !== String(author)) return;

    const { body, threadID } = event;

    // Cancel operation
    if (body.trim().toLowerCase() === "c") {
      await api.unsendMessage(messageID);
      return api.sendMessage("❌ Operation canceled!", threadID);
    }

    const indexes = body.split(/\s+/).map(Number);
    if (indexes.some(isNaN)) {
      return api.sendMessage("⚠ Invalid input! Use numbers only.", threadID);
    }

    let count = 0;
    const prefix = global.GoatBot.config.prefix || "!";

    for (const idx of indexes) {
      if (idx <= 0 || idx > pending.length) continue;

      const target = pending[idx - 1];

      try {
        // ✅ Actual approval
        await api.changeThreadApproval(target.threadID, true);

        // Send approved message to group/user
        await api.sendMessage(
          `───────────────────
✅ 𝐆𝐫𝐨𝐮𝐩 𝐀𝐩𝐩𝐫𝐨𝐯𝐞𝐝!
🔹 𝐁𝐨𝐭 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}
📜 𝐓𝐲𝐩𝐞: ${prefix}help 𝐭𝐨 𝐬𝐞𝐞 𝐚𝐥𝐥 𝐜𝐨𝐦𝐦𝐚𝐧𝐝𝐬
───────────────────`,
          target.threadID
        );

        // Optional: change bot nickname in the group
        if (target.isGroup) {
          await api.changeNickname(
            global.GoatBot.config.nickNameBot || "🌬️ Raven Ai ✨",
            target.threadID,
            api.getCurrentUserID()
          );
        }

        count++;
      } catch (e) {
        console.log(e);
      }
    }

    return api.sendMessage(
      `✅ Successfully approved ${count} request(s)!`,
      threadID
    );
  },

  // ================= COMMAND START =================
  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID } = event;
    const adminBot = global.GoatBot.config.adminBot || [];

    if (!adminBot.includes(event.senderID)) {
      return api.sendMessage(
        "⚠ You have no permission to use this command!",
        threadID
      );
    }

    const type = args[0]?.toLowerCase();
    if (!type) {
      return api.sendMessage("Usage: pending [user/thread/all]", threadID);
    }

    try {
      const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
      const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];
      const list = [...spam, ...pending];

      let filteredList = [];
      if (type.startsWith("u")) filteredList = list.filter(t => !t.isGroup);
      else if (type.startsWith("t")) filteredList = list.filter(t => t.isGroup);
      else if (type === "all") filteredList = list;

      if (!filteredList.length) {
        return api.sendMessage("✅ No pending requests found.", threadID);
      }

      let msg = "";
      let index = 1;

      for (const item of filteredList) {
        const name =
          item.name || (await usersData.getName(item.threadID)) || "Unknown";
        msg += `[ ${index} ] ${name}\n`;
        index++;
      }

      msg += `\n🦋 Reply with number(s) to approve`;
      msg += `\n✨ Reply with "c" to cancel`;

      return api.sendMessage(
        `✨ Pending ${type.toUpperCase()} List ✨\n\n${msg}`,
        threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: event.senderID,
            pending: filteredList,
          });
        },
        messageID
      );
    } catch (error) {
      console.log(error);
      return api.sendMessage(
        "⚠ Failed to retrieve pending list. Try again later.",
        threadID
      );
    }
  },
};
