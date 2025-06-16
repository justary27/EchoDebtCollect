import type { Config } from 'drizzle-kit';

export default {
    dialect: 'sqlite',
    out: './drizzle/migrations',
    schema: './src/db/schema',
    dbCredentials: {
        url: 'file:./db.sqlite',
    },
   
} satisfies Config;
