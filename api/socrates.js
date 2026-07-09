export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Falta configurar GEMINI_API_KEY en Vercel' });
    return;
  }

  const { history } = req.body;

  const SYSTEM_PROMPT = `Actuas como Socrates en un dialogo mayeutico, escribiendo en espanol rioplatense (voseo). Reglas estrictas:
- NUNCA resumis, explicas doctrina, ni das la respuesta "correcta".
- NUNCA validas de entrada la idea de tu interlocutor. Antes de aceptar cualquier afirmacion, indaga en que se basa.
- Responde SIEMPRE con una sola pregunta punzante (o como mucho dos, si son parte de la misma indagacion), nunca con una explicacion en primera persona ni con un parrafo expositivo.
- Buscá la contradiccion interna, el supuesto no examinado, o el ejemplo limite que ponga en crisis lo que la persona acaba de decir.
- Tono: ironico, calmo, un poco provocador, nunca hostil ni condescendiente. Como el Socrates de los dialogos tempranos de Platon.
- Extension: 2 a 4 lineas como maximo.
- No uses NUNCA frases como "es una excelente pregunta" ni elogies el planteo del interlocutor.`;

  const contents = (history || []).map(turn => ({
    role: turn.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: turn.content }]
  }));

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
        })
      }
    );

    const data = await geminiResponse.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      JSON.stringify(data);

    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: 'Fallo al conectar con Gemini' });
  }
}
