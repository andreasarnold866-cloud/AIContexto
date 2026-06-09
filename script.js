export async function handler(event) {
    // Falls die Anfrage fehlerhaft ist, direkt abfangen
    if (!event || !event.body) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Ungültige Anfrage: Kein Body vorhanden." })
        };
    }

    try {
        const { text, mode, targetLanguage } = JSON.parse(event.body);

        if (!text) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Kein Text zum Verarbeiten empfangen." })
            };
        }

        let prompt = "";

        // Alle Modi vollständig ausformuliert
        if (mode === "summary") {
            prompt = "Fasse diesen Text kurz und klar zusammen:";
        } else if (mode === "explain") {
            prompt = "Erkläre diesen Text einfach für Schüler:";
        } else if (mode === "quiz") {
            prompt = "Erstelle genau 5 Quizfragen mit Lösungen aus diesem Text:";
        } else if (mode === "flashcards") {
            prompt = "Erstelle Lernkarten (Frage + Antwort) aus diesem Text:";
        } else if (mode === "grammar") {
            prompt = "Korrigiere die Grammatik und Rechtschreibung des Textes. Markiere Fehler direkt im Text nach dem Prinzip '[falsches Wort -> korrigiertes Wort]'. Füge am Ende des Textes eine gut sichtbare Trennlinie '--- LÖSUNGEN ---' ein und liste darunter alle Korrekturen übersichtlich als Liste für den Download auf.";
        } else if (mode === "translate") {
            // Vollständiges Mapping der 15 meistgesprochenen Sprachen
            const languages = {
                en: "Englisch",
                zh: "Chinesisch (Mandarin)",
                es: "Spanisch",
                hi: "Hindi",
                bn: "Bengalisch",
                pt: "Portugiesisch",
                ru: "Russisch",
                ja: "Japanisch",
                pa: "Panjabi",
                mr: "Marathi",
                te: "Telugu",
                wu: "Wu (Chinesisch)",
                fr: "Französisch",
                ko: "Koreanisch",
                de: "Deutsch"
            };
            const langName = languages[targetLanguage] || "Englisch";
            prompt = `Übersetze den folgenden Text präzise in die Sprache: ${langName}.`;
        } else {
            prompt = "Bitte bearbeite den folgenden Text:";
        }

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + process.env.OPENROUTER_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openai/gpt-4o-mini",
                messages: [
                    { role: "system", content: "Du bist ein präziser, hilfreicher Lern- und Sprachassistent für Schüler." },
                    { role: "user", content: prompt + "\n\nTEXT:\n" + text }
                ]
            })
        });

        const data = await response.json();

        if (!data.choices || data.choices.length === 0) {
            return {
                statusCode: 502,
                body: JSON.stringify({ error: "Ungültige Antwort von der OpenRouter-API erhalten." })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                result: data.choices[0].message.content
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Interner Serverfehler: " + error.message })
        };
    }
}
