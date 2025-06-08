from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load API key from .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
model = "learnlm-2.0-flash-experimental"

FOOD_QA_DATABASE = {
    "biscuit_flour_contamination": {
        "questions": [
            "Which biscuit ingredient is identified as the primary source of heavy metal contamination?",
            "Does flour used in biscuits cause contamination?",
            "How does wheat flour introduce heavy metals into biscuits?"
        ],
        "answer": "Flour is the main source of contamination in biscuits due to pesticide residues, fertilizers, and irrigation with polluted water during wheat cultivation."
    },
    "biscuit_processing_contaminants": {
        "questions": [
            "What specific contaminants can enter biscuits during production?",
            "How do processing stages affect contamination in biscuits?",
            "What are potential contamination sources in biscuit factories?"
        ],
        "answer": "Contaminants like cadmium (Cd), lead (Pb), chromium (Cr), copper (Cu), manganese (Mn), iron (Fe), and zinc (Zn) can enter from raw materials, processing equipment, and packaging stages."
    },
    "sugar_and_sweetener_risks": {
        "questions": [
            "How can sugar contribute to biscuit health risks beyond its calorie content?",
            "What happens when artificial sweeteners replace sugar in biscuits?",
            "Why is sugar a concern in biscuits apart from sweetness?"
        ],
        "answer": "Sugar contributes to texture and flavor, but due to its high energy value, manufacturers may use artificial sweeteners like saccharin or aspartame, which can carry additional health concerns when overused."
    },
    "fat_and_fat_substitutes": {
        "questions": [
            "What are the risks associated with fat substitutes in biscuits?",
            "Is using less fat in biscuits always safer?",
            "Do fat replacers affect the quality of biscuits?"
        ],
        "answer": "Fat substitutes reduce saturated fat intake but may affect texture and, in some cases, involve synthetic compounds whose long-term effects are still debated."
    },
    "emulsifier_use_in_biscuits": {
        "questions": [
            "Which emulsifier is commonly used in biscuits, and why?",
            "What role does lecithin play in biscuit production?",
            "Are emulsifiers safe in biscuits?"
        ],
        "answer": "Lecithin is a widely used emulsifier that helps fat distribution and improves dough texture, and it's considered safer and more nutritious than some alternatives."
    },
    "cadmium_and_biscuits": {
        "questions": [
            "Why is cadmium considered highly dangerous even at low levels in biscuits?",
            "What are the effects of cadmium in food?",
            "How does cadmium in biscuits affect human health?"
        ],
        "answer": "Cadmium is extremely toxic even in low concentrations, and prolonged exposure can lead to kidney damage, bone disorders like osteoporosis, and increased cancer risk."
    },
    "lead_exposure_risks": {
        "questions": [
            "What makes lead contamination in biscuits particularly harmful for children?",
            "Why is lead dangerous in food products like biscuits?",
            "How does lead exposure affect the human body?"
        ],
        "answer": "Lead is highly toxic, especially for children due to their fast metabolism. It can cause neurological damage, cognitive delays, and developmental disorders even in small amounts."
    },
    "chromium_toxicity": {
        "questions": [
            "How does excess chromium (Cr VI) in biscuits affect the human body?",
            "What are the health risks of Cr VI in biscuits?",
            "Is chromium safe in food?"
        ],
        "answer": "Cr (III) helps in metabolism, but Cr (VI) is carcinogenic and can cause liver/kidney failure, respiratory damage, and immune system problems."
    },
    "iron_and_health_risks": {
        "questions": [
            "In what way can iron, usually an essential nutrient, become dangerous in biscuits?",
            "Can iron fortification in biscuits be harmful?",
            "What is the risk of iron poisoning from food?"
        ],
        "answer": "Excess iron can cause DNA damage and oxidative stress, especially in children, and can increase cancer and metabolic disease risk if consumed in high amounts."
    },
    "copper_in_food": {
        "questions": [
            "How does copper toxicity manifest from contaminated food like biscuits?",
            "Is copper dangerous when present in high quantities in food?",
            "What are the symptoms of copper poisoning?"
        ],
        "answer": "High copper intake from contaminated food may cause nausea, jaundice, cramps, liver and kidney dysfunction, and neurological issues."
    },
    "fao_who_limits": {
        "questions": [
            "What are the FAO/WHO maximum permitted levels for lead and cadmium in food?",
            "How much lead or cadmium is allowed in biscuits?",
            "What are the safe thresholds for heavy metals in food?"
        ],
        "answer": "FAO/WHO limits: Lead (0.3 mg/kg), Cadmium (0.2 mg/kg), Chromium (2.3 mg/kg), Copper (73.3 mg/kg), Iron (426 mg/kg), Zinc (99.4 mg/kg), Manganese (500 mg/kg)."
    },
    "exceeding_safe_limits": {
        "questions": [
            "Which types of biscuits showed lead or chromium concentrations above safe limits?",
            "Have any studies found unsafe biscuits based on contamination?",
            "Are biscuits in all regions equally safe?"
        ],
        "answer": "Biscuits from Nigeria and Iran showed lead concentrations up to 4.0 mg/kg and chromium up to 2.366 mg/kg, which exceeded FAO/WHO limits."
    },
    "lab_detection_methods": {
        "questions": [
            "What analytical methods were used to detect contaminants in biscuits?",
            "How do labs test biscuits for heavy metals?",
            "Are food contamination readings always reliable?"
        ],
        "answer": "Lab methods used include ICP-AES, AAS, FAAS, and ICP-MS. Results can vary based on sample handling and equipment calibration."
    },
    "trace_metal_safety": {
        "questions": [
            "Which elements were not detected or remained within safe limits across most studies?",
            "Are zinc and manganese in biscuits safe?",
            "Did all tested metals exceed limits?"
        ],
        "answer": "Zinc, manganese, iron, and copper typically remained within safe WHO limits in most biscuit samples analyzed from Romania, Turkey, and Spain."
    },
    "manganese_and_metabolism": {
        "questions": [
            "What role do trace elements like manganese play in the body, and what are the effects of excess?",
            "Why is manganese both essential and risky?",
            "What happens if you consume too much manganese?"
        ],
        "answer": "Manganese supports metabolism and bone health, but excess intake can cause tremors, speech disorders, muscle cramps, and neurological damage."
    },
    "iron_in_children": {
        "questions": [
            "How can iron-rich biscuits become a health concern despite nutritional benefits?",
            "Is iron toxicity a concern in children?",
            "What are the risks of iron in fortified biscuits?"
        ],
        "answer": "Iron overdose in children can cause oxidative damage and increase disease risk. Fortified or contaminated biscuits can unintentionally contribute to excess intake."
    },
    "snack_food_safety": {
        "questions": [
            "Why is monitoring snack foods like biscuits critical from a public health perspective?",
            "Can regular snack consumption increase health risks?",
            "Why should packaged foods be tested for metals?"
        ],
        "answer": "Because biscuits are widely consumed, even small levels of contaminants can accumulate over time, posing chronic health risks, especially to children."
    },
    "non_ingredient_contamination": {
        "questions": [
            "What non-ingredient factors contribute to biscuit contamination?",
            "Can packaging or equipment affect biscuit safety?",
            "Are storage conditions a contamination risk?"
        ],
        "answer": "Yes, contamination can occur via machinery, industrial pollution, packaging, or poor storage — even if the ingredients themselves are initially safe."
    },
    "reading_labels_for_safety": {
        "questions": [
            "How can consumers interpret biscuit labels to assess risk?",
            "What should I look for on biscuit ingredient lists?",
            "Do certifications help in choosing safe biscuits?"
        ],
        "answer": "Check for food safety certifications, avoid artificial colors/additives, and prefer clear ingredient lists. Organic and certified products are generally safer."
    }
}

def find_matching_answer(user_input):
    user_input = user_input.lower()
    for topic in FOOD_QA_DATABASE:
        for question in FOOD_QA_DATABASE[topic]["questions"]:
            if any(keyword in user_input for keyword in question.split()):
                return FOOD_QA_DATABASE[topic]["answer"]
    return None

def find_relevant_samples(user_input, max_samples=3):
    """Find relevant sample QA pairs based on user input keywords"""
    user_input = user_input.lower()
    relevant_samples = []
    
    for topic, qa_data in FOOD_QA_DATABASE.items():
        for question in qa_data["questions"]:
            # Check if any keywords from user input match the sample question
            if any(keyword in question.lower() for keyword in user_input.split()):
                relevant_samples.append({
                    "question": question,
                    "answer": qa_data["answer"]
                })
                break  # Only take one example per topic
        
        if len(relevant_samples) >= max_samples:
            break
            
    return relevant_samples

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    print("\n" + "="*50)
    print("User Question:", user_input)
    print("="*50)

    if not user_input:
        return jsonify({"reply": "No message received"}), 400

    # Find relevant sample QA pairs
    relevant_samples = find_relevant_samples(user_input)
    
    # Create context examples from relevant samples
    sample_context = ""
    if relevant_samples:
        sample_context = "Here are some relevant examples to learn from:\n"
        for sample in relevant_samples:
            sample_context += f"Q: {sample['question']}\nA: {sample['answer']}\n\n"
    
    try:
        # Chat context
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(
                    text="""You are a specialized food label analysis and health advice chatbot. ALWAYS provide responses in the following format with 2-3 complete sentences:

1. First sentence: Direct answer with key information
2. Second/Third sentence: Include either practical advice, health implications, or specific examples as relevant

Keep responses concise but informative."""
                )]
            ),
            types.Content(
                role="model",
                parts=[types.Part.from_text(
                    text="""I will provide concise 2-3 sentence responses that combine key information with practical advice or examples."""
                )]
            ),
        ]

        # Add relevant samples to context if available
        if sample_context:
            contents.extend([
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=sample_context)]
                ),
                types.Content(
                    role="model",
                    parts=[types.Part.from_text(text="I'll use these examples to provide relevant information while keeping responses concise.")]
                ),
            ])

        # Add the user's current question
        contents.extend([
            types.Content(
                role="user",
                parts=[
                    types.Part.from_text(text="""Now, answer this question with specific, relevant details in 2-3 sentences."""),
                ],
            ),
            types.Content(
                role="model",
                parts=[
                    types.Part.from_text(text="I will provide a concise, relevant response using the examples while keeping to 2-3 sentences."),
                ],
            ),
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_input)]
            ),
        ])

        config = types.GenerateContentConfig(response_mime_type="text/plain")

        reply = []
        for chunk in client.models.generate_content_stream(
            model=model,
            contents=contents,
            config=config
        ):
            if chunk.text is not None:
                reply.append(chunk.text)

        final_reply = "".join(reply).strip()
        if not final_reply:
            return jsonify({"reply": "I apologize, but I couldn't generate a response. Please try again."}), 500

        print("\nRelevant samples found:", len(relevant_samples))
        #print("\nAI Model Response:", final_reply)
        print("Number of sentences:", len(final_reply.split('. ')))
        print("="*50 + "\n")
        
        return jsonify({"reply": final_reply})

    except Exception as e:
        print(f"\nError in chat endpoint: {str(e)}")
        print("="*50 + "\n")
        return jsonify({"reply": f"Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(port=5000)
