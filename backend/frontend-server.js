const { createServer } = require('http')
const { parse } = require('url')
const path = require('path')

const port = parseInt(process.env.PORT || '3000', 10)
const dir = path.join(__dirname, '..', 'frontend')

const next = require(path.join(dir, 'node_modules', 'next'))

const app = next({ dev: false, dir })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, () => {
    console.log(`> Frontend Ateliê rodando na porta ${port}`)
  })
}).catch(err => {
  console.error(err)
  process.exit(1)
})
