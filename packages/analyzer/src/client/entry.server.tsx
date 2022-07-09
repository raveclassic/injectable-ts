import type { EntryContext } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import React from 'react'
import { renderToString } from 'react-dom/server'

// eslint-disable-next-line import/no-default-export
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  )

  responseHeaders.set('Content-Type', 'text/html')

  return new Response('<!DOCTYPE html>' + markup, {
    status: responseStatusCode,
    headers: responseHeaders,
  })
}
