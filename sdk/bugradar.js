(function () {
  const scriptTag = document.currentScript;

  const apiKey = scriptTag.getAttribute("data-key");
  const endPoint = scriptTag.getAttribute("data-endpoint");

  if (!apiKey) {
    console.warn("[BugRadar] Missing data-key attribute. SDK not initialized.");
    return;
  }

  if (!endPoint) {
    console.warn(
      "[BugRadar] Missing data-endpoint attribute. SDK not initialized.",
    );
    return;
  }

  const config = {
    apiKey,
    endPoint,
  };

  window.__BugRadar__ = { config };
  console.log("[BugRadar] Initialized successfully for endpoint:", endPoint);

  function buildPayload(message, stack, extraMetadata) {
    return {
      message: String(message).trim(),
      stack: String(stack).trim(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: Object.assign(
        {
          timestamp: new Date().toISOString(),
          language: navigator.language,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
          },
        },
        extraMetadata || {},
      ),
    };
  }

  function sendPayload(payload) {
    const body = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const headers = new Headers({ "x-api-key": config.apiKey });
    }

    fetch(config.endPoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: body,
      keepalive: true,
    }).catch(function (err) {
      console.warn("[BugRadar] Failed to send error:", err.message);
    });
  }

  window.onerror = function (message, source, lineno, colno, error) {
    const stack =
      error && error.stack
        ? error.stack
        : `Error at ${source}:${lineno}:${colno}`;

    const payload = buildPayload(message, stack, {
      type: "onerror",
      source,
      lineno,
      colno,
    });
    sendPayload(payload);
  };

  window.addEventListener("unhandledrejection", function (event) {
    const error = event.reason;

    const message = error instanceof Error ? error.message : String(error);

    const stack =
      error instanceof Error && error.stack
        ? error.stack
        : `UnhandledRejection: ${message}`;

    const payload = buildPayload(message, stack, {
      type: "unhandledrejection",
    });
    sendPayload(payload);
  });
})();
