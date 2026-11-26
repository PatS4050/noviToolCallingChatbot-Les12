import { tool } from 'ai';
import { z } from 'zod';

const adzunaResponseSchema = z.object({
    results: z.array(
        z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            redirect_url: z.string().url(),
            salary_min: z.number().nullable().optional(),
            salary_max: z.number().nullable().optional(),
            company: z.object({
                display_name: z.string().nullable().optional(),
            }),
            location: z.object({
                display_name: z.string(),
            }),
        })
    ),
});

const zoekVacaturesInputSchema = z.object({
    what: z.string()
        .describe('De functie of het zoekwoord waarop gezocht moet worden, bijvoorbeeld software developer. Gebruik "strandjutter" als er geen functie is opgegeven.'),

    where: z.string()
        .nullable()
        .describe('De plaats waar gezocht moet worden, bijvoorbeeld Amsterdam. Gebruik null als er geen locatie is opgegeven.'),
});

export const zoekVacatures = tool({
    description:
        'Zoek actuele vacatures in Nederland via Adzuna. Gebruik deze tool wanneer de gebruiker vacatures zoekt op basis van een functie, zoekwoord of locatie. Verzin nooit vacatures og informatie.',
    inputSchema: zoekVacaturesInputSchema,


    execute: async ({ what, where }) => {
        console.log('Adzuna tool aangeroepen:', { what, where });

        try {
            const appId = process.env.ADZUNA_APP_ID;
            const appKey = process.env.ADZUNA_APP_KEY;

            if (!appId || !appKey) {
                throw new Error('Adzuna API-gegevens ontbreken.');
            }

            const params = new URLSearchParams({
                app_id: appId,
                app_key: appKey,
                what,
                results_per_page: '10',
            });

            if (where) {
                params.set('where', where);
            }

            const url =
                `https://api.adzuna.com/v1/api/jobs/nl/search/1?${params.toString()}`;

            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                throw new Error(`Adzuna API gaf status ${response.status}`);
            }

            const data: unknown = await response.json();
            const validatedData = adzunaResponseSchema.safeParse(data);

            if (!validatedData.success) {
                console.error(
                    'Ongeldige Adzuna-response:',
                    validatedData.error
                );

                throw new Error('De ontvangen vacaturegegevens zijn ongeldig.');
            }

            return {
                aantal: validatedData.data.results.length,

                vacatures: validatedData.data.results.map((vacature) => ({
                    id: vacature.id,
                    titel: vacature.title,
                    bedrijf: vacature.company.display_name ?? 'Bedrijf onbekend',
                    locatie: vacature.location.display_name,
                    omschrijving: vacature.description,
                    salarisMin: vacature.salary_min ?? null,
                    salarisMax: vacature.salary_max ?? null,
                    link: vacature.redirect_url,
                })),
            };

        } catch (error) {
            // Technische details blijven op de server.
            console.error('Fout bij zoeken naar vacatures:', error);

            // Alleen een veilige melding gaat terug naar het model.
            throw new Error(
                'Het zoeken naar vacatures is momenteel niet mogelijk. Probeer het later opnieuw.'
            );
        }
    },

});