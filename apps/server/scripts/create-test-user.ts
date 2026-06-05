/**
 * 创建测试用户并打印密码
 * 用于测试 VIP 接口
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 创建测试用户 ===\n');

  const password = 'test123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`明文密码：${password}`);
  console.log(`哈希密码：${hashedPassword}\n`);

  // 创建测试用户
  const user = await prisma.user.upsert({
    where: { phone: '13800138000' },
    update: {
      password: hashedPassword,
      role: 'USER',
    },
    create: {
      phone: '13800138000',
      password: hashedPassword,
      role: 'USER',
    },
  });

  console.log(`测试用户已创建:`);
  console.log(`  手机号：13800138000`);
  console.log(`  密码：${password}`);
  console.log(`  用户 ID: ${user.id}`);

  await prisma.$disconnect();
}

main();
