#!/usr/bin/env node
import { createServer } from 'node:http'
import { join } from 'node:path'
import RED from 'node-red'
import express from 'express'

export function getNodeRedConfig () {
  return {
    httpAdminRoot: '/admin',
    httpNodeRoot: '/',
    userDir: join(process.cwd(), 'data'),
    functionGlobalContext: { }
  }
}

const settings = getNodeRedConfig()
const app = express()
const server = createServer(app)
RED.init(server, settings)
app.use(settings.httpAdminRoot, RED.httpAdmin)
app.use(settings.httpNodeRoot, RED.httpNode)

export async function start () {
  server.listen(3000, '0.0.0.0')
  await RED.start()
}

export async function stop () {
  server.close()
  await RED.stop()
}

if (import.meta.url.endsWith(process.argv[1])) {
  try {
    await start()
    process.on('SIGINT', async () => {
      await stop()
      process.exit(0)
    })
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}
