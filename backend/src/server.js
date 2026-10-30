console.log("Iniciando servidor...");

process.on('unhandledRejection', (reason) => {
    console.warn('[Server] Unhandled Rejection capturado:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.warn('[Server] Uncaught Exception capturado:', err?.message || err);
});

const express = require("express");
const cors = require("cors");
// Configura variáveis de ambiente do .env
require("dotenv").config();
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api', routes);
app.use(routes);

// Definir porta dinâmica para produção ou desenvolvimento
const port = process.env.PORT || 5000;

// Iniciar o servidor apenas se rodando localmente
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Porta ${port} em uso, tentando outra...`);
            app.listen(0, () => {
                console.log(`Servidor rodando em uma porta aleatória`);
            });
        } else {
            console.error(err);
        }
    });
}

// Exportamos o app para a Vercel
module.exports = app;
