import OpenAI from 'openai';
import { NewsItem, FashionUpdate } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function processUpdate(item: NewsItem, mode: 'live' | 'historical'): Promise<FashionUpdate> {
  const prompt = `
You are a structured data extractor for fashion news. Extract key information from the article below.

Article Title: ${item.title}
Article Content: ${item.content}

Return the extracted data as JSON with the following fields:
{
  "designerName": "",
  "brandName": "",
  "role": "",
  "startYear": 2024,
  "sourceUrl": "${item.link}",
  "mode": "${mode}"
}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant that extracts structured data from fashion news.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0].message?.content ?? '{}';
  console.log('[GPT Output]', content);

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse GPT response: ${content}`);
  }

  return {
    designerName: parsed.designerName,
    brandName: parsed.brandName,
    role: parsed.role,
    startYear: parsed.startYear,
    sourceUrl: parsed.sourceUrl,
    mode: parsed.mode,
  };
}
