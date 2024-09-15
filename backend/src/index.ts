import express, { Express } from "express";
import dotenv from "dotenv";
import multer from "multer";
import Docker from "dockerode";
import stream, { Readable } from "stream";
import dateFormat from "dateformat";
import path from "path";
const app: Express = express();
const docker: Docker = new Docker();
const upload = multer({
  dest: "uploads/",
  fileFilter: (_, file, cb) => {
    return file.mimetype === "text/turtle" &&
      path.extname(file.originalname).toLowerCase() === ".ttl"
      ? cb(null, true)
      : cb(new Error("Validation server accepting only turtle files."));
  },
});

dotenv.config();

const port = process.env.PORT || 3000;
const shacl_api_version = process.env.SHACL_API_VERSION || "1.4.3";
const docker_image_name = `ghcr.io/topquadrant/shacl:${shacl_api_version}`;

const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

const pullImage = (imageName) => {
  return new Promise((resolve, reject) => {
    console.log("Pulling image", imageName, "...");
    docker.pull(imageName, (err, stream) => {
      if (err) {
        return reject(err);
      }

      const onFinished = (err, output) => {
        if (err) {
          return reject(err);
        }
        resolve(output);
      };

      docker.modem.followProgress(stream, onFinished);
    });
  });
};

const buildImage = () => {
  return new Promise((resolve, reject) => {
    console.log("Building docker image:", docker_image_name, "...");
    docker.buildImage(
      `lib/shacl-${shacl_api_version}.tar`,
      {
        dockerfile: `.docker/Dockerfile`,
        t: docker_image_name,
        buildargs: {
          VERSION: shacl_api_version,
          ARCH_BASE: "eclipse-temurin:11-alpine",
        },
        version: "2",
      },
      (err, stream) => {
        if (err) {
          return reject(err);
        }

        const onFinished = (err, output) => {
          if (err) {
            return reject(err);
          }
          resolve(output);
        };

        docker.modem.followProgress(stream, onFinished);
      }
    );
  });
};

app.post(
  "/validate",
  upload.fields([{ name: "datafile" }, { name: "shapesfile" }]),
  (req, res) => {
    const datafile = req.files["datafile"][0];
    const shapesfile = req.files["shapesfile"][0];
    const outputStream = new stream.PassThrough();

    console.log(
      `[server][${dateFormat(
        new Date(),
        "isoDateTime"
      )}] Request received for validating RDF graph '${
        datafile.originalname
      }' with SCHACL shape '${shapesfile.originalname}'`
    );

    docker.run(
      docker_image_name,
      [
        "validate",
        "-datafile",
        `/data/${datafile.filename}`,
        "-shapesfile",
        `/data/${shapesfile.filename}`,
      ],
      outputStream,
      {
        HostConfig: {
          Binds: [`${process.cwd()}/uploads:/data`],
          AutoRemove: true,
        },
      },
      async (err, result) => {
        if (err) {
          return console.error(err);
        }

        console.log(
          `[server][${dateFormat(
            new Date(),
            "isoDateTime"
          )}] Validation completed`
        );
        res.setHeader("content-type", "text/plain");
        res.send(await streamToString(outputStream));
      }
    );
  }
);

docker
  .listImages({
    filters: {
      reference: [docker_image_name],
    },
  })
  .then((images) => {
    return images.length === 0
      ? Promise.all([
          pullImage("eclipse-temurin:11-alpine"),
          pullImage("alpine:3.18"),
        ]).then(buildImage)
      : [Promise.resolve([])];
  })
  .then(() => {
    console.log("Docker image built successfully (or already present)!");
    app.listen(port, () => {
      console.log(
        `[server][${dateFormat(
          new Date(),
          "isoDateTime"
        )}] Server is running on http://localhost:${port}`
      );
    });
  })
  .catch(console.error);
