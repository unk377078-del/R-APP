const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/DashboardScreen.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Ensure Modal and StyleSheet are imported
code = code.replace(
  "import { Alert,Image,Linking,Platform,Pressable,ScrollView,View } from 'react-native';",
  "import { Alert,Image,Linking,Modal,Platform,Pressable,ScrollView,StyleSheet,View } from 'react-native';"
);

// 2. Update tabs list to make cloud library tab prominent
code = code.replace(
  "const tabs=['الملخص','الرسوم البيانية','المنتجات','مكتبة الصور','الطلبات','العملاء','الأقسام','الفروع','الرئيسية','البانرات','الولاء','الشارات','البث','الكوبونات','كلمة مرور الإدارة'];",
  "const tabs=['الملخص','الرسوم البيانية','المنتجات','مكتبة السحابة ☁️','البانرات','الأقسام','الفروع','الرئيسية','الطلبات','العملاء','الولاء','الشارات','البث','الكوبونات','كلمة مرور الإدارة'];"
);

// Check if replacement succeeded
if (!code.includes("مكتبة السحابة ☁️")) {
  console.error("Failed to replace tabs list");
  process.exit(1);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Tabs and imports updated successfully!');
