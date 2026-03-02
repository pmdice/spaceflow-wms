import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { LogisticsIntentSchema } from '@/types/wms';

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

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Du bist ein KI-Assistent für das "SpaceFlow" Warehouse Management System.
Du musst natürliche Sprache in ein strukturiertes Intent-Objekt übersetzen.

intentType Regeln:
- intentType="filter": wenn der User nur anzeigen/filtern/hervorheben will.
- intentType="action": wenn der User eine operative Änderung auslösen will (z.B. scan, relocate, pick, load, putaway, receive, delay, set_status, set_destination).

Bei intentType="action":
- action MUSS gesetzt sein.
- filter beschreibt die Zielgruppe der Paletten.
- maxTargets: sinnvolle Anzahl 1-20, default 10 bei unklaren Fällen.
- targetPalletId optional für eine konkrete Palette (z.B. "PAL-00001").
- targetZone optional bei Umlagerungen in eine spezifische Zone (A/B/C).
- targetStatus optional bei Statusänderungen (stored/transit/delayed).
- targetDestination optional bei Zieländerungen.

Bei intentType="filter":
- action = null.
- maxTargets = 10.
- targetPalletId/targetZone/targetStatus/targetDestination = null.

Filter-Regeln:
- Wenn ein Feld nicht genannt wird: palletId = null, status/urgencyLevel = "all", destination = null, weightMinKg/weightMaxKg = null.
- Wenn der User eine konkrete Paletten-ID nennt (z.B. "PAL-00001"), setze filter.palletId.
- Gewichte immer in kg:
  - "unter Xkg" => weightMaxKg = X
  - "über Xkg" => weightMinKg = X
  - "zwischen X und Y kg" => weightMinKg = X, weightMaxKg = Y
- Farben als Hex-Code normalisieren (z.B. rot -> #ef4444).

Beispiele:
- "Show me PAL-00001." => intentType filter + filter.palletId = "PAL-00001"
- "Zeig mir alle überfälligen Lieferungen für Zürich und markiere sie rot." => intentType filter
- "Relocate alle delayed Paletten in Bern." => intentType action + action relocate
- "Scanne die schweren Zürcher Paletten." => intentType action + action scan
- "Move PAL-00001 to zone C." => intentType action + action relocate + targetPalletId + targetZone
- "Change PAL-00001 status to stored." => intentType action + action set_status + targetPalletId + targetStatus
- "Change PAL-00002 destination to Bern." => intentType action + action set_destination + targetPalletId + targetDestination`,
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            response_format: zodResponseFormat(LogisticsIntentSchema, 'logistics_intent'),
            temperature: 0.1,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('OpenAI hat keinen Inhalt zurückgegeben.');
        }

        let parsedIntent: unknown;
        try {
            parsedIntent = JSON.parse(content);
        } catch {
            throw new Error('OpenAI hat kein gültiges JSON zurückgegeben.');
        }

        const safeData = LogisticsIntentSchema.parse(parsedIntent);
        applyPromptFallbacks(safeData, prompt);
        if (safeData.intentType === 'action' && !safeData.action) {
            throw new Error('Action intent must include an action.');
        }
        if (safeData.intentType === 'filter' && safeData.action !== null) {
            throw new Error('Filter intent must not include an action.');
        }
        if (safeData.intentType === 'filter' && (safeData.targetPalletId || safeData.targetZone || safeData.targetStatus || safeData.targetDestination)) {
            throw new Error('Filter intent must not include action targeting fields.');
        }
        if (safeData.intentType === 'action' && safeData.action === 'set_status' && !safeData.targetStatus) {
            throw new Error('Status action requires targetStatus.');
        }
        if (safeData.intentType === 'action' && safeData.action === 'set_destination' && !safeData.targetDestination) {
            throw new Error('Destination action requires targetDestination.');
        }

        // Safety normalization: if model confuses status updates as destination updates.
        if (safeData.intentType === 'action' && safeData.action === 'set_destination' && safeData.targetDestination) {
            const normalized = safeData.targetDestination.trim().toLowerCase();
            if (normalized === 'stored' || normalized === 'transit' || normalized === 'delayed') {
                safeData.action = 'set_status';
                safeData.targetStatus = normalized;
                safeData.targetDestination = null;
            }
        }

        return NextResponse.json({ intent: safeData });
    } catch (error: unknown) {
        console.error('BFF Parse Intent Error:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'The AI response did not match the expected filter schema.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Interner Server Fehler bei der Intent-Erkennung.' },
            { status: 500 }
        );
    }
}

function applyPromptFallbacks(
    intent: z.infer<typeof LogisticsIntentSchema>,
    prompt: string,
) {
    const text = prompt.toLowerCase();

    // Keep intent robust for common operational phrasing if model output is too generic.
    if (intent.filter.urgencyLevel === 'all') {
        if (/\bhigh\s+urgency\b|\burgent\b|\bhoch\b|\bdringend\b/.test(text)) {
            intent.filter.urgencyLevel = 'high';
        } else if (/\bmedium\s+urgency\b|\bmittel\b/.test(text)) {
            intent.filter.urgencyLevel = 'medium';
        } else if (/\blow\s+urgency\b|\bniedrig\b/.test(text)) {
            intent.filter.urgencyLevel = 'low';
        }
    }

    if (intent.filter.status === 'all') {
        if (/\bdelayed\b|\boverdue\b|\büberfällig\b/.test(text)) {
            intent.filter.status = 'delayed';
        } else if (/\bstored\b|\blager\b/.test(text)) {
            intent.filter.status = 'stored';
        } else if (/\btransit\b|\bin transit\b/.test(text)) {
            intent.filter.status = 'transit';
        }
    }

    // Guard against model drift for explicit scan commands.
    if (intent.intentType === 'action' && /\bscan\b|\bscanne\b/.test(text)) {
        intent.action = 'scan';
        intent.targetZone = null;
        intent.targetStatus = null;
        intent.targetDestination = null;
    }
}