import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { LogisticsFilterSchema } from '@/types/wms';

// Ensure this route runs in the Node.js runtime (OpenAI SDK compatibility)
export const runtime = 'nodejs';

const openai = new OpenAI();

export async function POST(request: Request) {
    try {
        const contentLengthHeader = request.headers.get('content-length');
        const contentLength = contentLengthHeader ? Number.parseInt(contentLengthHeader, 10) : 0;

        if (Number.isFinite(contentLength) && contentLength > 2000) {
            return NextResponse.json(
                { error: 'Payload zu groß. Maximale Request-Größe ist 2000 Bytes.' },
                { status: 413 }
            );
        }

        const body = await request.json();
        const { prompt } = body;

        if (typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json(
                { error: 'Ein gültiger Text-Prompt wird benötigt.' },
                { status: 400 }
            );
        }

        if (prompt.length > 500) {
            return NextResponse.json(
                { error: 'Prompt ist zu lang. Maximale Länge ist 500 Zeichen.' },
                { status: 400 }
            );
        }

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Ein gültiger Text-Prompt wird benötigt.' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Du bist ein KI-Assistent für das "SpaceFlow" Warehouse Management System. 
Dein Ziel ist es, die natürliche Sprache eines Logistikers in exakte Filter-Parameter für unsere Datenbank zu übersetzen.
Wenn der User keinen spezifischen Wert für ein Feld nennt, setze es auf 'all' oder null, je nach Schema.
Interpretiere Gewichtsangaben immer in kg:
- "unter / kleiner als Xkg" => weightMaxKg = X
- "über / größer als Xkg" => weightMinKg = X
- "zwischen X und Y kg" => weightMinKg = X und weightMaxKg = Y
Wenn kein Gewicht erwähnt wird: weightMinKg = null und weightMaxKg = null.
Wandle Farbwünsche in saubere Hex-Codes um (z.B. rot -> #ef4444, grün -> #22c55e, blau -> #3b82f6).
Beispiel-Input: "Zeig mir alle überfälligen Lieferungen für Zürich und markiere sie rot."`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(LogisticsFilterSchema, 'logistics_filter'),
            temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI hat keinen Inhalt zurückgegeben.');
        }

        let parsedFilter: unknown;
        try {
            parsedFilter = JSON.parse(content);
        } catch {
            throw new Error('OpenAI hat kein gültiges JSON zurückgegeben.');
        }

        const safeData = LogisticsFilterSchema.parse(parsedFilter);

        return NextResponse.json({ filter: safeData });
    } catch (error: any) {
        console.error('BFF Parse Intent Error:', error);

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validierungsfehler bei der KI-Antwort.', details: error.errors },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Interner Server Fehler bei der Intent-Erkennung.' },
            { status: 500 }
        );
    }
}