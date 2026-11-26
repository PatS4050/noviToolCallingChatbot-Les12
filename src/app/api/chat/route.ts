import { openai } from '@ai-sdk/openai';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  toUIMessageStream,
  stepCountIs,
  type UIMessage,
} from 'ai';
import {saveChat} from "@/lib/chat/cruds";
// import { zoekVacatures } from '@/lib/tools/zoekVacatures';
// import { analyseerVacature } from '@/lib/tools/analyseerVacature';
import { tools, type ChatMessage } from '@/lib/tools';

export async function POST(request: Request) {
  // TODO: pas de instructies aan, zodat de assistent ook je tools mag gebruiken en geen vacatures verzint
  // DONE
  // const CONTEXT = 'Je bent een assistent die antwoorden mag geven over vacatures en op internet mag zoeken naar vacatures middels tools. verzin geen informatie maar meldt als iets onbekend is met "deze info is onbekend" . Antwoord in het nederlands in maximaal 9 zinnen'
  const CONTEXT = `
Je bent een behulpzame Nederlandstalige assistent.

- Gebruik zoekVacatures wanneer de gebruiker actuele vacatures wil zoeken.
- Gebruik analyseerVacature wanneer de gebruiker een vacaturetekst plakt of vraagt om een vacaturetekst te analyseren.
- Geef de volledige vacaturetekst door en verkort het niet.
- Als analyseerVacature een foutmelding geeft, vertel de gebruiker dat de analyse niet is gelukt.
- Probeer de vacature niet alsnog zelf te analyseren of samen te vatten.
- Verzin geen gegevens en presenteer geen analyse als succesvol wanneer de tool is mislukt.
- Gebruik geen tool voor algemene vragen die niet over vacatures gaan.
- Als de gebruiker geen vacatures zoekt en geen vacaturetekst laat analyseren, antwoord dan uitsluitend met: "Uw zoekopdracht heeft geen vacatures opgeleverd."
- Als zoekVacatures geen vacatures teruggeeft, antwoord dan met diezelfde zin.
- Verzin nooit vacaturegegevens.
- Als informatie ontbreekt, geef aan dat deze onbekend is.
- Als je zoekVacatures of analyseerVacature gebruikt, geef daarna geen tekstueel antwoord.
  De vacaturekaartjes worden automatisch getoond.
- Neem geen vacaturetitels, links, salarissen of omschrijvingen over.
`;
  const TEMPERATURE = 0.7
  const MAX_OUTPUT_TOKENS = 500

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'OPENAI_API_KEY ontbreekt. Zet deze in .env.local.' },
      { status: 500 },
    );
  }

  try {
    const { id, messages }: {id: string, messages: ChatMessage[] } = await request.json();

    const recentMessages = messages.slice(-10);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: await convertToModelMessages(recentMessages),
      instructions: CONTEXT,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // TODO: voeg je tools toe, bijvoorbeeld tools: { zoekVacatures, analyseerVacature }
      //DONE
      //
      tools,
      // TODO: laat het model meerdere stappen zetten met stopWhen: isStepCount(...)
      //DONE
      stopWhen: stepCountIs(5),

      onEnd: ({usage}) => {
        console.log("Input: ", usage.inputTokens)
        console.log("Output: ", usage.outputTokens)
      }
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages: messages,
        generateMessageId: generateId,
        onError: (error) => {
          console.error('Fout bij OpenAI:', error);
          return 'Er ging iets mis bij het ophalen van een antwoord.';
        },
        onEnd: async ( { messages } ) => {
          try {
            await saveChat(id, messages)
          } catch (error) {
            console.error('Fout bij opslaan van chat:', error);
          }
        }
      }),
    });
  } catch (error) {
    console.error('Fout in /api/chat:', error);
    return Response.json({ error: 'Er ging iets mis.' }, { status: 500 });
  }
}
