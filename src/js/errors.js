// Errors raised when a Doxygen XML page cannot be loaded.
//
// `kind` says which stage failed, so callers can react differently:
//   'not-found' - the server answered 404/410 for the XML file.
//   'http'      - the server answered with another error status (see `status`).
//   'network'   - no response: offline, CORS, DNS, timeout (see `code`).
//   'parse'     - a response arrived but is not Doxygen XML we can read.
// The underlying error is kept as `cause`.
export const DoxygenErrorKind = Object.freeze({
  NOT_FOUND: 'not-found',
  HTTP: 'http',
  NETWORK: 'network',
  PARSE: 'parse',
})

export class DoxygenPageError extends Error {
  constructor(kind, message, { pageName, baseURL, url, status, code, cause } = {}) {
    super(message, { cause })
    this.name = 'DoxygenPageError'
    this.kind = kind
    this.pageName = pageName
    this.baseURL = baseURL
    this.url = url
    this.status = status
    this.code = code
  }
}

// Classify an axios error from DoxygenService.getPage.
export function fetchError(error, { pageName, baseURL, url }) {
  const details = { pageName, baseURL, url, cause: error }
  const status = error?.response?.status
  if (status === 404 || status === 410) {
    return new DoxygenPageError(
      DoxygenErrorKind.NOT_FOUND,
      `Doxygen page '${pageName}' not found at ${url}`,
      { ...details, status }
    )
  }
  if (status !== undefined) {
    return new DoxygenPageError(
      DoxygenErrorKind.HTTP,
      `Server returned ${status} for Doxygen page '${pageName}' at ${url}`,
      { ...details, status }
    )
  }
  return new DoxygenPageError(
    DoxygenErrorKind.NETWORK,
    `Could not reach ${url} for Doxygen page '${pageName}'` +
      (error?.message ? `: ${error.message}` : ''),
    { ...details, code: error?.code }
  )
}

export function parseError(error, { pageName, baseURL, url }) {
  const reason = error instanceof Error ? error.message : String(error)
  return new DoxygenPageError(
    DoxygenErrorKind.PARSE,
    `Could not parse Doxygen page '${pageName}' from ${url}: ${reason}`,
    { pageName, baseURL, url, cause: error }
  )
}
