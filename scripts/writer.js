import fs from "fs/promises";

/**
 * Ordena os jogos pela última vez que ficaram gratuitos.
 */
function sortGames(games) {

    return [...games].sort((a, b) => {

        const dateA = new Date(a.lastDate ?? 0);
        const dateB = new Date(b.lastDate ?? 0);

        return dateB - dateA;

    });

}

/**
 * Ordena as propriedades para manter o arquivo sempre igual.
 */
function normalizeGame(game) {

    return {

        id: game.id ?? null,

        slug: game.slug ?? "",

        title: game.title,

        developer: game.developer ?? "",

        publisher: game.publisher ?? "",

        storeLink: game.storeLink ?? "",

        image: game.image ?? "",

        rating: Number(game.rating ?? 0),

        metacritic: Number(game.metacritic ?? 0),

        released: game.released ?? null,

        genres: game.genres ?? [],

        platforms: game.platforms ?? [],

        claims: [...game.claims].sort(

            (a, b) =>
                new Date(a.date) -
                new Date(b.date)

        ),

        firstDate: game.firstDate,

        lastDate: game.lastDate,

        timesFree: game.timesFree

    };

}

/**
 * Converte para um JS bonito.
 */
function buildFile(games) {

    const data = sortGames(games)
        .map(normalizeGame);

    return `/**
 * ------------------------------------------------------------------
 * Arquivo gerado automaticamente.
 * NÃO EDITE MANUALMENTE.
 * Execute:
 *
 *     npm run update
 *
 * ------------------------------------------------------------------
 */

export const GAMES_DATA = ${JSON.stringify(
        data,
        null,
        4
    )};

export default GAMES_DATA;
`;

}

/**
 * Salva games-data.js
 */
export async function writeGamesFile(
    games,
    destination = "./data/games-data.js"
) {

    const file = buildFile(games);

    await fs.writeFile(
        destination,
        file,
        "utf8"
    );

    console.log(
        `✅ ${games.length} jogos gravados em ${destination}`
    );

}