const catchAsync=require("./../utils/catchAsync")
const vision = require("@google-cloud/vision");
const client = new vision.ImageAnnotatorClient();

exports.ocrfunc = catchAsync(async (req, res) => {
    try {
        console.log("Received Request Body:", req.body); // Debug request body

        const { imageUrl } = req.body; // Extract imageUrl

        if (!imageUrl) {
            return res.status(400).json({ error: "No image URL provided" });
        }

        console.log("Processing Image URL:", imageUrl); // Debug image URL

        const request = {
            image: { source: { imageUri: imageUrl } },
        };

        const [result] = await client.textDetection(request);
        console.log("Vision API Response:", result); // Debug API response

        const extractedText = result.fullTextAnnotation?.text || "No text found";
        res.json({ extractedText });

    } catch (error) {
        console.error("OCR Error Details:", error);
        res.status(500).json({ error: "Failed to process image", details: error.message });
    }
});
