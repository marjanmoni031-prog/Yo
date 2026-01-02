const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

const axios = require("axios");
const fs = require("fs-extra");

// ✅ OWNER UID LIST
const OWNER_UID = [
  "61557991443492",
  "100091527859576",
  "61554678316179"
];

module.exports = (
  api,
  threadModel,
  userModel,
  dashBoardModel,
  globalModel,
  usersData,
  threadsData,
  dashBoardData,
  globalData
) => {
  const handlerEvents = require(
    process.env.NODE_ENV === "development"
      ? "./handlerEvents.dev.js"
      : "./handlerEvents.js"
  )(
    api,
    threadModel,
    userModel,
    dashBoardModel,
    globalModel,
    usersData,
    threadsData,
    dashBoardData,
    globalData
  );

  return async function (event) {
    const message = createFuncMessage(api, event);

    // ✅ Ensure DB exists
    await handlerCheckDB(usersData, threadsData, event);

    const handlerChat = await handlerEvents(event, message);
    if (!handlerChat) return;

    const {
      onStart,
      onChat,
      onReply,
      onEvent,
      handlerEvent,
      onReaction,
      typ,
      presence,
      read_receipt
    } = handlerChat;

    switch (event.type) {

      // ================= MESSAGE =================
      case "message":
      case "message_reply":
      case "message_unsend":

        onChat && onChat();
        onStart && onStart();
        onReply && onReply();

        // 🔁 RESEND UNSENT MESSAGE
        if (event.type === "message_unsend") {
          const resend = await threadsData.get(event.threadID, "settings.reSend");

          if (
            resend === true &&
            event.senderID !== api.getCurrentUserID() &&
            global.reSend &&
            global.reSend[event.threadID]
          ) {
            const index = global.reSend[event.threadID].findIndex(
              (e) => e.messageID === event.messageID
            );

            if (index > -1) {
              const senderName = await usersData.getName(event.senderID);
              const data = global.reSend[event.threadID][index];
              const attachments = [];

              if (data.attachments?.length > 0) {
                let count = 0;

                for (const file of data.attachments) {
                  if (file.type === "audio") {
                    count++;
                    const filePath = `scripts/cmds/tmp/${count}.mp3`;
                    const buffer = (
                      await axios.get(file.url, { responseType: "arraybuffer" })
                    ).data;

                    fs.writeFileSync(filePath, Buffer.from(buffer));
                    attachments.push(fs.createReadStream(filePath));
                  } else {
                    attachments.push(
                      await global.utils.getStreamFromURL(file.url)
                    );
                  }
                }
              }

              api.sendMessage(
                {
                  body: `${senderName} removed:\n\n${data.body || ""}`,
                  mentions: [{ id: event.senderID, tag: senderName }],
                  attachment: attachments
                },
                event.threadID
              );
            }
          }
        }
        break;

      // ================= GROUP EVENTS =================
      case "event":
        handlerEvent && handlerEvent();
        onEvent && onEvent();
        break;

      // ================= REACTIONS =================
      case "message_reaction":

        onReaction && onReaction();

        // ❌ Empty reaction
        if (event.reaction === "") {
          if (["100033670741301", "61571904047861"].includes(event.userID)) {
            api.removeUserFromGroup(
              event.senderID,
              event.threadID,
              (err) => err && console.log(err)
            );
          } else {
            message.send(":)");
          }
        }

        // ✅ ONLY OWNER can unsend with angry reactions
        if (["😾", "🤬", "😡", "😠"].includes(event.reaction)) {
          if (OWNER_UID.includes(event.userID)) {
            message.unsend(event.messageID);
          }
        }
        break;

      // ================= OTHER =================
      case "typ":
        typ && typ();
        break;

      case "presence":
        presence && presence();
        break;

      case "read_receipt":
        read_receipt && read_receipt();
        break;

      default:
        break;
    }
  };
};
