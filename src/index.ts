import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
// import "@tensorflow/tfjs-node";
import { Canvas, Image, ImageData, loadImage } from "canvas";
import * as faceapi from "face-api.js";

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
  // 2. Call the faceapi function
  const img = await loadImage("./uploads/face.jpg");
  const result = await faceapi
    //@ts-ignore
    .detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (result.length < 1) {
    return res.status(400).send("Invalid picture");
  }

  // 3-1. Get the refs
  const refImg = await loadImage("./refs/ref.jpg");
  const refResult = await faceapi
    //@ts-ignore
    .detectSingleFace(refImg)
    .withFaceLandmarks()
    .withFaceDescriptor();

  // 3-2. Best match
  if (refResult) {
    const labeledDescriptor = new faceapi.LabeledFaceDescriptors("admin", [
      refResult.descriptor,
    ]);

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptor);
    let bestOne = { label: "not found", distance: 1.0 };
    result.forEach((fd) => {
      const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
      console.log(bestMatch);
      if (bestMatch.distance < bestOne.distance) {
        bestOne = {
          label: bestMatch.label,
          distance: bestMatch.distance,
        };
      }
    });

    return res.status(200).send(bestOne);
  } else {
    return res.status(500).send("Ref picture not good");
  }

  // 4. Return the results
  // return res.status(200).send(result);
});

app.listen(3000, async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  console.log("Server running on http://localhost:3000");
});
