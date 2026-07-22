import "dotenv/config";

const API_KEY = process.env.RAWG_API_KEY;

if (!API_KEY) {
    throw new Error("RAWG_API_KEY não encontrada.");
}

const BASE_URL = "https://api.rawg.io/api/games";

function normalize(text) {
    return text
        .toLowerCase()
        .replace(/™|®/g, "")
        .replace(/[:']/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export async function fetchGameData(title) {

    const url =
        `${BASE_URL}?search=${encodeURIComponent(title)}&page_size=1&key=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok)
        throw new Error("Erro consultando RAWG.");

    const json = await response.json();

    if (!json.results.length) {

        return {
            rating: 0,
            metacritic: 0,
            genres: [],
            platforms: [],
            released: null,
            image: ""
        };

    }

    const game = json.results[0];

    return {

        rating: Number(game.rating ?? 0),

        metacritic: Number(game.metacritic ?? 0),

        released: game.released ?? null,

        image: game.background_image ?? "",

        genres:
            (game.genres ?? []).map(g => g.name),

        platforms:
            (game.platforms ?? []).map(
                p => p.platform.name
            )

    };

}