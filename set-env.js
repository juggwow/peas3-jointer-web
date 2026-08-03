const fs = require('fs');

// โค้ดส่วนนี้จะดึงค่าจากไฟล์ .env มาใช้เวลาเรารันในเครื่อง
// แต่เวลาขึ้น Vercel มันจะอ่านจาก Environment Variables ของ Vercel ได้เลย
require('dotenv').config();

// กำหนดโครงสร้างไฟล์ environment ที่จะถูกสร้างขึ้นมา
const targetPath = './src/environments/environment.ts';
const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${process.env.API_URL || ''}',
};
`;

// สร้างโฟลเดอร์ environments ถ้ายังไม่มี
const dir = './src/environments';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// เขียนไฟล์ environment.ts
fs.writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        console.error(err);
        throw err;
    }
    console.log(`✅ สร้างไฟล์ Environment สำเร็จที่ ${targetPath}`);
});