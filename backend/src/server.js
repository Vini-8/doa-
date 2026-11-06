require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido. Copie .env.example para .env e preencha.');
  process.exit(1);
}

const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Doa+ rodando em http://localhost:${PORT}`));
