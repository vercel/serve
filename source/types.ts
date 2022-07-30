// source/types.ts
// Type definitions for the CLI.

// An error thrown by any native Node modules.
export declare interface NodeError extends Error {
  code: string;
}

// A path to a file/remote resource.
export declare type Path = string;
// The port to bind the server on.
export declare type Port = number;
// The name of the host.
export declare type Host = string;
// The address of the server.
export declare interface ServerAddress {
  local?: string;
  network?: string;
  previous?: number;
}

// The endpoint the server should listen on.
export declare type ListenEndpoint =
  | number
  | `tcp://${Host}:${Port}`
  | `unix:${Path}`
  | `pipe:\\\\.\\pipe\\${Host}`;

// The parsed endpoints.
export declare interface ParsedEndpoint {
  port?: Port;
  host?: Host;
}

// An entry for URL rewrites.
export declare interface Rewrite {
  source: string;
  destination: string;
}

// An entry for redirecting a URL.
export declare type Redirect = Rewrite & {
  type: number;
};

// An entry to send headers for.
export declare interface Header {
  source: string;
  headers: {
    key: string;
    value: string;
  }[];
}

// The configuration for the CLI.
export declare interface Configuration {
  public: Path;
  cleanUrls: boolean | Path[];
  rewrites: Rewrite[];
  redirects: Redirect[];
  headers: Header[];
  directoryListing: boolean | Path[];
  unlisted: Path[];
  trailingSlash: boolean;
  renderSingle: boolean;
  symlinks: boolean;
  etag: boolean;
}

// The options you can pass to the CLI.
export declare interface Options {
  '--help': boolean;
  '--version': boolean;
  '--listen': ParsedEndpoint[];
  '--single': boolean;
  '--debug': boolean;
  '--config': Path;
  '--no-request-logging': boolean;
  '--no-clipboard': boolean;
  '--no-compression': boolean;
  '--no-etag': boolean;
  '--symlinks': boolean;
  '--cors': boolean;
  '--no-port-switching': boolean;
  '--ssl-cert': Path;
  '--ssl-key': Path;
  '--ssl-pass': string;
}

// The arguments passed to the CLI (the options + the positional arguments)
export declare type Arguments = Partial<Options> & {
  _: string[];
};
