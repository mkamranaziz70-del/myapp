import express from "express";

const app = express();

app.use(express.json()); // ✅ mandatory

export default app;
