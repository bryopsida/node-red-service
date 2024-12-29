#!/usr/bin/env node
import { createServer } from 'node:http'
import { join } from 'node:path'
import dotenv from 'dotenv'
import RED from 'node-red'
import express from 'express'
import helmet from 'helmet'
import { Strategy } from 'passport-google-oauth20'

dotenv.config({
  path: process.env.DOTENV_CONFIG_PATH || join(process.cwd(), '.env')
})

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '127.0.0.1'
const ADMIN_PATH = process.env.ADMIN_PATH || '/admin'
const API_PATH = process.env.API_PATH || '/'

export function getNodeRedConfig () {
  return {
    logging: {
      console: {
        level: 'trace',
        metrics: true,
        audit: true
      }
    },
    httpAdminRoot: ADMIN_PATH,
    httpNodeRoot: API_PATH,
    userDir: join(process.cwd(), 'data'),
    functionGlobalContext: { },
    functionExternalModules: false,
    externalModules: {
      autoInstall: false,
      palellete: {
        allowInstall: false,
        allowUpload: false,
        allowList: [],
        denyList: []
      }
    },
    modules: {
      allowInstall: false,
      allowList: [],
      denyList: []
    },
    editorTheme: {
      theme: 'dracula'
    },
    adminAuth: {
      type: 'strategy',
      strategy: {
        name: 'google',
        label: 'Sign in with Google',
        icon: 'fa-google',
        strategy: Strategy,
        options: {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.EXTERNAL_ORIGIN ?? 'http://localhost:3000'}${ADMIN_PATH}/auth/strategy/callback`,
          scope: ['profile', 'email'],
          verify: (_accessToken, _refreshToken, profile, cb) => {
            if (profile.username == null) {
              profile.username = profile.emails[0].value
            }
            cb(null, profile)
          }
        }
      },
      users: (process.env.ALLOWED_USERS ?? '').split(',').map((username) => {
        return {
          username,
          permissions: ['*']
        }
      })
    }
  }
}

const settings = getNodeRedConfig()
const app = express()
const server = createServer(app)
RED.init(server, settings)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      'script-src': ["'self'", "'unsafe-inline'"],
      'script-src-attr': ["'self'", "'unsafe-inline'"]
    }
  }
}))
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
