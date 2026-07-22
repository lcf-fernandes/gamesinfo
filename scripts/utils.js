/**
 * Retorna a data atual no formato YYYY-MM-DD
 */
export function today() {
    return new Date().toISOString().split("T")[0];
}

/**
 * Converte qualquer data para YYYY-MM-DD
 */
export function formatDate(date) {

    if (!date) return null;

    return new Date(date)
        .toISOString()
        .split("T")[0];

}

/**
 * Remove valores duplicados de um array
 */
export function unique(array = []) {
    return [...new Set(array)];
}

/**
 * Faz merge de arrays removendo duplicatas
 */
export function mergeArrays(a = [], b = []) {

    return unique([...a, ...b]);

}

/**
 * Atualiza um jogo existente com novos dados
 */
export function updateGame(existing, incoming) {

    existing.id ??= incoming.id;
    existing.slug ??= incoming.slug;

    existing.title = incoming.title;

    existing.developer =
        incoming.developer || existing.developer;

    existing.publisher =
        incoming.publisher || existing.publisher;

    existing.storeLink =
        incoming.storeLink || existing.storeLink;

    existing.image =
        incoming.image || existing.image;

    existing.rating =
        incoming.rating || existing.rating;

    existing.metacritic =
        incoming.metacritic || existing.metacritic;

    existing.released =
        incoming.released || existing.released;

    existing.genres =
        mergeArrays(
            existing.genres,
            incoming.genres
        );

    existing.platforms =
        mergeArrays(
            existing.platforms,
            incoming.platforms
        );

    return existing;

}

/**
 * Cria uma claim
 */
export function createClaim(date) {

    return {

        date: formatDate(date),

        platform: "pc"

    };

}

/**
 * Adiciona uma claim apenas se ela ainda não existir
 */
export function addClaim(game, date) {

    const claim = createClaim(date);

    const exists = game.claims.some(

        c =>
            c.date === claim.date &&
            c.platform === claim.platform

    );

    if (!exists)
        game.claims.push(claim);

}

/**
 * Log padronizado
 */
export function log(message) {

    console.log(`📦 ${message}`);

}

/**
 * Log de sucesso
 */
export function success(message) {

    console.log(`✅ ${message}`);

}

/**
 * Log de aviso
 */
export function warning(message) {

    console.log(`⚠️ ${message}`);

}

/**
 * Log de erro
 */
export function error(message) {

    console.error(`❌ ${message}`);

}