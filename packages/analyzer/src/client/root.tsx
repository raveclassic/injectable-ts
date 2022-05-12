// import type {
//   LinksFunction,
//   LoaderFunction,
//   MetaFunction,
// } from '@remix-run/node'
// import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import React from 'react'

// import tailwindStylesheetUrl from './styles/tailwind.css'
// import { getUser } from './session.server'

// export const links: LinksFunction = () => {
//   return [{ rel: 'stylesheet', href: tailwindStylesheetUrl }]
// }

// export const meta: MetaFunction = () => ({
//   charset: 'utf-8',
//   title: 'Remix Notes',
//   viewport: 'width=device-width,initial-scale=1',
// })

// type LoaderData = {
// user: Awaited<ReturnType<typeof getUser>>
// }

// export const loader: LoaderFunction = async ({ request }) => {
//   return json<LoaderData>({
// user: await getUser(request),
// })
// }

// eslint-disable-next-line import/no-default-export
export default function App() {
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          html, body {
            height: 100%;
          }
          body {
            padding: 0;
            margin: 0;
          }
        `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
