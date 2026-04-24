const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// 读取RSA公钥
const publicKey = fs.readFileSync(path.join(__dirname, 'public.pem'), 'utf8');

/**
 * RSA加密
 */
const rsaEncrypt = (text) => {
  const crypto = require('crypto');
  const buffer = Buffer.from(text, 'utf8');
  const encrypted = crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, buffer);
  return encrypted.toString('base64');
};

/**
 * 生成加密密码
 */
const generatePassword = async (plainPassword) => {
  // 生成bcrypt加密密码
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  // 生成RSA加密密码
  const rsaEncryptedPassword = rsaEncrypt(plainPassword);
  
  console.log('原始密码:', plainPassword);
  console.log('bcrypt加密:', hashedPassword);
  console.log('RSA加密:', rsaEncryptedPassword);
  console.log('\nSQL插入语句:');
  console.log(`INSERT INTO c_user (userid, username, password, password_secure, phone, role, status, nickname) VALUES
('admin', 'admin', '${hashedPassword}', '${rsaEncryptedPassword}', '18140099917', 0, 1, '系统管理员');`);
};

// 执行生成
if (process.argv[2]) {
  generatePassword(process.argv[2]);
} else {
  console.log('请提供密码作为参数，例如: node generate-password.js 123456');
}
