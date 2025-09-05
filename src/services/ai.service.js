import Conversation from '../models/Conversation.js';
import dotenv from 'dotenv';
dotenv.config();

export async function chatWithCoach({ userId, userMessage, context }) {
  const openaiKey = process.env.OPENAI_API_KEY;
  let assistantText = '';

  const systemPrompt = `You are ClimaHealth AI, a friendly coach for young asthma patients.
Use short, clear sentences. Include 1-2 actionable tips. If risk is High, advise precautions.
Context: ${JSON.stringify(context)}`;

  if (openaiKey) {
    // Use fetch to call OpenAI (models and APIs can vary; keeping generic pseudo-call)
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7
        })
      });
      const data = await resp.json();
      assistantText = data?.choices?.[0]?.message?.content || 'Stay safe and monitor your symptoms.';
    } catch (e) {
      assistantText = 'I had trouble reaching the AI service. For now: check AQI, avoid smoke, carry your inhaler.';
    }
  } else {
    // Local fallback
    const risk = context?.riskLevel || 'Low';
    if (risk === 'High') {
      assistantText = 'Air quality is poor today. Limit outdoor time, wear a mask outside, and keep your reliever inhaler with you.';
    } else if (risk === 'Moderate') {
      assistantText = 'Conditions are moderate. Avoid strenuous outdoor activity at peak hours and stay hydrated.';
    } else {
      assistantText = 'Risk is low today. Enjoy your day and keep an eye on any symptoms.';
    }
  }

  const convo = await Conversation.findOneAndUpdate(
    { userId },
    { $push: { messages: { role: 'user', text: userMessage } } },
    { upsert: true, new: true }
  );
  await Conversation.updateOne(
    { _id: convo._id },
    { $push: { messages: { role: 'assistant', text: assistantText } } }
  );

  return assistantText;
}
