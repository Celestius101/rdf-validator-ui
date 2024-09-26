import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import Docker from "dockerode";
import stream from "stream";
import dateFormat from "dateformat";
import path from "path";
import os from "os";

const app: Express = express();
const docker: Docker = new Docker();
const upload = multer({
  dest: "uploads/",
  fileFilter: (_, file, cb) => {
    return path.extname(file.originalname).toLowerCase() === ".ttl"
      ? cb(null, true)
      : cb(new Error("Validation server accepting only turtle files."));
  },
});

dotenv.config();

const port = process.env.PORT || 3000;
const shacl_api_version = process.env.SHACL_API_VERSION || "1.4.3";

const docker_image_name = `ghcr.io/topquadrant/shacl:${shacl_api_version}`;

/**
 * Determines the relevant image to pull when building TopQuadrant API
 * based on the processor architecture.
 *
 * @return The name of the docker image to pull
 */
const getArchBase = () => {
  switch (os.arch()) {
    case "x32":
    case "x64":
      return "eclipse-temurin:11-alpine";
    case "arm":
    case "arm64":
      return "amazoncorretto:11-alpine3.18-jdk";
  }
};

/**
 * Converts the content of a stream to a string by aggregating its content gradually
 * in an array.
 *
 * @param stream The stream to convert to a string
 * @return The string resulting from the conversion
 */
const streamToString = (stream) => {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

/**
 * Pulls a specified image with Dockerode to be made available for
 * the docker daemon.
 *
 * @param imageName The name of the image to pull
 * @return A promise resolving when the image is pulled or rejecting when an error is encountered
 */
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

/**
 * Builds the image ghcr.io/topquadrant/shacl:{VERSION}
 *
 * @return A promise resolving when the image is built or rejecting when an error is encountered.
 */
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
          ARCH_BASE: getArchBase(),
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

// Setting up /validate endpoint
app.use(cors());
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
        res.setHeader("content-type", "text/turtle");
        res.send(await streamToString(outputStream));
      }
    );
  }
);

/* 
  Main execution pipeline
  1. Check for already present docker image
  2. Pull images and build image if needed
  3. Server starts listening
*/
docker
  .listImages({
    filters: {
      reference: [docker_image_name],
    },
  })
  .then((images) => {
    return images.length === 0
      ? Promise.all([pullImage(getArchBase()), pullImage("alpine:3.18")]).then(
          buildImage
        )
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
