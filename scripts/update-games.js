import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { fetchCurrentFreeGames } from "./epic.js";
import { fetchGameMetadata } from "./rawg.js";
import {
    normalizeTitle,
    dedupeClaims,
    recalculateDates
} from "./normalize.js";
import { writeGamesFile } from "./writer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "../data/games-data.js");

function loadGames() {
    const raw = fs.readFileSync(DATA_FILE, "utf8");

    // Remove "const GAMES_DATA = " e o ponto e vírgula final
    const json = raw
        .replace(/^const\s+GAMES_DATA\s*=\s*/, "")
        .replace(/;\s*$/, "");

    return JSON.parse(json);
}

function findGameIndex(games, title) {
    const normalized = normalizeTitle(title);

    return games.findIndex(
        g => normalizeTitle(g.title) === normalized
    );
}

async function processGame(games, epicGame) {
    const today = epicGame.date;

    const index = findGameIndex(games, epicGame.title);

    // -------------------------------------------------
    // JOGO JÁ EXISTE
    // -------------------------------------------------
    if (index !== -1) {
        const game = games[index];

        const exists = game.claims.some(
            c => c.date === today && c.platform === epicGame.platform
        );

        if (!exists) {
            game.claims.push({
                date: today,
                platform: epicGame.platform
            });
        }

        game.claims = dedupeClaims(game.claims);

        recalculateDates(game);

        console.log(`↻ Atualizado: ${game.title}`);

        return;
    }

    // -------------------------------------------------
    // NOVO JOGO
    // -------------------------------------------------
    console.log(`＋ Novo jogo: ${epicGame.title}`);

    const meta = await fetchGameMetadata(epicGame.title);

    const newGame = {
        title: epicGame.title,
        storeLink: epicGame.storeLink,
        rating: meta.rating,
        metacritic: meta.metacritic,
        claims: [
            {
                date: today,
                platform: epicGame.platform
            }
        ],
        firstDate: today,
        lastDate: today,
        timesFree: 1
    };

    games.push(newGame);
}

async function main() {
    try {
        console.log("📥 Lendo games-data.js...");

        const games = loadGames();

        console.log("🎮 Consultando Epic Games...");

        const currentGames = await fetchCurrentFreeGames();

        console.log(`✓ ${currentGames.length} jogos encontrados`);

        for (const game of currentGames) {
            await processGame(games, game);
        }

        // Limpeza geral
        for (const game of games) {
            game.claims = dedupeClaims(game.claims);
            recalculateDates(game);
        }

        // Ordena pelos mais recentes
        games.sort(
            (a, b) =>
                new Date(b.lastDate) - new Date(a.lastDate)
        );

        console.log("💾 Salvando arquivo...");

        writeGamesFile(DATA_FILE, games);

        console.log("✅ Atualização concluída!");
    } catch (error) {
        console.error("❌ Erro:", error);
        process.exit(1);
    }
}

main();