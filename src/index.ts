import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import "@tensorflow/tfjs-node";
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
  //@ts-ignore
  const result = await faceapi.detectSingleFace(img);
  // 3. Best match
  // 4. Return the results
  return res.status(200).send(result);
});

app.listen(3000, async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
  console.log("Server running on http://localhost:3000");
});
