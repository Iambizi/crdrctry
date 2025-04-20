import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function main() {
  try {
    // Test with Georges Vuitton
    const query = 'Georges Vuitton fashion designer brand history tenure';
    const domain = 'wikipedia.org';
    
    // Call Cascade's search_web tool
    const response = await fetch('http://localhost:8080/api/tools/search_web', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, domain })
    });
    
    const searchResults = await response.json();
    console.log('Search results:', searchResults);

    if (searchResults && searchResults.length > 0) {
      // Call Cascade's read_url_content tool
      const contentResponse = await fetch('http://localhost:8080/api/tools/read_url_content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: searchResults[0].url })
      });
      
      const content = await contentResponse.json();
      console.log('Article content:', content);

      // Extract data using OpenAI
      const prompt = `Extract designer tenure information from this text. Format as JSON:
      {
        "designer": "Designer's full name",
        "role": "Role at the brand (e.g. Creative Director, Designer)",
        "startYear": Year they started (number),
        "endYear": Year they ended (number, optional),
        "confidence": Confidence score 0-1 based on information clarity
      }
      
      If no clear tenure information, return null.
      
      Text: ${content}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
      });

      console.log('Extracted data:', completion.choices[0].message.content);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
