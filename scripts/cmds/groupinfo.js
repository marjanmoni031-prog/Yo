const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo","spygroup" , "spygc"],
    version: "1.8",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: "Group information",
    longDescription: "Clean & minimal group info (Admin & Owner only)",
    category: "box chat",
    guide: {
      en: "{p}groupinfo"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);

      // Bot owners
      const owners = ["100060606189407", "61557991443492"];
      const senderID = event.senderID;

      const isAdmin = threadInfo.adminIDs.some(ad => ad.id === senderID);
      const isOwner = owners.includes(senderID);

      if (!isAdmin && !isOwner) {
        return api.sendMessage(
          "Only group admins or bot owners can use this command.",
          event.threadID,
          event.messageID
        );
      }

      // Members
      const totalMembers = threadInfo.participantIDs.length;
      let male = 0, female = 0, other = 0;

      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") male++;
        else if (user.gender === "FEMALE") female++;
        else other++;
      }

      // Admin list
      let adminList = "";
      for (const ad of threadInfo.adminIDs) {
        const info = await api.getUserInfo(ad.id);
        adminList += `• ${info[ad.id]?.name || "Unknown"}\n`;
      }

      // Estimated creator
      let creatorName = "Unknown";
      if (threadInfo.adminIDs.length > 0) {
        const creatorID = threadInfo.adminIDs[0].id;
        const creatorInfo = await api.getUserInfo(creatorID);
        creatorName = creatorInfo[creatorID]?.name || "Unknown";
      }

      const groupName = (threadInfo.threadName || "Unnamed Group").toUpperCase();

      const text =
`━━━━━━━━━━━━━━━━━
  𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡 𝗢𝗙 ${groupName}
𝐓𝐈𝐃          : ${threadInfo.threadID}
𝐂𝐑𝐄𝐀𝐓𝐎𝐑     : ${creatorName}
𝐀𝐏𝐏𝐑𝐎𝐕𝐀𝐋    : ${threadInfo.approvalMode ? "ON" : "OFF"}
𝐄𝐌𝐎𝐉𝐈       : ${threadInfo.emoji || "-"}

✧𝗠𝗘𝗠𝗕𝗘𝗥𝗦
─────
𝐓𝐎𝐓𝐀𝐋𝐒       : ${totalMembers}
Male        : ${male}
Female      : ${female}
Other       : ${other}

✧𝗔𝗗𝗠𝗜𝗡𝗦 (${threadInfo.adminIDs.length})
────────
${adminList}
✧𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬
─────
𝐌𝐞𝐬𝐬𝐚𝐠𝐞𝐬   : ${threadInfo.messageCount || "N/A"}

━━━━━━━━━━━━━━━━━━━━
𝐌𝐚𝐝𝐞 𝐛𝐲 ${this.config.author}`;

      const send = (attachment = null) => {
        api.sendMessage(
          { body: text, attachment },
          event.threadID,
          attachment ? () => fs.unlinkSync(__dirname + "/cache/group.png") : null,
          event.messageID
        );
      };

      // Group image
      if (threadInfo.imageSrc) {
        request(encodeURI(threadInfo.imageSrc))
          .pipe(fs.createWriteStream(__dirname + "/cache/group.png"))
          .on("close", () =>
            send(fs.createReadStream(__dirname + "/cache/group.png"))
          );
      } else {
        send();
      }

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "Failed to get group information.",
        event.threadID,
        event.messageID
      );
    }
  }
};
