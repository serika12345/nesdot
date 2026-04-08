import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../..", import.meta.url));

type StaticPreviewServer = Readonly<{
  dispose: () => Promise<void>;
  url: string;
}>;

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

const normalizeBasePath = (basePath: string): string => {
  const trimmedBasePath = basePath.trim();

  if (trimmedBasePath === "") {
    return "/";
  }

  const withLeadingSlash =
    trimmedBasePath.startsWith("/") === true
      ? trimmedBasePath
      : `/${trimmedBasePath}`;

  return withLeadingSlash.endsWith("/") === true
    ? withLeadingSlash
    : `${withLeadingSlash}/`;
};

const getMountedOutputDirectory = (
  rootDirectory: string,
  basePath: string,
): string => {
  if (basePath === "/") {
    return rootDirectory;
  }

  return path.join(rootDirectory, basePath.slice(1, -1));
};

const toRequestedFilePath = (pathname: string): string => {
  const relativePath = pathname.replace(/^\/+/, "");

  return pathname.endsWith("/") === true
    ? path.join(relativePath, "index.html")
    : relativePath;
};

const isInsideDirectory = (
  rootDirectory: string,
  candidatePath: string,
): boolean => {
  const relativePath = path.relative(rootDirectory, candidatePath);

  return (
    relativePath.startsWith("..") === false &&
    path.isAbsolute(relativePath) === false
  );
};

const getContentType = (filePath: string): string => {
  const extension = path.extname(filePath);

  return CONTENT_TYPES[extension] ?? "application/octet-stream";
};

const closeServer = async (server: Server): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((closeError) => {
      if (closeError instanceof Error) {
        reject(closeError);
        return;
      }

      resolve();
    });
  });
};

const isAddressInfo = (
  address: AddressInfo | string | null,
): address is AddressInfo => {
  return typeof address === "object" && "port" in Object(address);
};

const listenOnEphemeralPort = async (server: Server): Promise<number> => {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address();

  if (isAddressInfo(address) === false) {
    await closeServer(server);
    return Promise.reject(
      new Error("Static preview server did not expose a TCP port"),
    );
  }

  return address.port;
};

const createStaticPreviewServer = async (
  rootDirectory: string,
): Promise<Readonly<{ close: () => Promise<void>; port: number }>> => {
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const requestedFilePath = toRequestedFilePath(requestUrl.pathname);
    const candidatePath = path.resolve(rootDirectory, requestedFilePath);

    if (isInsideDirectory(rootDirectory, candidatePath) === false) {
      response.writeHead(403);
      response.end();
      return;
    }

    try {
      const body = readFileSync(candidatePath);

      response.writeHead(200, {
        "Content-Type": getContentType(candidatePath),
      });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });

  const port = await listenOnEphemeralPort(server);

  return {
    close: async () => {
      await closeServer(server);
    },
    port,
  };
};

export const serveBuiltAppAtBasePath = async (
  basePath: string,
): Promise<StaticPreviewServer> => {
  const normalizedBasePath = normalizeBasePath(basePath);
  const tempRootDirectory = mkdtempSync(
    path.join(tmpdir(), "nesdot-pages-smoke-"),
  );
  const buildOutputDirectory = path.join(tempRootDirectory, "build-output");
  const staticRootDirectory = path.join(tempRootDirectory, "static-root");
  const mountedOutputDirectory = getMountedOutputDirectory(
    staticRootDirectory,
    normalizedBasePath,
  );

  mkdirSync(staticRootDirectory, { recursive: true });

  execFileSync(
    "pnpm",
    [
      "exec",
      "vite",
      "build",
      "--outDir",
      buildOutputDirectory,
      "--emptyOutDir",
    ],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        VITE_BASE_PATH: normalizedBasePath,
      },
      stdio: "pipe",
    },
  );

  cpSync(buildOutputDirectory, mountedOutputDirectory, { recursive: true });

  const previewServer = await createStaticPreviewServer(staticRootDirectory);

  return {
    dispose: async () => {
      await previewServer.close();
      rmSync(tempRootDirectory, { recursive: true, force: true });
    },
    url: `http://127.0.0.1:${previewServer.port}${normalizedBasePath}`,
  };
};
