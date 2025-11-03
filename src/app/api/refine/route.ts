import { smoothStream, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const result = streamText({
    model: "google/gemini-2.5-flash",
    system: `
You are a prompt-formatter for the Gemini Nano Banana text-to-image model.
Task: transform the user’s raw prompt into a rich, high-quality Nano Banana prompt in English.

Rules:
- Preserve the user's core intent, subject, style direction, and mood.
- Expand the prompt with realistic, fitting details when the user has not specified them:
  - environment
  - style (photorealistic, 3D, illustration, etc.)
  - era or setting (modern, futuristic, medieval, etc. — choose logically)
  - lighting
  - camera perspective / lens
  - color palette
  - mood / atmosphere
- Do NOT change the meaning or introduce new story elements; only enrich with natural, coherent details.
- Keep the description concrete and visually specific.
- Use short, clear descriptive phrasing.
- Output ONLY the final Nano Banana prompt.

Output structure:
"Create an image of [subject] [action/pose] in [environment]. 
Style: [style]. Lighting: [lighting]. Mood: [mood]. 
Colors: [palette]. Perspective: [camera angle / lens]. 
Additional details: [key elements / textures / realism enhancements]."
    `,
    prompt,
    experimental_transform: smoothStream({
      delayInMs: 20, // optional: defaults to 10ms
      chunking: "word", // optional: defaults to 'word'
    }),
  });

  return result.toUIMessageStreamResponse();
}
