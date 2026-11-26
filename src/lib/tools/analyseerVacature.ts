
import { tool } from 'ai';
import { z } from 'zod';
import { extractVacature } from '@/lib/vacature/actions';

export const analyseerVacature = tool({
    description:
        'Gebruik deze tool om een volledige vacaturetekst te analyseren die de gebruiker heeft geplakt. Geef de volledige tekst ongewijzigd door via het veld tekst. Gebruik deze tool niet voor gewone vragen of om zelf vacatures op te zoeken.',

    inputSchema: z.object({
        tekst: z.string()
            .min(1)
            .max(5000)
            .describe('De volledige vacaturetekst die geanalyseerd moet worden.'),
    }),

    // execute: async ({ tekst }) => {
    //     const resultaat = await extractVacature(tekst);
    //
    //     if (resultaat.error) {
    //         throw new Error(resultaat.error);
    //     }
    //
    //     if (!resultaat.vacature) {
    //         throw new Error('Er kon geen vacature uit de tekst worden gehaald.');
    //     }
    //
    //     return resultaat.vacature;
    // },

    execute: async ({ tekst }) => {
        console.log('analyseerVacature gestart');

        const resultaat = await extractVacature(tekst);

        console.log('Resultaat extractVacature:', resultaat);

        if (resultaat.error) {
            throw new Error(resultaat.error);
        }

        if (!resultaat.vacature) {
            throw new Error('Er kon geen vacature uit de tekst worden gehaald.');
        }

        console.log('analyseerVacature succesvol afgerond');

        return resultaat.vacature;
    },
});
