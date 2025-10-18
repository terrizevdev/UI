const axios = require('axios');
const cheerio = require('cheerio');

module.exports = function (app) {
    app.get('/search/resep', async (req, res) => {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                status: false,
                error: 'Parameter "q" is required.'
            });
        }

        try {
            // get search page
            const { data: html } = await axios.get(`https://cookpad.com/id/cari/${encodeURIComponent(q)}`);
            const $ = cheerio.load(html);

            // get first recipe
            const firstRecipe = $('li[id^="recipe_"]').first();
            if (!firstRecipe.length) {
                return res.status(404).json({
                    status: false,
                    error: 'Recipe not found.'
                });
            }

            const recipeId = firstRecipe.attr('id').replace('recipe_', '');
            const title = firstRecipe.find('a.block-link__main').text().trim();
            const url = `https://cookpad.com/id/resep/${recipeId}`;

            // get recipe details
            const { data: detailHtml } = await axios.get(url);
            const $detail = cheerio.load(detailHtml);

            const ldJsonScript = $detail('script[type="application/ld+json"]').toArray().map(el => {
                try {
                    return JSON.parse($detail(el).text());
                } catch {
                    return null;
                }
            }).filter(json => json && json['@type'] === 'Recipe');

            if (!ldJsonScript.length) {
                return res.status(404).json({
                    status: false,
                    error: 'Recipe details not found.'
                });
            }

            const recipeLd = ldJsonScript[0];

            const result = {
                id: recipeId,
                title: recipeLd.name || title,
                author: recipeLd.author?.name || null,
                imageUrl: recipeLd.image || $detail('meta[property="og:image"]').attr('content'),
                description: recipeLd.description || null,
                servings: recipeLd.recipeYield || null,
                prepTime: $detail('div[id*="cooking_time_recipe_"] span.mise-icon-text').first().text().trim() || null,
                ingredients: recipeLd.recipeIngredient || [],
                steps: (recipeLd.recipeInstructions || []).map(step => ({
                    text: step.text,
                    images: step.image || []
                })),
                url
            };

            res.json({
                status: true,
                creator: '@Terri',
                result
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                status: false,
                error: 'Failed to fetch data',
                message: err.message
            });
        }
    });
};