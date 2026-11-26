// Les 12: dit component bepaalt per tool en per state wat er in de chat verschijnt.
// De opmaak staat al klaar in ToolStatus.tsx, VacatureLijst.tsx en VacatureKaart.tsx. Jij koppelt ze aan de tool-parts.
import type { ChatMessage } from '@/lib/tools';
import VacatureLijst from './VacatureLijst';
import VacatureKaart from './VacatureKaart';
import { ToolBezig, ToolFout } from './ToolStatus';

// TODO: vervang dit tijdelijke type door het type van een part uit je eigen berichttype.
//       Leid dat af met InferUITools in src/lib/chat/types.ts, bijvoorbeeld: ChatMessage['parts'][number]
// DONE
// type ToolPart = { type: string; state?: string };
type ToolPart = ChatMessage['parts'][number];

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- part gebruik je zodra je de TODO's hieronder uitwerkt
export default function ToolWeergave({ part }: { part: ToolPart }) {
    // TODO: maak een switch op part.type, met een case voor elke tool, zoals 'tool-zoekVacatures' en 'tool-analyseerVacature'
    // TODO: kijk per tool naar part.state en geef het juiste component terug:
    //   - 'input-streaming' of 'input-available': <ToolBezig tekst="Vacatures zoeken..." />
    //   - 'output-available': <VacatureLijst vacatures={part.output} /> of <VacatureKaart vacature={part.output} />
    //   - 'output-error': <ToolFout tekst="Het zoeken naar vacatures is mislukt." />
    // DONE
    // return null;
    switch (part.type) {
        case 'tool-zoekVacatures':
            switch (part.state) {
                case 'input-streaming':
                case 'input-available':
                    return <ToolBezig tekst="Vacatures zoeken via Adzuna..." />;

                case 'output-available':
                    return (
                        <VacatureLijst
                            vacatures={part.output.vacatures.map((vacature) => ({
                                id: vacature.id,
                                titel: vacature.titel,
                                bedrijf: vacature.bedrijf,
                                plaats: vacature.locatie,
                                salarisMin: vacature.salarisMin,
                                salarisMax: vacature.salarisMax,
                                url: vacature.link,
                            }))}
                        />
                    );

                case 'output-error':
                    return <ToolFout tekst="Het zoeken naar vacatures is mislukt." />;

                default:
                    return null;
            }

        case 'tool-analyseerVacature':
            switch (part.state) {
                case 'input-streaming':
                case 'input-available':
                    return <ToolBezig tekst="Vacaturetekst analyseren..." />;

                case 'output-available':
                    return <VacatureKaart vacature={part.output} />;

                case 'output-error':
                    return <ToolFout tekst="Het analyseren van de vacature is mislukt." />;

                default:
                    return null;
            }

        default:
            return null;
    }
}
