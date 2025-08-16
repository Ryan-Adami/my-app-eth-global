const objCopy = (obj: Record<string, string | number | Date | boolean>) => {
  if (typeof obj === "undefined" || obj === null) {
    // null or undefined
    return obj;
  } else if (Array.isArray(obj)) {
    return obj.slice();
  } else if (typeof obj === "object") {
    const copy: Record<string, string | number | Date | boolean> = {};
    Object.keys(obj).forEach(function (k) {
      copy[k] = obj[k];
    });
    return copy;
  } else {
    return obj;
  }
};

export function safeCycles() {
  const seen: string[] = [];
  return (key: string, val: string) => {
    if (!val || typeof val !== "object") {
      return val;
    }
    if (seen.indexOf(val) !== -1) {
      return "[Circular]";
    }
    seen.push(val);
    return val;
  };
}

export interface ILogger {
  debug(message: object | Error | string, ...args: unknown[]): void;
  log(message: object | Error | string, ...args: unknown[]): void;
  warn(message: object | Error | string, ...args: unknown[]): void;
  error(message: object | Error | string, ...args: unknown[]): void;
}

const logInternal = (
  method: "debug" | "info" | "log" | "warn" | "error",
  message: object | Error | string,
  ...args: unknown[]
) => {
  const argsToProcess: unknown[] = [];
  if (message instanceof Error && typeof message.stack !== "undefined") {
    const m = message.stack.split("\n");
    m.shift();
  } else if (typeof message === "object") {
    argsToProcess.push(message);
  }

  if (args.length > 0) {
    argsToProcess.push(...args);
  }

  const fields: Record<string, string | number | boolean | Date> = {};

  for (const arg of argsToProcess) {
    if (typeof arg === "object") {
      const argObj = objCopy(
        arg as Record<string, string | number | boolean | Date>
      );
      if (argObj != null && typeof argObj === "object") {
        for (const argObjKey of Object.keys(argObj)) {
          if (argObjKey !== "msg") {
            fields[argObjKey] = (
              argObj as Record<string, string | number | boolean | Date>
            )[argObjKey];
          }
        }
      }
    }
  }

  console[method](
    `frxJson_${JSON.stringify(
      {
        MessageTemplate: message,
        Properties: {
          ...(fields ?? {}),
        },
      },
      safeCycles()
    )}`
  );
};

export const logger: ILogger = {
  debug(message: object | Error | string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
      logInternal("debug", message, ...args);
    }
  },
  log(message: string, ...args: unknown[]) {
    logInternal("log", message, ...args);
  },

  warn(message: object | Error | string, ...args: unknown[]) {
    logInternal("warn", message, ...args);
  },

  error(message: object | Error | string, ...args: unknown[]) {
    logInternal("error", message, ...args);
  },
};
