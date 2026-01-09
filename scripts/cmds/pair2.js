const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
    config: {
        name: "pair2",
        author:"Hasib",
        countDown: 5,
        role: 0,
        category: "love",
    },

    onStart: async function ({ api, event }) {
        let pathImg = __dirname + "/cache/background.png";
        let pathAvt1 = __dirname + "/cache/Avtmot.png";
        let pathAvt2 = __dirname + "/cache/Avthai.png";

        // Sender info
        let id1 = event.senderID;
        let user1 = await api.getUserInfo(id1);
        let fancySender = user1[id1].name; // You can add styling here if you want

        // Thread info
        let ThreadInfo = await api.getThreadInfo(event.threadID);
        let all = ThreadInfo.userInfo;

        let gender1;
        for (let c of all) if (c.id == id1) gender1 = c.gender;

        const botID = api.getCurrentUserID();
        let candidates = [];

        if (gender1 == "FEMALE") {
            candidates = all.filter(u => u.gender == "MALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
        } else if (gender1 == "MALE") {
            candidates = all.filter(u => u.gender == "FEMALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
        } else {
            candidates = all.filter(u => u.id !== id1 && u.id !== botID).map(u => u.id);
        }

        if (!candidates.length) return api.sendMessage("No suitable partner found for pairing.", event.threadID);

        // Random match
        let id2 = candidates[Math.floor(Math.random() * candidates.length)];
        let user2 = await api.getUserInfo(id2);
        let fancyMatch = user2[id2].name; // You can style this too

        // Random compatibility
        let lovePercent = Math.floor(Math.random() * 101);

        // Background image
        let bgURL = "https://i.postimg.cc/nrgPFtDG/Picsart-25-08-12-20-22-41-970.png";

        // Fetch avatars
        const avt1 = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathAvt1, Buffer.from(avt1, "binary"));

        const avt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathAvt2, Buffer.from(avt2, "binary"));

        const bg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(pathImg, Buffer.from(bg, "binary"));

        // Create canvas
        const baseImage = await loadImage(pathImg);
        const imgAvt1 = await loadImage(pathAvt1);
        const imgAvt2 = await loadImage(pathAvt2);
        const canvas = createCanvas(baseImage.width, baseImage.height);
        const ctx = canvas.getContext("2d");

        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(imgAvt1, 120, 170, 300, 300);
        ctx.drawImage(imgAvt2, canvas.width - 420, 170, 300, 300);

        fs.writeFileSync(pathImg, canvas.toBuffer());

        // Clean up avatars
        fs.removeSync(pathAvt1);
        fs.removeSync(pathAvt2);

        // Your exact message template
        const message = `💞 𝗠𝗮𝘁𝗰𝗵𝗺𝗮𝗸𝗶𝗻𝗴 𝗖𝗼𝗺𝗽𝗹𝗲𝘁𝗲 💞

🎀 ${fancySender} ✨️
🎀 ${fancyMatch} ✨️

🕊️ 𝓓𝓮𝓼𝓽𝓲𝔫𝔂 𝓱𝓪𝓼 𝔀𝓻𝓲𝓽𝓽𝓮𝓷 𝔂𝓸𝓾𝓻 𝓷𝓪𝓶𝓮𝓼 𝓽𝓸𝓰𝓮𝓽𝓱𝓮𝓻 🌹 𝓜𝓪𝔂 𝔂𝓸𝓾𝓻 𝓫𝓸𝓷𝓭 𝓵𝓪𝓼𝓽 𝓯𝓸𝓻𝓮𝓿𝓮𝓻 ✨️  

💘 𝙲𝚘𝚖𝚙𝚊𝚝𝚒𝚋𝚒𝚕𝚒𝚝𝚢: ${lovePercent}% 💘`;

        // Send message
        return api.sendMessage({
            body: message,
            mentions: [
                { tag: fancySender, id: id1 },
                { tag: fancyMatch, id: id2 }
            ],
            attachment: fs.createReadStream(pathImg)
        }, event.threadID, async () => {
            try { fs.unlinkSync(pathImg); } catch(e) {}
        }, event.messageID);
    }
};
