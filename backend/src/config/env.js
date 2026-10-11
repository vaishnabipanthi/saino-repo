require('dotenv').config();
const { z } = require('zod');

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL .env me nahi mila'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET kam se kam 32 akshar ka hona chahiye'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('\n.env me problem hai:');
  parsed.error.issues.forEach((i) => console.error(' -', i.path.join('.'), ':', i.message));
  process.exit(1);
}

module.exports = parsed.data;