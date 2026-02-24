import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { LogisticsFilterSchema } from '@/types/wms';

// Ensure this route runs in the Node.js runtime (OpenAI SDK compatibility)
export const runtime = 'nodejs';

// Initialisiere den OpenAI Client.
const openai = new OpenAI();

export async function POST(request: Request) {
    try {
        // 1. Request Body parsen
        const body = await request.json();
        const { prompt } = body;

        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Ein gültiger Text-Prompt wird benötigt.' },
                { status: 400 }
            );
        }

        // 2. OpenAI Aufruf (stable API) + Structured Outputs via response_format
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

        // 3. Content holen und JSON parsen (statt .beta...parse())
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

        // 4. Double-Check Security (Zod Validierung auf unserem eigenen Server)
        const safeData = LogisticsFilterSchema.parse(parsedFilter);

        // 5. Saubere Daten ans Frontend zurückliefern
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