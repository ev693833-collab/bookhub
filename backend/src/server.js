console.log("Iniciando servidor...");

process.on('unhandledRejection', (reason) => {
    console.warn('[Server] Unhandled Rejection capturado:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
    console.warn('[Server] Uncaught Exception capturado:', err?.message || err);
});

const express = require("express");
const cors = require("cors");
const path = require("path");
// Configura variáveis de ambiente do .env
require("dotenv").config({ path: path.join(__dirname, "../.env") });
require("dotenv").config();
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/api', routes);
app.use(routes);

// Definir porta dinâmica para produção ou desenvolvimento
const port = process.env.PORT || 3000;

// Iniciar o servidor apenas se rodando localmente
if (require.main === module) {
    const server = app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);

        // Processo interno em segundo plano de identificação e correção automática de capas
        setTimeout(() => {
            try {
                const coverService = require('./services/coverEnrichmentService');
                coverService.runInternalCoverEnrichment({ verbose: true }).catch(err => {
                    console.warn('[Server] Aviso na verificação automática de capas:', err.message);
                });
            } catch (e) {
                console.warn('[Server] Falha ao carregar coverEnrichmentService:', e.message);
            }
        }, 2000);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Porta ${port} em uso, aguardando liberação para reconectar na porta ${port}...`);
            setTimeout(() => {
                try {
                    server.close();
                    server.listen(port);
                } catch (_) {}
            }, 1000);
        } else {
            console.error(err);
        }
    });
}

// Exportamos o app para a Vercel
module.exports = app;
