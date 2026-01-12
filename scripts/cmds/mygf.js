module.exports = {
  config: {
    name: "mygf",
    aliases: ["mybf"], 
    author: "Hasib",
    category: "love",
  },

  onStart: async function ({ api, event, usersData }) {
    try {
      const senderID = event.senderID;
      const mentionIDs = Object.keys(event.mentions || {});
      const repliedUserID =
        event.type === "message_reply"
          ? event.messageReply.senderID
          : null;

      let user1ID, user2ID;

      // Case 1: two mentions
      if (mentionIDs.length >= 2) {
        user1ID = mentionIDs[0];
        user2ID = mentionIDs[1];
      }
      // Case 2: one mention
      else if (mentionIDs.length === 1) {
        user1ID = senderID;
        user2ID = mentionIDs[0];
      }
      // Case 3: reply
      else if (repliedUserID) {
        user1ID = senderID;
        user2ID = repliedUserID;
      } else {
        return api.sendMessage(
          "⚠️ Reply to a message or mention one/two users.",
          event.threadID,
          event.messageID
        );
      }

      if (user1ID === user2ID) {
        return api.sendMessage(
          "⚠️ Please select two different users.",
          event.threadID,
          event.messageID
        );
      }

      const user1Data = await usersData.get(user1ID);
      const user2Data = await usersData.get(user2ID);

      const replyMessage = `${user1Data.name} & ${user2Data.name} 𝐡𝐲𝐞 𝐡𝐨𝐦𝐢𝐞𝐬 💫
𝓨𝓸𝓾 𝓫𝓸𝓽𝓱 𝔀𝓲𝓵𝓵 𝓫𝓮 𝓽𝓱𝓮 𝓯𝓾𝓽𝓾𝓻𝓮 𝓱𝓾𝓼𝓫𝓪𝓷𝓭 & 𝔀𝓲𝓯𝓮
𝓐𝓵𝔀𝓪𝔂𝓼 𝓫𝓮 𝓵𝓸𝔂𝓪𝓵 𝓽𝓸 𝓮𝓪𝓬𝓱 𝓸𝓽𝓱𝓮𝓻
𝓜𝓪𝔂 𝓐𝓵𝓵𝓪𝓱 𝓴𝓮𝓮𝓹 𝔂𝓸𝓾 𝓽𝓸𝓰𝓮𝓽𝓱𝓮𝓻 𝓯𝓸𝓻𝓮𝓿𝓮𝓻 💕`;

      api.sendMessage(
        {
          body: replyMessage,
          mentions: [
            { id: user1ID, tag: user1Data.name },
            { id: user2ID, tag: user2Data.name },
          ],
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      api.sendMessage(
        "❌ Error:\n" + err.message,
        event.threadID,
        event.messageID
      );
    }
  },
};
