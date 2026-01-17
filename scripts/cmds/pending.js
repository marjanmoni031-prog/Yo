!cmd install pending.js module.exports = {
  config: {
    name: "pending",
    aliases:["pen"],
    version: "1.2",
    author: "Hasib",
    countDown: 5,
    role: 2, // 🔐 BOT ADMIN ONLY
    shortDescription: {
      en: "Manage pending group approvals"
    },
    longDescription: {
      en: "View, approve or reject groups waiting to add the bot"
    },
    category: "Admin",
    guide: {
      en: {
        body:
          "{pn} → View pending groups\n" +
          "Reply numbers → Approve\n" +
          "Reply c<number> → Reject\n" +
          "Example: 1 2 | c1 c2"
      }
    }
  },

  langs: {
    en: {
      invaildNumber: "❌ %1 is not a valid number",
      cancelSuccess: "✅ Refused %1 group(s)!",
      approveSuccess: "✅ Approved %1 group(s)!",
      cantGetPendingList: "❌ Can't get pending list!",
      returnListPending:
        "📋 「PENDING GROUPS」\n" +
        " Total: %1\n" +
        " Reply numbers to approve\n" +
        " Use c<number> to reject\n" +
        " Example: 1 2 | c1 c2\n\n%2",
      returnListClean: "📭 No pending groups found"
    }
  },

  // ================== ON REPLY ==================
  onReply: async ({ api, event, Reply, getLang }) => {
    if (event.senderID !== Reply.author) return;

    const body = event.body.trim().toLowerCase();
    let count = 0;

    // ❌ CANCEL MODE
    if (body.startsWith("c")) {
      const nums = body.replace(/^c/, "").split(/\s+/);

      for (const n of nums) {
        const index = parseInt(n);
        if (!index || index < 1 || index > Reply.pending.length)
          return api.sendMessage(getLang("invaildNumber", n), event.threadID);

        try {
          await api.removeUserFromGroup(
            api.getCurrentUserID(),
            Reply.pending[index - 1].threadID
          );
          count++;
        } catch (e) {
          console.error(e);
        }
      }

      return api.sendMessage(getLang("cancelSuccess", count), event.threadID);
    }

    // ✅ APPROVE MODE
    const nums = body.split(/\s+/);
    for (const n of nums) {
      const index = parseInt(n);
      if (!index || index < 1 || index > Reply.pending.length)
        return api.sendMessage(getLang("invaildNumber", n), event.threadID);

      const targetThread = Reply.pending[index - 1].threadID;

      try {
        const info = await api.getThreadInfo(targetThread);
        const time = new Date().toLocaleString("en-BD", {
          timeZone: "Asia/Dhaka"
        });

        api.sendMessage(
`╔═══════✦❖༺❖✦══════╗
┃➥ GROUP: ${info.threadName || "Unnamed"}
┃➥ ID: ${targetThread}
┃➥ MEMBERS: ${info.participantIDs.length}
┃➥ APPROVAL: ${info.approvalMode ? "ON" : "OFF"}
┃➥ EMOJI: ${info.emoji || "NONE"}
┃➥ JOINED: ${time}
┃➥ BOT OWNER: Shin-chan
╚═══════✦❖༺❖✦══════╝

✅ Bot is now active in this group!`,
          targetThread
        );

        count++;
      } catch (e) {
        console.error(e);
      }
    }

    return api.sendMessage(getLang("approveSuccess", count), event.threadID);
  },

  // ================== ON START ==================
  onStart: async ({ api, event, getLang, commandName }) => {
    const { threadID, senderID } = event;

    // 🔐 Bot-admin permission already handled by role: 2

    try {
      const spam = await api.getThreadList(100, null, ["OTHER"]);
      const pending = await api.getThreadList(100, null, ["PENDING"]);
      const list = [...spam, ...pending].filter(t => t.isGroup);

      if (!list.length)
        return api.sendMessage(getLang("returnListClean"), threadID);

      let msg = "";
      list.forEach((g, i) => {
        msg += `✧ ${i + 1}. ${g.name || "Unnamed"}\n  ☞ ID: ${g.threadID}\n`;
      });

      api.sendMessage(
        getLang("returnListPending", list.length, msg),
        threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              author: senderID,
              pending: list
            });
          }
        }
      );
    } catch (e) {
      console.error(e);
      api.sendMessage(getLang("cantGetPendingList"), threadID);
    }
  }
};
