
import { zoekVacatures } from './zoekVacatures';
import { analyseerVacature } from './analyseerVacature';
import type { InferUITools, UIMessage } from 'ai';

export const tools = {
    zoekVacatures,
    analyseerVacature,
};

export type ChatMessage = UIMessage<
    unknown,
    never,
    InferUITools<typeof tools>
>;
