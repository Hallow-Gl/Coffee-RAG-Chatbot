import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chatRouter } from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', project: 'coffee-rag-chatbot' });
});

app.use('/api/chat', chatRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`☕ Coffee RAG server running on port ${PORT}`);
});

export default app;