/**
 * Remove caracteres especiais e padroniza o nome.
 */
export function normalizeTitle(title = "") {

    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[™®©]/g, "")
        .replace(/[:'".,!?]/g, "")
        .replace(/-/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

}

/**
 * Calcula similaridade entre duas strings.
 * Retorna um valor entre 0 e 1.
 */
export function similarity(a, b) {

    a = normalizeTitle(a);
    b = normalizeTitle(b);

    if (a === b) return 1;

    const matrix = [];

    for (let i = 0; i <= b.length; i++)
        matrix[i] = [i];

    for (let j = 0; j <= a.length; j++)
        matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {

        for (let j = 1; j <= a.length; j++) {

            if (b[i - 1] === a[j - 1]) {

                matrix[i][j] = matrix[i - 1][j - 1];

            } else {

                matrix[i][j] = Math.min(

                    matrix[i - 1][j - 1] + 1,

                    matrix[i][j - 1] + 1,

                    matrix[i - 1][j] + 1

                );

            }

        }

    }

    const distance = matrix[b.length][a.length];

    return 1 - distance / Math.max(a.length, b.length);

}

/**
 * Procura um jogo no banco.
 */
export function findExistingGame(database, title) {

    const normalized = normalizeTitle(title);

    // igualdade exata

    let found = database.find(
        game => normalizeTitle(game.title) === normalized
    );

    if (found) return found;

    // procura por similaridade

    let best = null;
    let score = 0;

    for (const game of database) {

        const s = similarity(game.title, title);

        if (s > score) {

            score = s;
            best = game;

        }

    }

    if (score >= 0.90)
        return best;

    return null;

}

/**
 * Remove claims duplicadas.
 */
export function removeDuplicateClaims(claims = []) {

    const map = new Map();

    for (const claim of claims) {

        const key =
            `${claim.date}-${claim.platform}`;

        if (!map.has(key))
            map.set(key, claim);

    }

    return [...map.values()]
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

}

/**
 * Atualiza estatísticas do jogo.
 */
export function rebuildGameStats(game) {

    game.claims = removeDuplicateClaims(game.claims);

    game.timesFree = game.claims.length;

    game.firstDate = game.claims[0]?.date ?? null;

    game.lastDate =
        game.claims[game.claims.length - 1]?.date ?? null;

    return game;

}