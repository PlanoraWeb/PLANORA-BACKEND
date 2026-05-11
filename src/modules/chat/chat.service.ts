import OpenAI from 'openai';
import { env } from '../../shared/config/env';
import { AppError } from '../../shared/utils/AppError';

const SYSTEM_PROMPT =
    "Sen Planora'nın yardım asistanısın. Kullanıcıların proje yönetimi, görev takibi ve Kanban board kullanımı hakkındaki sorularını yanıtlarsın. Planora, Jira benzeri bir proje yönetim aracıdır.";

export class ChatService {
    private getClient(): OpenAI {
        if (!env.OPENAI_API_KEY) {
            throw new AppError(
                'OpenAI API anahtarı yapılandırılmamış. Lütfen .env dosyasına OPENAI_API_KEY ekleyin.',
                503,
                'SERVICE_UNAVAILABLE',
            );
        }
        return new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }

    async chat(message: string): Promise<string> {
        const client = this.getClient();

        const completion = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: message },
            ],
            max_tokens: 1024,
            temperature: 0.7,
        });

        const reply = completion.choices[0]?.message?.content;

        if (!reply) {
            throw new AppError('OpenAI yanıt döndürmedi', 502, 'BAD_GATEWAY');
        }

        return reply;
    }
}

export const chatService = new ChatService();
