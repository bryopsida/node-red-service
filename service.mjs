#!/usr/bin/env node
import { createServer } from 'node:http'
import { join } from 'node:path'
import dotenv from 'dotenv'
import RED from 'node-red'
import express from 'express'
dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || join(process.cwd(), '.env')
})

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin'
const API_PATH = process.env.API_PATH || '/'

export function getNodeRedConfig () {
  return {
    httpAdminRoot: ADMIN_PATH,
    httpNodeRoot: API_PATH,
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
  server.listen(PORT, HOST)
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
