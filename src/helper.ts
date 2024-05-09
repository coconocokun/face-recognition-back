import { getDownloadURL, getStorage } from "firebase-admin/storage";
import { writeFile, readFile } from "fs/promises";
import * as faceapi from "face-api.js";

export async function jsonToFile(json: any) {
  await writeFile("./refs/matcher.json", JSON.stringify(json, null, 2));
  return;
}

export async function uploadFile(path: string) {
  const bucket = getStorage().bucket();
  await bucket.upload(path, {
    destination: "gavin/matcher.json",
  });
}

export async function downloadFile(path: string) {
  const bucket = getStorage().bucket();
  const fileRef = bucket.file("test/matcher.json");
  const url = await getDownloadURL(fileRef);

  const downResult = await fetch(url);
  if (!downResult.ok) {
    return new Error("Failed to fetch the json file");
  }
  const fileData = await downResult.arrayBuffer();
  await writeFile(path, Buffer.from(fileData));
}

export async function loadFaceMatcher(jsonPath: string) {
  const data = await readFile(jsonPath, { encoding: "utf-8" });
  const faceMatcher = faceapi.FaceMatcher.fromJSON(JSON.parse(data));
  return faceMatcher;
}
