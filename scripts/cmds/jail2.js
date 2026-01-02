const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios'); // Better than deprecated 'request'

module.exports.config = {
  name: "jail2",
  version: "1.0",
  author: "Hasib",
  countDown: 10,
  role: 0,
  shortDescription: "Wanted poster with thin jail bars (clear view)",
  category: "fun",
  guide: { en: "{p}jail or {p}jail @tag" }
};

module.exports.onStart = async function ({ api, event, args, usersData }) {
  const { threadID, messageID, mentions } = event;

  let uid = event.senderID;
  let name = await usersData.getName(uid);

  if (Object.keys(mentions).length > 0) {
    uid = Object.keys(mentions)[0];
    name = await usersData.getName(uid);
  }

  try {
    const cacheDir = path.join(__dirname, 'cache');
    await fs.ensureDir(cacheDir); // Ensure cache folder exists

    const avatarPath = path.join(cacheDir, `jail_avatar_${uid}.jpg`);
    const outputPath = path.join(cacheDir, `jail_output_${Date.now()}.png`);

    // Updated URL: type=large often works reliably without token for visible profiles (2026)
    // It redirects to the real image CDN
    const avatarUrl = `https://graph.facebook.com/${uid}/picture?type=large`;

    // Download avatar
    const avatarResponse = await axios({ url: avatarUrl, method: 'GET', responseType: 'stream' });
    const writer = fs.createWriteStream(avatarPath);
    avatarResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Generate the wanted poster
    const wantedPath = await generateThinBarsImage(avatarPath, name);

    // Send the image
    api.sendMessage({
      body: `@${name} WANTED! 🔒 Locked Up! (Clear view with thin bars)`,
      mentions: [{ tag: name, id: uid }],
      attachment: fs.createReadStream(wantedPath)
    }, threadID, messageID);

    // Clean up files after 10 seconds
    setTimeout(() => {
      [avatarPath, wantedPath].forEach(file => fs.existsSync(file) && fs.unlinkSync(file));
    }, 10000);

  } catch (error) {
    console.error("Jail command error:", error);
    api.sendMessage("⚠️ Error creating jail poster. Profile picture might be private or unavailable.", threadID, messageID);
  }
};

async function generateThinBarsImage(avatarPath, name) {
  const avatar = await loadImage(avatarPath);
  const width = 600;
  const height = 800;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Dark blue background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // WANTED text
  ctx.font = 'bold 100px Arial';
  ctx.fillStyle = '#ef4444';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#991b1b';
  ctx.shadowBlur = 20;
  ctx.fillText('WANTED', width / 2, 120);
  ctx.shadowColor = 'transparent';

  // Circular clear avatar
  const centerX = width / 2;
  const centerY = height / 2 + 20;
  const radius = 200;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatar, centerX - radius, centerY - radius, radius * 2, radius * 2);
  ctx.restore();

  // Thin semi-transparent bars
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';

  // Vertical bars
  const barCount = 8;
  const barSpacing = width / (barCount + 1);
  for (let i = 1; i <= barCount; i++) {
    const x = i * barSpacing;
    ctx.beginPath();
    ctx.moveTo(x, 180);
    ctx.lineTo(x, height - 180);
    ctx.stroke();
  }

  // Horizontal bars
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(barSpacing, 260);
  ctx.lineTo(width - barSpacing, 260);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(barSpacing, height - 260);
  ctx.lineTo(width - barSpacing, height - 260);
  ctx.stroke();

  ctx.globalAlpha = 1.0;

  // Locked Up! text
  ctx.font = 'italic 50px "Segoe UI"';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#60a5fa';
  ctx.shadowBlur = 20;
  ctx.fillText('Locked Up!', width / 2, height - 100);
  ctx.shadowColor = 'transparent';

  // Name
  ctx.font = 'bold 40px Arial';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(name.toUpperCase(), width / 2, height - 50);

  // Save output
  const outputPath = path.join(__dirname, 'cache', `jail_thin_${Date.now()}.png`);
  fs.writeFileSync(outputPath, canvas.toBuffer());
  return outputPath;
}
