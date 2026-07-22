import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import fetchEpicGames from "./epic.js";
import { fetchGameData } from "./rawg.js";
import {
    normalizeTitle,
    removeDuplicateClaims,
    rebuildGameStats
} from "./normalize.js";
import { writeGamesFile } from "./writer.js";
import { formatDate } from "./utils.js";

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
    
    const date = formatDate(epicGame.startDate);


    const index = findGameIndex(games, epicGame.title);

    // -------------------------------------------------
    // JOGO JÁ EXISTE
    // -------------------------------------------------
    if (index !== -1) {
        const game = games[index];

        const exists = game.claims.some(
            c => c.date === date && c.platform === epicGame.platform
        );

        if (!exists) {
            game.claims.push({
                date: date,
                platform: epicGame.platform
            });
        }

        game.claims = removeDuplicateClaims(game.claims);

        rebuildGameStats(game);

        console.log(`↻ Atualizado: ${game.title}`);

        return;
    }

    // -------------------------------------------------
    // NOVO JOGO
    // -------------------------------------------------
    console.log(`＋ Novo jogo: ${epicGame.title}`);

    const meta = await fetchGameData(epicGame.title);

    const newGame = {
        title: epicGame.title,
        storeLink: epicGame.storeLink,
        rating: meta.rating,
        metacritic: meta.metacritic,
        claims: [
            {
                date: date,
                platform: epicGame.platform
            }
        ],
        firstDate: date,
        lastDate: date,
        timesFree: 1
    };

    games.push(newGame);
}

async function main() {
    try {
        console.log("📥 Lendo games-data.js...");

        const games = loadGames();

        console.log("🎮 Consultando Epic Games...");

        const currentGames = await fetchEpicGames();

        console.log(`✓ ${currentGames.length} jogos encontrados`);

        for (const game of currentGames) {
            await processGame(games, game);
        }

        // Limpeza geral
        for (const game of games) {
            game.claims = removeDuplicateClaims(game.claims);
	    rebuildGameStats(game);

        }

        // Ordena pelos mais recentes
        games.sort(
            (a, b) =>
                new Date(b.lastDate) - new Date(a.lastDate)
        );

        console.log("💾 Salvando arquivo...");

        writeGamesFile(games, DATA_FILE);

        console.log("✅ Atualização concluída!");
    } catch (error) {
        console.error("❌ Erro:", error);
        process.exit(1);
    }
}

main();