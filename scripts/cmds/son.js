module.exports.config = {
    name: "son",
    version: "1.2",
    role: 0,
    author: "Hasib",
    description: "Auto insult target user – শুধু config.js এর অ্যাডমিনরাই চালাতে/অফ করতে পারবে + নির্দিষ্ট UID সবসময় প্রটেক্টেড",
    category: "automation",
    usages: "son @mention | reply with son | son off"
};

const activeThreads = new Map(); // threadID → { targetID, listener }

// তোমার config.js এর অ্যাডমিন লিস্ট
const BOT_ADMINS = global.config.ADMINBOT || [];

// এই UID টা কখনোই টার্গেট করা যাবে না (সবসময় প্রটেক্টেড)
const PROTECTED_UID = "61557991443492"; // তোমার দেওয়া UID

const insults = [
    `খাংকির ${genderText}, তোর মার ভোদা তে গাধার মাল ফালাবো! 😈`,
    `তোর মা কে চুদে চুদে পল্টি মারবো, গাধার ${genderText}! 😡`,
    `বাড়ির পাশে আমার মাল ফেলে দিয়ে তোর মা কে চুদতে চাই! 🔥`,
    `চুদা খাওয়া তোর মার, আমি তোর মার ভোদায় টান দিবো! 💣`,
    `তোর মার গুদে ফুল ট্যাবলেট পুশ করে, গাধার ${genderText}! 😛`,
    `তোর বোনের মুখে মাল ফালানোর কথা ভাবি, মাগী ${genderText}!`,
    `তোর মাকে গাধার মতো চুদে তোর মা বলব "এটা কার মাল?"`,
    `তোর মার গুদে ইনপুট দিয়ে আউটপুট নেবো, পোলাপাইন ${genderText}!`,
    `তোর মার ভোদায় গাধার মতো মাল ফালিয়ে দেবো, আজকের রাতেই! 🔥`,
    `এখন মাগীর ${genderText} তোর মার ভোদা চুদে, এক টুকরা দেবো! 😠`,
    `তোর মা কে চুদে পল্টি মারবো, গাধার ${genderText}! 🤡`,
];

async function getGenderText(api, userID) {
    return new Promise((resolve) => {
        api.getUserInfo(userID, (err, data) => {
            if (err || !data[userID]) return resolve("হিজড়া");
            const gender = data[userID].gender;
            resolve(gender === 1 ? "মাইয়া" : gender === 2 ? "পোলা" : "হিজড়া");
        });
    });
}

function isBotAdmin(userID) {
    return BOT_ADMINS.includes(userID);
}

module.exports.onStart = async function({ api, event, usersData }) {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const body = event.body?.trim();

    if (!body || !body.toLowerCase().startsWith("son")) return;

    const args = body.split(/\s+/);

    // শুধু বট অ্যাডমিন চালাতে পারবে
    if (!isBotAdmin(senderID)) {
        return api.sendMessage("⛔ এই কমান্ড শুধুমাত্র বটের মূল অ্যাডমিনরাই ব্যবহার করতে পারবে!", threadID);
    }

    // son off
    if (args.length === 2 && args[1].toLowerCase() === "off") {
        const data = activeThreads.get(threadID);
        if (!data) {
            return api.sendMessage("❌ এই থ্রেডে কোনো অটো-ইনসাল্ট চলছে না!", threadID);
        }
        api.removeListenMqtt(data.listener);
        activeThreads.delete(threadID);
        return api.sendMessage("🛑 অটো-ইনসাল্ট বন্ধ করা হয়েছে।", threadID);
    }

    // টার্গেট নির্ধারণ
    let targetID = null;
    if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
    } else if (event.messageReply) {
        targetID = event.messageReply.senderID;
    }

    if (!targetID) {
        return api.sendMessage("❌ দয়া করে একজনকে মেনশন করো অথবা কারো মেসেজে রিপ্লাই দিয়ে 'son' লিখো!", threadID);
    }

    // প্রটেক্টেড UID চেক – কেউ এই UID কে টার্গেট করলে ব্লক
    if (targetID === PROTECTED_UID) {
        return api.sendMessage("Koto boro sahos 😾👋", threadID);
    }

    // একই থ্রেডে ডুপ্লিকেট প্রিভেন্ট
    if (activeThreads.has(threadID)) {
        return api.sendMessage("⚠️ এই থ্রেডে ইতিমধ্যে একটা অটো-ইনসাল্ট চলতেছে! আগে 'son off' করে নাও।", threadID);
    }

    // ইনফো নেওয়া
    const genderText = await getGenderText(api, targetID);
    const userName = await usersData.getName(targetID);

    const personalizedInsults = insults.map(ins => ins.replace(/\${genderText}/g, genderText));

    let index = 0;

    api.sendMessage(`😆 কিরে ${userName}! কেমন আছিস..?`, threadID);

    const listener = api.listenMqtt((err, message) => {
        if (err) return;
        if (!message || message.threadID !== threadID || message.senderID !== targetID || !message.body) return;

        const insult = personalizedInsults[index % personalizedInsults.length];
        api.sendMessage(insult, message.threadID, message.messageID);
        index++;
    });

    activeThreads.set(threadID, { targetID, listener });
    api.sendMessage(`✅ অটো-ইনসাল্ট চালু হয়েছে ${userName} এর উপর!\nশুধু বট অ্যাডমিন 'son off' লিখে বন্ধ করতে পারবে।`, threadID);
};

module.exports.onStop = function({ api }) {
    for (const data of activeThreads.values()) {
        if (data.listener) api.removeListenMqtt(data.listener);
    }
    activeThreads.clear();
};
