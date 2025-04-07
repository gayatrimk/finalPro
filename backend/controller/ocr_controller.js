const vision = require("@google-cloud/vision");
const multer = require("multer");
const upload = multer().single("image"); // "image" is the key from frontend form-data

const client = new vision.ImageAnnotatorClient();

exports.ocrfunc = (req, res) => {
    upload(req, res, async function (err) {
        console.log("Helllllooooooooooooooooooooooooooooo");
        if (err) {
            return res.status(400).json({ error: "Image upload failed", details: err.message });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: "No image file provided" });
            }

            console.log("Received Image:", req.file.originalname);

            const request = {
                image: { content: req.file.buffer }, // Pass image buffer directly
            };

            const [result] = await client.textDetection(request);
            const extractedText = result.fullTextAnnotation?.text || "No text found";

            res.json({ extractedText });
        } catch (error) {
            console.error("OCR Error Details:", error);
            res.status(500).json({ error: "Failed to process image", details: error.message });
        }
    });
};
