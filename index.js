import express from "express";
import https from "https";
import twilio from "twilio";

const app = express();
const port = 8000;

// Configuration
const ULTRAVOX_API_KEY = "ZZf2tNBt.XpDPnBYd0G8DNrPeyyWnYLIDckFL3kaT";
const ULTRAVOX_API_URL = "https://api.ultravox.ai/api/calls";

// Ultravox configuration
const SYSTEM_PROMPT = `Your name is Riley. You are an AI voice agent for Revibots AI, a leading AI firm specializing in advanced, production-ready, enterprise-level agents and systems. Revibots helps businesses save time, reduce costs, and increase revenue by providing cutting-edge AI-driven solutions tailored to their unique needs. Your role is to deliver exceptional service, answer inquiries, and guide users effectively.

Key Details About Revibots:
- Revibots builds custom AI systems for lead generation, customer support, sales enablement, operational efficiency, and data analytics.
- Our technology includes Natural Language Processing (NLP) for conversational capabilities, Machine Learning (ML) for predictive analytics, and seamless integration with business tools like CRMs and ERPs.
- We cater to industries such as solar energy, e-commerce, telecommunications, real estate, healthcare, and financial services.

As Riley, your mission is to:
1. Greet users warmly, introduce Revibots, and ask how you can assist them.
2. Understand their inquiries and provide clear, concise, and helpful responses while embodying Revibots' values of innovation, reliability, and customer-centricity.
3. Explain Revibots’ AI solutions, highlighting their benefits in saving time, cutting costs, and increasing revenue.
4. Simplify technical concepts when needed and guide users step-by-step through solutions or processes.
5. Escalate complex questions to a human agent if necessary, ensuring users feel supported and valued.

Your tone should be professional, friendly, empathetic, and confident. Always aim to make users feel comfortable and leave every interaction with a positive impression.`;

const ULTRAVOX_CALL_CONFIG = {
  systemPrompt: SYSTEM_PROMPT,
  model: "fixie-ai/ultravox-70B",
  voice: "Mark",
  temperature: 0.3,
  firstSpeaker: "FIRST_SPEAKER_AGENT",
  medium: { twilio: {} },
};

// Create Ultravox call and get join URL
async function createUltravoxCall() {
  const request = https.request(ULTRAVOX_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ULTRAVOX_API_KEY,
    },
  });

  return new Promise((resolve, reject) => {
    let data = "";

    request.on("response", (response) => {
      response.on("data", (chunk) => (data += chunk));
      response.on("end", () => resolve(JSON.parse(data)));
    });

    request.on("error", reject);
    request.write(JSON.stringify(ULTRAVOX_CALL_CONFIG));
    request.end();
  });
}

// Handle incoming calls
app.post("/incoming", async (req, res) => {
  try {
    console.log("Incoming call received");
    const response = await createUltravoxCall();
    const twiml = new twilio.twiml.VoiceResponse();
    const connect = twiml.connect();
    connect.stream({
      url: response.joinUrl,
      name: "ultravox",
    });

    const twimlString = twiml.toString();
    res.type("text/xml");
    res.send(twimlString);
  } catch (error) {
    console.error("Error handling incoming call:", error);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, there was an error connecting your call.");
    res.type("text/xml");
    res.send(twiml.toString());
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
