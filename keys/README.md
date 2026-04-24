# 密钥管理目录

## 目录结构
- `private.pem` - RSA私钥文件，用于解密用户密码
- `decrypt.js` - 密码解密脚本
- `generate-password.js` - 密码加密生成脚本

## 注意事项
- **私钥安全**：私钥文件包含敏感信息，必须妥善保管
- **不要提交**：不要将私钥文件提交到版本控制系统
- **权限设置**：确保私钥文件只有授权用户可以访问

## 使用方法

### 1. 生成密钥对（已完成）
```bash
# 生成私钥
openssl genrsa -out private.pem 2048
# 生成公钥
openssl rsa -in private.pem -pubout -out public.pem
# 将公钥放入ucar-api项目根目录
cp public.pem ../ucar-api/
```

**注意**：生成的公钥文件 `public.pem` 必须放入 `ucar-api` 项目根目录，否则系统无法正常加密密码。

### 2. 生成加密密码
使用 `generate-password.js` 脚本生成加密密码，用于初始化用户账号：

```bash
# 生成密码加密
node generate-password.js <password>
```

脚本会输出：
- 原始密码
- bcrypt加密后的密码（用于登录验证）
- RSA加密后的密码（用于管理员查看）
- 完整的SQL插入语句

### 3. 解密用户密码
使用 `decrypt.js` 脚本解密数据库中的 `password_secure` 字段：

```bash
# 解密密码
node decrypt.js "<encrypted_password>"
```

### 4. 示例
```bash
# 生成密码示例
node generate-password.js 123456

# 解密示例
node decrypt.js "cS+RP79J0t00upQQCSTqLQ8onqlABY6UeMR7C+W7Z8ppWnPLTG/zelMMrvBLEDF1pG5znRPm1V/PMEbCJjMj2kzjeWcd93888w2b0eFWqNia2h2xVsdWRY6RpUdHDWryisyVS3YDmZOlz/09sPtaD7fqjbh5wOSlBrDKuK7P7vnlGEhVv/aWUqHawwMaPq94TbZSs4TQgaUtvzhUfwHF1Nl2blFQpY4D51L413e3by3BVgS72OEO3jQR5RrbVihZLLPQByzPc0LTUAPJuiKwZ2KwoAt33bbRS1j6axeNBl4ujPvtO6h7BU4G+6vKruQzxuxEAOm9D5PrU72/n4XMQA=="
```

## 安全提示
- 私钥文件应该存储在安全的位置
- 定期更换密钥对
- 不要在代码中硬编码私钥
- 限制私钥的访问权限
