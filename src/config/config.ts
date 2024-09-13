export default () => ({
  database: {
    connectionString: process.env.DATABASE_URL,
  },
  at: {
    secret: process.env.AT_SECRET,
  },
  rt: {
    secret: process.env.RT_SECRET,
  },
  email_id: process.env.EMAIL_ID,
  email_secret: process.env.EMAIL_SECRET,
  port: process.env.PORT,
  node_env: process.env.NODE_ENV,
  frontend_url: process.env.FRONTEND_URL,
});
