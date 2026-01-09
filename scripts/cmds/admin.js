const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

// --- Owner setup ---
const OWNER_ID = ["61557991443492","100060606189407"]
const OWNER_DISPLAY_NAME = "🅺🅰🆁🅸🅼 🅱🅴🅽🆉🅸🅼🅰";

module.exports = {
  config: {
    name: "admin",
    aliases: ["a", "ar"],
    version: "2.6",
    author: "Hasib",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Manage bot admins" },
    longDescription: { en: "Add, remove or view bot admins" },
    category: "Owner",
    guide: {
      en:
`{pn} a list
→ Show admin list (everyone)

{pn} a add <uid | @tag | reply>
→ Add admin (owner only)

{pn} a remove <uid | @tag | reply>
→ Remove admin (owner only)`
    }
  },

  langs: {
    en: {
      listAdmin:
`🎭 𝗢𝗪𝗡𝗘𝗥 & 𝗔𝗗𝗠𝗜𝗡 🎭
♦___________________♦
♕︎ 𝑶𝑾𝑵𝑬𝑹 ♕︎: ✨ ${OWNER_DISPLAY_NAME} ✨
_____________________________
_____♔︎ 𝑨𝑫𝑴𝑰𝑵'𝑺 ♔︎_____
%1
_____________________________
🤖 𝑩𝑶𝑻 ♔︎: ✨|︵✰[_🪽°Hinata Sana°🐰_]࿐|✨
♔︎ 𝑂𝑊𝐸𝑅 ♔: https://www.facebook.com/karim.benzima.246709
⚠️ Note: type !help to see all available commands.`,

      added: "✅ | Added admin role for %1 user(s):\n%2",
      alreadyAdmin: "⚠️ | %1 user(s) already admin:\n%2",
      removed: "✅ | Removed admin role from %1 user(s):\n%2",
      notAdmin: "⚠️ | %1 user(s) are not admin:\n%2",

      missingIdAdd: "⚠️ | Provide UID, tag a user, or reply to a message",
      missingIdRemove: "⚠️ | Provide UID, tag a user, or reply to a message",

      notAllowed: "⛔ | Only the bot owner can use this command"
    }
  },

  onStart: async function ({ message, args, usersData, event, getLang }) {
    const senderID = event.senderID;
    let cmd = args[0]?.toLowerCase() || "list";

    // --- Alias normalize ---
    if (["rm", "r", "remove"].includes(cmd)) cmd = "remove";
    if (["add"].includes(cmd)) cmd = "add";
    if (["a", "ar", "list"].includes(cmd)) cmd = "list";

    // --- LIST ADMINS (everyone) ---
    if (cmd === "list") {
      const admins = config.adminBot.filter(uid => uid !== OWNER_ID);
      let names = [];

      for (const uid of admins) {
        const name = await usersData.getName(uid);
        names.push(`• ${name}`);
      }

      if (!names.length) names.push("• No admins");
      names.sort();

      return message.reply(getLang("listAdmin", names.join("\n")));
    }

    // --- ADD / REMOVE (owner only) ---
    if (senderID !== OWNER_ID)
      return message.reply(getLang("notAllowed"));

    let uids = [];

    if (Object.keys(event.mentions).length)
      uids = Object.keys(event.mentions);
    else if (event.type === "message_reply")
      uids = [event.messageReply.senderID];
    else
      uids = args.slice(1).filter(id => /^\d+$/.test(id));

    if (!uids.length)
      return message.reply(
        cmd === "add"
          ? getLang("missingIdAdd")
          : getLang("missingIdRemove")
      );

    // --- ADD ADMIN ---
    if (cmd === "add") {
      const added = [], exists = [];

      for (const uid of uids) {
        if (uid === OWNER_ID || config.adminBot.includes(uid))
          exists.push(uid);
        else added.push(uid);
      }

      config.adminBot.push(...added);
      config.adminBot = [...new Set(config.adminBot)];
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const addedNames = await Promise.all(added.map(u => usersData.getName(u)));
      const existsNames = await Promise.all(exists.map(u => usersData.getName(u)));

      return message.reply(
        (added.length
          ? getLang("added", added.length, addedNames.map(n => `• ${n}`).join("\n")) + "\n"
          : "") +
        (exists.length
          ? getLang("alreadyAdmin", exists.length, existsNames.map(n => `• ${n}`).join("\n"))
          : "")
      );
    }

    // --- REMOVE ADMIN ---
    if (cmd === "remove") {
      const removed = [], notAdmin = [];

      for (const uid of uids) {
        if (uid === OWNER_ID) continue;
        if (config.adminBot.includes(uid)) {
          removed.push(uid);
          config.adminBot.splice(config.adminBot.indexOf(uid), 1);
        } else notAdmin.push(uid);
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const removedNames = await Promise.all(removed.map(u => usersData.getName(u)));
      const notAdminNames = await Promise.all(notAdmin.map(u => usersData.getName(u)));

      return message.reply(
        (removed.length
          ? getLang("removed", removed.length, removedNames.map(n => `• ${n}`).join("\n")) + "\n"
          : "") +
        (notAdmin.length
          ? getLang("notAdmin", notAdmin.length, notAdminNames.map(n => `• ${n}`).join("\n"))
          : "")
      );
    }
  }
};
