const fs = require('fs')
const request = require('request')
const Router = require('koa-router')
const debug = require('debug')('xiaoyaoji-mock-server:router')
const { mockResponse } = require('./mock')

function getProjectData(url) {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        // debug(JSON.stringify(body))
        resolve(body)
      } else {
        debug(JSON.stringify(error))
        reject(error)
      }
    })
  })
}

async function genRouter(profile, prefixs) {
  const router = new Router()

  debug('profile: ' + profile)
  const profileData = JSON.parse(fs.readFileSync(profile))
  const apiUrl = `${profileData.host}api/project/${profileData.projectId}.json?token=${profileData.token}`
  debug('apiUrl: ' + apiUrl)

  const projectData = JSON.parse(await getProjectData(apiUrl))
  // debug('projectData: ' + projectData)

  projectData.data.modules.forEach(module => {
    debug('******      ' + module.name + '      ****** Start')
    module.folders.forEach(folder => {
      debug('   ###      ' + folder.name + '      ### Start')
      folder.children.forEach(child => {
        const url = prefixs
          .reduce((a, c) => a.replace(c, '/api'), child.url)
          .replace('/api/api', '/api')

        debug('      ' + child.name + ' ===> ' + url)
        router.all(url, async (ctx, next) => {
          // ctx.router available
          // await next()
          if (profileData.inject[url]) {
            ctx.body = profileData.inject[url]
          } else {
            ctx.body = mockResponse(JSON.parse(child.responseArgs), profileData.dict)
          }
        })
      })
      debug('   ###      ' + folder.name + '      ### End')
    })
    debug('******      ' + module.name + '      ****** End')
  })

  return router
}

module.exports = { genRouter }
