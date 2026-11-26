import { ImageAnnotatorClient } from "@google-cloud/vision";
import { join } from "path";
import { metrics } from "../general";

let imageAnnotatorClient: ImageAnnotatorClient | undefined;
const getImageAnnotatorClient = () => {
  if (imageAnnotatorClient) return imageAnnotatorClient;

  const credentialsPath =
    process.env.FIREBASE_CREDENTIALS_PATH ||
    join(process.cwd(), ".credentials/firebase.json");

  imageAnnotatorClient = new ImageAnnotatorClient({
    keyFile: credentialsPath,
  });

  return imageAnnotatorClient;
};

export const ocrImageBuffer = async (
  imageBuffer: Buffer,
): Promise<string[]> => {
  metrics.convertImageToText.inc();

  const ocrResults =
    await getImageAnnotatorClient().documentTextDetection(imageBuffer);

  const text = ocrResults
    .map((el) => {
      return el.fullTextAnnotation?.text;
    })
    .filter((el): el is string => !!el);

  return text;
};
