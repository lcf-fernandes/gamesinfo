const EPIC_API =
  "https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?locale=en-US&country=US&allowCountries=US";

async function fetchEpicGames() {
  const response = await fetch(EPIC_API);

  if (!response.ok) {
    throw new Error("Erro ao consultar a Epic Games.");
  }

  const json = await response.json();

  const elements =
    json.data.Catalog.searchStore.elements ?? [];

  const games = [];

  for (const game of elements) {

    if (!game.promotions) continue;

    const offers =
      game.promotions.promotionalOffers ?? [];

    if (!offers.length) continue;

    const offer = offers[0].promotionalOffers[0];

    if (!offer) continue;

    const totalPrice = game.price?.totalPrice;

    if (!totalPrice) continue;

    if (totalPrice.discountPrice !== 0) continue;

    const slug =
      game.catalogNs?.mappings?.[0]?.pageSlug ??
      game.productSlug ??
      "";

    games.push({
      id: game.id,
      title: game.title,
      slug,
      developer: game.developerDisplayName ?? "",
      publisher: game.publisherDisplayName ?? "",
      image:
        game.keyImages?.find(
          i => i.type === "DieselStoreFrontWide"
        )?.url ??
        game.keyImages?.[0]?.url ??
        "",
      storeLink: `https://store.epicgames.com/en-US/p/${slug}`,
      description: game.description ?? "",
      startDate: offer.startDate,
      endDate: offer.endDate
    });
  }

  return games;
}

export default fetchEpicGames;