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
import { zoekVacatures } from '@/lib/tools/zoekVacatures';

export async function POST(request: Request) {
  // TODO: pas de instructies aan, zodat de assistent ook je tools mag gebruiken en geen vacatures verzint
  // DONE
  const CONTEXT = 'Je bent een assistent die antwoorden mag geven over vacatures en op internet mag zoeken naar vacatures middels tools. verzin geen informatie maar meld als iets onbekend is met "deze info is onbekend" . Antwoord in het nederlands in maximaal 9 zinnen'
  const TEMPERATURE = 0.7
  const MAX_OUTPUT_TOKENS = 500

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: 'OPENAI_API_KEY ontbreekt. Zet deze in .env.local.' },
      { status: 500 },
    );
  }

  try {
    const { id, messages }: {id: string, messages: UIMessage[] } = await request.json();

    const recentMessages = messages.slice(-10);

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: await convertToModelMessages(recentMessages),
      instructions: CONTEXT,
      temperature: TEMPERATURE,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // TODO: voeg je tools toe, bijvoorbeeld tools: { zoekVacatures, analyseerVacature }
      //DONE
      tools: {
        zoekVacatures,
      },
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
