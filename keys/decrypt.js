const fs = require('fs');
const path = require('path');

/**
 * RSA解密
 * @param {string} encryptedText - 加密后的密码
 * @returns {string} 解密后的明文密码
 */
const rsaDecrypt = (encryptedText) => {
  const privateKey = fs.readFileSync(path.join(__dirname, 'private.pem'), 'utf8');
  const crypto = require('crypto');
  const buffer = Buffer.from(encryptedText, 'base64');
  const decrypted = crypto.privateDecrypt({
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PADDING
  }, buffer);
  return decrypted.toString('utf8');
};

// 执行解密
if (process.argv[2]) {
  try {
    const encryptedPassword = process.argv[2];
    const decryptedPassword = rsaDecrypt(encryptedPassword);
    console.log('加密密码:', encryptedPassword);
    console.log('解密结果:', decryptedPassword);
  } catch (error) {
    console.error('解密失败:', error.message);
  }
} else {
  console.log('请提供加密密码作为参数，例如: node decrypt.js "<encrypted_password>"');
}
