import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
// import "@tensorflow/tfjs-node";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import * as faceapi from "face-api.js";
import { writeFile } from "fs/promises";

//@ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const app = express();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename(req, file, cb) {
    cb(null, "face.jpg");
  },
});
const upload = multer({ storage });

app.use(bodyParser.json());

app.get("/hello", (req, res) => {
  console.log("Request received");
  return res.status(200).send({
    label: "Gavin",
    authed: true,
    percentage: 0.39,
  });
});

app.post("/face-recognition", upload.single("image"), async (req, res) => {
  // 1. Get the picture
  const file = req.file;
  if (!file) {
    return res.status(400).send({
      error: "No file",
    });
  }

  // 2. Call the faceapi function for reference image
  const refImg = await loadImage("./refs/ref.jpg");
  //@ts-ignore
  const refResult = await faceapi.detectSingleFace(refImg).withFaceLandmarks().withFaceDescriptor();

  if (!refResult) {
    // error...
    return res.status(500).send("Reference image not good");
  }
  const labeledDescriptor = new faceapi.LabeledFaceDescriptors("admin", [refResult.descriptor]);
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor);

  const matcherJson = await faceMatcher.toJSON();
  await jsonToFile(matcherJson);

  // 3. Call the faceapi function for the uploaded image
  const img = await loadImage("./uploads/face.jpg");
  //@ts-ignore
  const result = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  // 3. Best match
  if (result.length > 0) {
    let bestOne = { label: "not found", distance: 1.0 };
    result.forEach((fd) => {
      const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
      if (bestMatch.distance < bestOne.distance) {
        bestOne = {
          label: bestMatch.label,
          distance: bestMatch.distance,
        };
      }
    });
    return res.status(200).send(bestOne);
  } else {
    return res.status(400).send("Image not good");
  }
});

async function jsonToFile(json: any) {
  await writeFile("./refs/matcher.json", JSON.stringify(json, null, 2));
  return;
}

app.listen(3000, async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  console.log("Server running on http://localhost:3000");
});
