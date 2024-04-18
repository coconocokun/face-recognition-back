import express from "express";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

app.get("/hello", (req, res) => {
  console.log("Request received");
  return res.status(200).send({
    label: "Gavin",
    authed: true,
    percentage: 0.39,
  });
});

app.post("/face-recognition", async (req, res) => {
  // 1. Get the picture
  // 2. Call the faceapi function
  // 3. Best match
  // 4. Return the results
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
